import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CanvasComponent, CanvasViewState, Pixel } from '../canvas-image/canvas.component';
import { Subject } from 'rxjs';

interface CanvasPosition {
  style: string;
}

@Component({
  selector: 'app-canvases',
  templateUrl: './canvases.component.html',
  styleUrls: ['./canvases.component.css']
})
export class CanvasesComponent implements OnInit {
  @ViewChildren(CanvasComponent)
  canvasComponents!: QueryList<CanvasComponent>;

  canvases: null[] = [];

  rows = 1;
  cols = 2;

  gridClass!: string;

  selectedCanvas!: number;

  pixel!: Pixel | null;

  image!: HTMLImageElement;

  viewState!: CanvasViewState;

  constructor(private cdRef: ChangeDetectorRef) {}

  async ngOnInit() {
    const src = '../assets/images/image.jpg';
    this.image = await this.getImage(src);
    const ratio = this.image.width / this.image.height;
    console.log(ratio)
    this.canvases = [null, null];
    this.generatePosition();
    this.cdRef.detectChanges();
  }

  add() {
    const row = Math.floor(this.selectedCanvas / this.cols);
    const col = this.selectedCanvas % this.cols;
    if (this.canvases.length % this.cols === 0) {
      this.rows++;
    }
    this.canvases.push(null);
    this.generatePosition();
    setTimeout(() => {
      this.canvasComponents.forEach(canvas => canvas.onResize());
    })
  }

  getCanvasPosition() {
    const row = Math.floor(this.selectedCanvas / this.cols);
    const col = this.selectedCanvas % this.cols;
    console.log(col, row);
    // this.selectedCanvas
  }

  async getImage(src: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    })
  }

  generatePosition(): void {
    this.gridClass = `grid-cols-${this.cols} grid-rows-${this.rows}`;
  }

  canvasClick(index: number) {
    this.selectedCanvas = index;
    this.getCanvasPosition();
  }

  updateViewState(viewState: CanvasViewState) {
    this.viewState = viewState;
  }

  pixelUpdate(pixel: Pixel | null) {
    this.pixel = pixel;
  }
}
