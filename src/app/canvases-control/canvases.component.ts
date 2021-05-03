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

  metadataBitLength = 36;

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
    const text = 'Harry Potter\nand the Goblet of';
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
    binaryString = binaryStringOfMetadataLength + binaryString;
    return this.splitBinaryString(binaryString, [2, 2, 2, 0]);
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
      const metadataEndIndex = this.metadataBitLength / 6 * 4;

      let metadataLengthInBytesString = this.extractBinaryStringRange(imageData.data, 0, metadataEndIndex, [2, 2, 2, 0]);

      const metadataLengthInBytes = parseInt(metadataLengthInBytesString, 2);
      const metadataLength = metadataLengthInBytes / 6 * 4;

      const metadataBinaryEndIndex = metadataLength + metadataEndIndex;
      let metadataBinaryString = this.extractBinaryStringRange(imageData.data, metadataEndIndex, metadataBinaryEndIndex, [2, 2, 2, 0]);
      if (metadataBinaryString.length !== metadataLengthInBytes) {
        metadataBinaryString = metadataBinaryString.slice(0, metadataLengthInBytes);
      }
      const decodedMetadataBuffer = this.convertBinaryStringToBuffer(metadataBinaryString);
      const metadataBlob = new Blob([decodedMetadataBuffer]);
      const metadataText = await metadataBlob.text();
      const decodedMetadata: DataInfo = JSON.parse(metadataText);

      // decode data
      const dataStart = Math.ceil(metadataBinaryEndIndex / 4) * 4;
      const splitOrder = [decodedMetadata.r, decodedMetadata.g, decodedMetadata.b, 0];
      const bitsPerPixel = decodedMetadata.r + decodedMetadata.g + decodedMetadata.b;
      const approximateDataEnd = decodedMetadata.lengthInBytes / bitsPerPixel * 4 + dataStart;

      let binaryString = this.extractBinaryStringRange(imageData.data, dataStart, approximateDataEnd, splitOrder);
      if (binaryString.length !== decodedMetadata.lengthInBytes) {
        binaryString = binaryString.slice(0, decodedMetadata.lengthInBytes);
      }

      const decodedBuffer = this.convertBinaryStringToBuffer(binaryString);
      const blob = new Blob([decodedBuffer])
      blob.text().then(data => console.log(data));
    }
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

  convertBinaryStringToBuffer(binaryString: string): Int8Array {
    // now convert back
    const bufferArr = []
    for (let i = 0; i < binaryString.length; i += 8) {
      bufferArr.push(parseInt(binaryString.substr(i, 8), 2))
    }
    return new Int8Array(bufferArr);
  }

  encodeByte(value: number, insert: string) {
    // if (insert?.length === undefined) {
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
