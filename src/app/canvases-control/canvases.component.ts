import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';
import { FormBuilder, FormGroup } from '@angular/forms';

interface DataInfo {
  lengthInBytes: number;
  r: number;
  g: number;
  b: number;
}

@Component({
  selector: 'app-canvases',
  templateUrl: './canvases.component.html',
  styleUrls: ['./canvases.component.css']
})
export class CanvasesComponent implements OnInit {
  @ViewChild('mainCanvas', { static: true })
  mainCanvas!: CanvasWrapperComponent;

  @ViewChild('secondaryCanvas', { static: true })
  secondaryCanvas!: CanvasWrapperComponent;

  firstBitsMasks = [0, 1, 3, 7, 15, 31, 63, 127, 255];

  rows = 1;
  cols = 2;

  gridClass!: string;

  selectedCanvas!: number;

  pixel!: Pixel | null;

  image!: HTMLImageElement;

  viewState!: CanvasViewState;
  position!: Vector | null;

  metadataBitLength = 32;

  readonly formGroup = this.fb.group({
    red: 2,
    green: 2,
    blue: 2,
  })

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder) {}

  async ngOnInit() {
    const src = '../assets/images/image.jpg';
    this.image = await this.getImage(src);
    const ratio = this.image.width / this.image.height;
    this.cdRef.detectChanges();
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

  canvasClick(index: number) {
    this.selectedCanvas = index;
    this.getCanvasPosition();
  }

  updateViewState(viewState: CanvasViewState) {
    this.viewState = viewState;
  }

  updatePosition(position: Vector | null) {
    this.position = position;
  }

  change() {

  }

  pixelUpdate(pixel: Pixel | null) {
    this.pixel = pixel;
  }

  operation() {
    this.encodeIntoImage(shake)
  }

  convertDataToBuffer(data: any, type: string = 'text/plain'): Promise<ArrayBuffer> {
    const blob = new Blob([data], { type });
    return blob.arrayBuffer();
  }

  async encodeMetadata(meta: DataInfo) {
    const buffer = await this.convertDataToBuffer(JSON.stringify(meta));
    let binaryString = this.convertToBinaryString(buffer);
    const binaryStringOfMetadataLength = binaryString.length.toString(2).padStart(this.metadataBitLength, '0');
    return [
      ...this.splitBinaryString(binaryStringOfMetadataLength, [2, 2, 2, 0]),
      ...this.splitBinaryString(binaryString, [2, 2, 2, 0])
    ];
  }

  async encodeData(data: any, meta: DataInfo) {
    const buffer = await this.convertDataToBuffer(data);
    let binaryString = this.convertToBinaryString(buffer);
    meta.lengthInBytes = binaryString.length;
    return this.splitBinaryString(binaryString, [meta.r, meta.g, meta.b, 0]);
  }

  splitBinaryString(binaryString: string, splitOrder: number[]): string[] {
    const splitArr: string[] = [];
    let counter = 0;
    let add = 0;
    let addSum = 0;
    for (let i = 0; i < binaryString.length; i += add) {
      add = splitOrder[counter]
      addSum += add;
      const binaryPart = binaryString.substr(i, add);
      splitArr.push(binaryPart);

      counter++;
      if (counter >= splitOrder.length) {
        counter = 0;
      }
    }

    if (splitArr.length % 4 !== 0) {
      const addEmpty = Math.ceil(splitArr.length / 4) * 4 - splitArr.length;
      for (let i = 0; i < addEmpty; i++) {
        splitArr.push('');
      }
    }

    return splitArr;
  }

  convertToBinaryString(arrayBuffer: ArrayBuffer): string {
    const uInt8Array = new Uint8ClampedArray(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uInt8Array.byteLength; i++) {
      binaryString += uInt8Array[i].toString(2).padStart(8, '0');
    }
    return binaryString;
  }

  async encodeIntoImage(data: any) {
    const meta: DataInfo = {
      lengthInBytes: 0,
      r: 4,
      g: 4,
      b: 4
    }

    const encodedData = await this.encodeData(data, meta);
    const encodedMetadata = await this.encodeMetadata(meta);

    const splitArr = [...encodedMetadata, ...encodedData];

    const imageData = this.mainCanvas.getImageData();
    if (imageData) {
      for (let i = 0; i < splitArr.length; i += 4) {
        imageData.data[i] = this.encodeByte(imageData.data[i], splitArr[i]);
        imageData.data[i + 1] = this.encodeByte(imageData.data[i + 1], splitArr[i + 1]);
        imageData.data[i + 2] = this.encodeByte(imageData.data[i + 2], splitArr[i + 2]);
      }

      this.secondaryCanvas.putImageData(imageData);
    }
  }


  async decodeData() {
    const imageData = this.secondaryCanvas.getImageData();
    if (imageData) {
      const decodedLengthOfMetadata = this.decodePixelsRange(imageData.data, 0, this.metadataBitLength, [2, 2, 2]);
      const lengthOfMetadataInBytes = parseInt(decodedLengthOfMetadata.binaryString, 2);

      const decodedMetadata = this.decodePixelsRange(imageData.data, decodedLengthOfMetadata.nextPixelIndex, lengthOfMetadataInBytes, [2, 2, 2]);
      const decodedMetadataBuffer = this.convertBinaryStringToBuffer(decodedMetadata.binaryString);
      const metadataBlob = new Blob([decodedMetadataBuffer]);
      const metadataText = await metadataBlob.text();
      const dataInfo: DataInfo = JSON.parse(metadataText);

      const decodedData = this.decodePixelsRange(imageData.data, decodedMetadata.nextPixelIndex, dataInfo.lengthInBytes, [dataInfo.r, dataInfo.g, dataInfo.b]);
      const decodedBuffer = this.convertBinaryStringToBuffer(decodedData.binaryString);
      const blob = new Blob([decodedBuffer])
      const decodedDataText = await blob.text();
      console.log(decodedDataText);
    }
  }

  decodePixelsRange(imageData: Uint8ClampedArray, start: number, lengthInBits: number, splitOrder: number[]): { binaryString: string, nextPixelIndex: number } {
    const pixelsRange = this.getPixelsRange(lengthInBits, splitOrder);
    const lastIndex = start + pixelsRange * 4;
    const rawPixelsData = this.extractBinaryStringRange(imageData, start, lastIndex, splitOrder);
    const binaryString = this.adjustBinaryString(rawPixelsData, lengthInBits);
    return { binaryString, nextPixelIndex: lastIndex };
  }

  getPixelsRange(lengthInBits: number, splitOrder: number[]): number {
    const sum = splitOrder.reduce((prev, curr) => prev + curr);
    return Math.ceil(lengthInBits / sum);
  }

  extractBinaryStringRange(imageData: Uint8ClampedArray, start: number, end: number, splitOrder: number[]) {
    let binaryString = '';
    for (let i = start; i < end; i += 4) {
      binaryString += this.decodeByte(imageData[i], splitOrder[0]);
      binaryString += this.decodeByte(imageData[i + 1], splitOrder[1]);
      binaryString += this.decodeByte(imageData[i + 2], splitOrder[2]);
    }
    return binaryString;
  }

  adjustBinaryString(binaryString: string, length: number) {
    if (binaryString.length !== length) {
      return binaryString.slice(0, length);
    }
    return binaryString;
  }

  convertBinaryStringToBuffer(binaryString: string): Int8Array {
    // now convert back
    const bufferArr = []
    for (let i = 0; i < binaryString.length; i += 8) {
      bufferArr.push(parseInt(binaryString.substr(i, 8), 2))
    }
    return new Int8Array(bufferArr);
  }

  encodeByte(value: number, insert: string) {
    if (insert === undefined) {
      return 0;
    }
    return value >> insert.length << insert.length | parseInt(insert, 2);
  }

  decodeByte(value: number, firstBytesLength: number) {
    if (firstBytesLength === 0) {
      return '';
    }
    return (value & this.firstBitsMasks[firstBytesLength]).toString(2).padStart(firstBytesLength, '0');
  }
}
