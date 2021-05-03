import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';
import { FormBuilder, FormGroup } from '@angular/forms';

interface DataInfo {
  infoLengthInBits: number;
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

  // must be divisible by 6
  // 32 binary length of data
  // r, g, b - 4 for each = 12
  // 4 startingIndex
  // possibly add: name, type, r, g, b
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
    const text = 'Hello my name is Tumen';
    const data = new Blob([text], { type: 'text/plain' });
    data.arrayBuffer().then(buffer => {
      this.encodeData(buffer);
    })
  }

  splitBinaryString(binaryString: string, splitOrder: number[]): string[] {
    const splitArr: string[] = [];
    // save metadata
    for (let i = 0; i < this.metadataBitLength; i += 2) {
      splitArr.push(binaryString.substr(i, 2));
    }

    let counter = 0;
    let add = 0;
    for (let i = this.metadataBitLength; i < binaryString.length; i += add) {
      add = splitOrder[counter]
      const binaryPart = binaryString.substr(i, add);
      splitArr.push(binaryPart);

      counter++;
      if (counter >= splitOrder.length) {
        counter = 0;
      }
    }
    return splitArr;
  }



  convertToBinaryString(arrayBuffer: ArrayBuffer): string {
    const bufferArray = new Uint8Array(arrayBuffer);
    // save metadata
    let binaryString = '';
    // length
    binaryString += bufferArray.byteLength.toString(2).padStart(36, '0');
    // r
    // binaryString += bufferArray.byteLength.toString(2).padStart(4, '0');
    // // g
    // binaryString += bufferArray.byteLength.toString(2).padStart(4, '0');
    // // b
    // binaryString += bufferArray.byteLength.toString(2).padStart(4, '0');
    // // start
    // binaryString += bufferArray.byteLength.toString(2).padStart(4, '0');
    for (let i = 0; i < bufferArray.byteLength; i++) {
      binaryString += bufferArray[i].toString(2).padStart(8, '0');
    }
    return binaryString;
  }

  convertDataInfoToBinaryString(dataInfo: DataInfo): string {
    // order is important
    const { lengthInBytes, infoLengthInBits, r, g, b } = dataInfo;
    let binaryString = '';
    binaryString += infoLengthInBits.toString(2).padStart(4, '0')
    binaryString += lengthInBytes.toString(2).padStart(32, '0')
    binaryString += r.toString(2).padStart(4, '0')
    binaryString += g.toString(2).padStart(4, '0')
    binaryString += b.toString(2).padStart(4, '0')
    return binaryString;
  }

  encodeData(data: ArrayBuffer, splitOrder: number[] = [2, 0, 4]) {
    const binaryString = this.convertToBinaryString(data);
    const splitArr = this.splitBinaryString(binaryString, splitOrder);

    const imageData = this.mainCanvas.getImageData();
    if (imageData) {
      for (let i = 0; i < splitArr.length; i++) {
        const imageIndex = Math.floor(i / 3) * 4 + i % 3;
        imageData.data[imageIndex] = this.encodeByte(imageData.data[imageIndex], splitArr[i]);
      }

      this.secondaryCanvas.putImageData(imageData);
    }
  }

  decodeData(splitOrder: number[] = [2, 0, 4]) {
    const imageData = this.secondaryCanvas.getImageData();
    if (imageData) {
      const metadataEndIndex = this.metadataBitLength / 6 * 4;

      const metadataBinaryString = this.extractBinaryStringRange(imageData.data, 0, metadataEndIndex, [2, 2, 2]);

      const lengthInBytes = parseInt(metadataBinaryString, 2);
      console.log(lengthInBytes)
      const dataInfo: DataInfo = {
        infoLengthInBits: metadataEndIndex,
        lengthInBytes,
        r: splitOrder[0],
        g: splitOrder[1],
        b: splitOrder[2],
      }
      const binaryString = this.extractBinaryStringData(imageData.data, dataInfo);

      // const approximateDataEnd = lengthInBinary / splitOrder.reduce((prev, curr) => prev + curr, 0) * 4 + metadataEndIndex;
      //
      // let binaryString = this.extractBinaryStringRange(imageData.data, metadataEndIndex, approximateDataEnd, splitOrder);
      // if (binaryString.length !== lengthInBinary) {
      //   binaryString = binaryString.slice(0, lengthInBinary);
      // }
      // console.log('binary OUT', binaryString)

      const decodedBuffer = this.convertBinaryStringToBuffer(binaryString);
      const blob = new Blob([decodedBuffer])
      blob.text().then(data => console.log(data));
    }
  }

  extractBinaryStringInfo(imageData: Uint8ClampedArray) {

  }

  extractBinaryStringData(imageData: Uint8ClampedArray, dataInfo: DataInfo) {
    const { r, g, b, infoLengthInBits, lengthInBytes } = dataInfo;

    const lengthInBits = lengthInBytes * 8;

    const approximateDataEnd = infoLengthInBits + lengthInBits / (r + g + b) * 4;

    let binaryString = this.extractBinaryStringRange(imageData, infoLengthInBits, approximateDataEnd, [r, g, b]);
    if (binaryString.length !== lengthInBits) {
      binaryString = binaryString.slice(0, lengthInBits);
    }
    return binaryString;
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
    return value >> insert.length << insert.length | parseInt(insert, 2);
  }

  decodeByte(value: number, firstBytesLength: number) {
    if (firstBytesLength === 0) {
      return '';
    }
    return (value & this.firstBitsMasks[firstBytesLength]).toString(2).padStart(firstBytesLength, '0');
  }
}
