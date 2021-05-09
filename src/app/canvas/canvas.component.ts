import {
  Component,
  ElementRef,
  NgZone,
  Renderer2,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';

export class Vector {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y
  }
}

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 0) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toRGB() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
}

export interface CanvasViewState {
  scale: number;
  center: Vector;
}

export class Pixel {
  position: Vector;
  color: Color;

  constructor(position: Vector = new Vector(), color: Color = new Color()) {
    this.position = position;
    this.color = color;
  }
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-canvas overflow-hidden block h-full relative' },
})
export class CanvasComponent {
  @ViewChild('canvas', { static: true })
  set canvasEl(canvasRef: ElementRef<HTMLCanvasElement>) {
    this.canvasRef = canvasRef;
    this.ctx = canvasRef.nativeElement.getContext('2d');
    this.canvas = canvasRef.nativeElement;
  }

  @ViewChild('container', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  @HostListener('mouseup', ['$event'])
  mouseUp(e: MouseEvent) {
    this.mouseIsDown = false;
  }

  @HostListener('mousedown', ['$event'])
  mouseDown(e: MouseEvent) {
    this.mouseIsDown = true;
    const { offsetLeft, offsetTop } = this.elRef.nativeElement;
    this.startDragOffset.x = e.clientX - offsetLeft - this.pos.x;
    this.startDragOffset.y = e.clientY - offsetTop - this.pos.y;
  }

  @HostListener('mousemove', ['$event'])
  mouseMove(e: MouseEvent) {
    if (this.mouseIsDown) {
      const { offsetLeft, offsetTop } = this.elRef.nativeElement;
      this.pos.x = e.clientX - offsetLeft - this.startDragOffset.x;
      this.pos.y = e.clientY - offsetTop - this.startDragOffset.y;
      this.updatePosition();
    } else {
      this.emitPixelUnderMouse(e);
    }
  }

  @HostListener('mouseleave', ['$event'])
  mouseLeave(e: MouseEvent) {
    this.mouseIsDown = false;
    this.mouseHovered = false;
  }

  @HostListener('mouseenter', ['$event'])
  mouseEnter(e: MouseEvent) {
    this.mouseHovered = true;
  }

  @HostListener('wheel', ['$event'])
  wheel(e: WheelEvent) {
    const { offsetLeft, offsetTop } = this.elRef.nativeElement;
    const target = new Vector((e.clientX - offsetLeft - this.pos.x) / this.scale,(e.clientY - offsetTop - this.pos.y) / this.scale);

    if (e.deltaY > 0) {
      this.scale /= this.scaleMultiplier;
    } else {
      this.scale *= this.scaleMultiplier;
    }

    // constrain scale
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));

    this.pos.x = -target.x * this.scale + (e.clientX - offsetLeft);
    this.pos.y = -target.y * this.scale + (e.clientY - offsetTop);

    this.updatePosition();
  }

  @HostListener('window:resize', ['$event'])
  windowResize(event: Event) {
    this.onResize();
  }

  private mouseIsDown: boolean = false;

  private minScale = 0;
  private maxScale = 0;

  private limitMin = new Vector();
  private limitMax = new Vector();

  private scaleMultiplier: number = 1.5;
  private startDragOffset = new Vector();

  scale = 0;

  pos = new Vector();
  mouseHovered = false;

  ctx!: CanvasRenderingContext2D | null;
  canvas!: HTMLCanvasElement;
  canvasRef!: ElementRef<HTMLCanvasElement>;

  onViewStateChange!: () => any;
  onCanvasHover!: (position: Vector | null) => any;

  constructor(private ngZone: NgZone, private renderer: Renderer2, public elRef: ElementRef, private cdRef: ChangeDetectorRef) {}

  onResize() {
    const { offsetWidth, offsetHeight } = this.elRef.nativeElement;
    // center image
    if (this.canvas.width / this.canvas.height > offsetWidth / offsetHeight) {
      this.scale = offsetWidth / this.canvas.width;
      this.pos.y = (offsetHeight - (this.canvas.height * this.scale)) / 2;
    } else {
      this.scale = offsetHeight / this.canvas.height;
      this.pos.x = (offsetWidth - (this.canvas.width * this.scale)) / 2;
    }

    // allowed empty space is exactly half
    this.limitMin = new Vector(offsetWidth / 2, offsetHeight / 2);
    this.limitMax = new Vector(offsetWidth - this.limitMin.x, offsetHeight - this.limitMin.y);

    this.minScale = this.scale / 2;
    this.maxScale = this.scale * 150;

    this.updatePosition();
  }

  updatePosition() {
    this.constrictPosition();
    this.updateTransform();
    if (this.onViewStateChange) {
      this.onViewStateChange();
    }
  }

  updateTransform() {
    this.renderer.setStyle(this.containerRef.nativeElement, 'transform', `translate(${this.pos.x}px, ${this.pos.y}px) scale(${this.scale}, ${this.scale})`);
  }

  getCenter(): Vector {
    const { clientWidth, clientHeight, offsetLeft, offsetTop } = this.elRef.nativeElement;
    return this.getCanvasPoint(new Vector(offsetLeft + (clientWidth / 2), offsetTop + (clientHeight / 2)));
  }

  getCanvasMousePosition(e: MouseEvent): Vector {
    return this.getCanvasPoint(new Vector(e.clientX, e.clientY));
  }

  getCanvasPoint(containerPoint: Vector) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = (containerPoint.x - rect.left) / this.scale;
    const y = (containerPoint.y - rect.top) / this.scale;
    return new Vector(x, y);
  }

  constrictPosition() {
    const scaledImage = new Vector(this.canvas.width * this.scale, this.canvas.height * this.scale);

    if (this.pos.x > this.limitMin.x) {
      this.pos.x = this.limitMin.x;
    }
    const rightOfImage = this.pos.x + scaledImage.x;
    if (rightOfImage < this.limitMax.x) {
      this.pos.x = this.limitMax.x - (rightOfImage - this.pos.x);
    }

    if (this.pos.y > this.limitMin.y) {
      this.pos.y = this.limitMin.y;
    }
    const bottomOfImage = this.pos.y + scaledImage.y;
    if (bottomOfImage < this.limitMax.y) {
      this.pos.y = this.limitMax.y - (bottomOfImage - this.pos.y);
    }
  }

  getPixel(position: Vector): Pixel | null {
    const imageData = this.ctx?.getImageData(position.x, position.y, 1, 1).data;
    if (imageData) {
      const color = new Color(imageData[0], imageData[1], imageData[2], imageData[3]);
      return new Pixel(position, color);
    }
    return null;
  }

  emitPixelUnderMouse(e: MouseEvent) {
    if (this.onCanvasHover) {
      const position = this.getCanvasMousePosition(e);
      if (position.x >= 0 && position.y >= 0 && position.x < this.canvas.width && position.y < this.canvas.height) {
        this.onCanvasHover(position);
      } else {
        this.onCanvasHover(null);
      }
    }
  }

  fillPixels(...pixels: Pixel[]): void {
    const imageData = this.ctx?.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (imageData) {
      for (let i = 0; i < pixels.length; i++) {
        const dataPosition = (pixels[i].position.y * this.canvas.width + pixels[i].position.x) * 4;
        imageData.data[dataPosition] = 255;
        imageData.data[dataPosition+1] = 0;
        imageData.data[dataPosition+2] = 0;
        imageData.data[dataPosition+3] = 255;
      }
      this.ctx?.putImageData(imageData, 0, 0);
    }
  }

  placePixel({ position, color }: Pixel) {
    const imageData = this.ctx?.getImageData(position.x, position.y, 1, 1);
    if (imageData) {
      imageData.data[0] = color.r;
      imageData.data[1] = color.g
      imageData.data[2] = color.b
      imageData.data[3] = color.a;
      this.ctx?.putImageData(imageData, position.x, position.y);
    }
    return null;
  }
}
