import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CanvasComponent, CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';

interface PixelWithBinaryColors extends Pixel {
  binary: {
    r: string;
    g: string;
    b: string;
    a: string;
  }
}

@Component({
  selector: 'app-canvas-wrapper',
  templateUrl: './canvas-wrapper.component.html',
  styleUrls: ['./canvas-wrapper.component.css'],
})
export class CanvasWrapperComponent implements AfterViewInit {
  @ViewChild(CanvasComponent)
  canvasComponent!: CanvasComponent;

  @Input()
  enableFileDrop = false;

  @Input()
  set image(image: HTMLImageElement) {
    if (image) {
      this.canvasComponent.canvas.width = image.width;
      this.canvasComponent.canvas.height = image.height;

      this.canvasComponent.onResize();

      if (this.canvasComponent.ctx) {
        this.canvasComponent.ctx.drawImage(image, 0,0, this.canvasComponent.canvas.width, this.canvasComponent.canvas.height);
      }
    }
  }

  @Input()
  set viewState(viewState: CanvasViewState) {
    if (viewState && !this.canvasComponent.mouseHovered) {
      const { center, scale } = viewState;
      const { clientWidth, clientHeight } = this.canvasComponent.elRef.nativeElement;
      this.canvasComponent.pos.x = clientWidth / 2 - center.x * scale;
      this.canvasComponent.pos.y = clientHeight / 2 - center.y * scale;
      this.canvasComponent.scale = scale;
      this.canvasComponent.updateTransform();
    }
  }

  @Output()
  viewStateChange = new EventEmitter<CanvasViewState>();

  @Output()
  positionHoverChange = new EventEmitter<Vector | null>();

  @Output()
  fileDropped = new EventEmitter<FileList>();

  pixel!: PixelWithBinaryColors;

  dragFileMessage!: string;

  ngAfterViewInit() {
    this.canvasComponent.onViewStateChange = () => {
      const center = this.canvasComponent.getCenter();
      this.viewStateChange.emit({ scale: this.canvasComponent.scale, center });
    }

    this.canvasComponent.onCanvasHover = (position) => {
      this.positionHoverChange.emit(position);
    }
  }

  getImageData(): ImageData | undefined {
    return this.canvasComponent.ctx?.getImageData(0, 0, this.canvasComponent.canvas.width, this.canvasComponent.canvas.height);
  }

  putImageData(imageData: ImageData) {
    this.canvasComponent.ctx?.putImageData(imageData, 0, 0);
  }
}
