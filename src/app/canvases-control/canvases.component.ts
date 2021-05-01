import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';

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

  constructor(private cdRef: ChangeDetectorRef) {}

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

  // binaryMasks = [1, 2, 4, 8, 16, 32, 64, 128].reverse();

  operation() {
    // const text = this.textInputEl.nativeElement.value
    // console.log(text.length)
    const text = 'Hello my name is Tumen';
    const data = new Blob([text], { type: 'text/plain' });
    data.arrayBuffer().then(buffer => {
      this.encodeData(buffer);
    })

    // const reader = new FileReader();
    // reader.onload = () => {
    //   console.log((reader.result as string).length);
    // }

    // const arr: number = [];
    data.arrayBuffer().then(buffer => {
      // const binaryArray = this.convertToBinaryArray(buffer);
      // const start = performance.now();
      // const splitBinaryArray = this.splitBinaryArray(binaryArray, [3, 4, 2]);
      // console.log(performance.now() - start);

      // const binaryString = this.convertToBinaryString(buffer);
      // const start2 = performance.now();
      // const splitArr = this.splitBinaryString(binaryString, [3, 4, 2]);
      // console.log(splitArr);
      // const decodedBuffer = this.convertToBuffer(splitArr);
      // const blob = new Blob([decodedBuffer])
      // blob.text().then(() => {})
      // console.log(performance.now() - start2);
    })
  }

  convertToBuffer(binaryString: string): Int8Array {
    // now convert back
    const bufferArr = []
    for (let i = 0; i < binaryString.length; i += 8) {
      bufferArr.push(parseInt(binaryString.substr(i, 8), 2))
    }
    return new Int8Array(bufferArr);
  }

  splitBinaryString(binaryString: string, splitOrder: number[]): string[] {
    const splitArr: string[] = [];
    // save metadata
    for (let i = 0; i < 36; i += 2) {
      splitArr.push(binaryString.substr(i, 2));
    }

    let counter = 0;
    let add = 0;
    for (let i = 36; i < binaryString.length; i += add) {
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
    let binaryString = bufferArray.byteLength.toString(2).padStart(36, '0');
    for (let i = 0; i < bufferArray.byteLength; i++) {
      binaryString += bufferArray[i].toString(2).padStart(8, '0');
    }
    return binaryString;
  }

  encodeData(data: ArrayBuffer, splitOrder: number[] = [2, 2, 2]) {
    const binaryString = this.convertToBinaryString(data);
    const splitArr = this.splitBinaryString(binaryString, splitOrder);

    const imageData = this.mainCanvas.getImageData();
    if (imageData) {
      // set metadata
      // we need to know metadata size
      let counter = 0;
      for (let i = 0; i < 36 / 6 * 4; i += 4) {
        imageData.data[i] = imageData.data[i] >> 2 << 2 | parseInt(splitArr[counter], 2);
        imageData.data[i + 1] = imageData.data[i + 1] >> 2 << 2 | parseInt(splitArr[counter + 1], 2);
        imageData.data[i + 2] = imageData.data[i + 2] >> 2 << 2 | parseInt(splitArr[counter + 2], 2);
        counter += 3;
      }

      for (let i = 36 / 6 * 4; i < imageData.data.length; i += 4) {
        imageData.data[i] = imageData.data[i] >> splitOrder[0] << splitOrder[0] | parseInt(splitArr[counter], 2);
        imageData.data[i + 1] = imageData.data[i + 1] >> splitOrder[1] << splitOrder[1] | parseInt(splitArr[counter + 1], 2);
        imageData.data[i + 2] = imageData.data[i + 2] >> splitOrder[2] << splitOrder[2] | parseInt(splitArr[counter + 2], 2);
        counter += 3;
        if (counter >= splitArr.length) {
          break;
        }
      }

      this.secondaryCanvas.putImageData(imageData);
    }
  }

  decodeData(splitOrder: number[] = [2, 2, 2]) {
    const imageData = this.secondaryCanvas.getImageData();
    if (imageData) {
      let metadataBinaryString = '';
      for (let i = 0; i < 36 / 6 * 4; i += 4) {
        metadataBinaryString += this.decodeByte(imageData.data[i], 2);
        metadataBinaryString += this.decodeByte(imageData.data[i + 1], 2);
        metadataBinaryString += this.decodeByte(imageData.data[i + 2], 2);
      }
      console.log(metadataBinaryString);

      const lengthInBytes = parseInt(metadataBinaryString, 2);
      console.log(lengthInBytes)

      let binaryString = '';
      for (let i = 36 / 6 * 4; i < imageData.data.length; i += 4) {
        binaryString += this.decodeByte(imageData.data[i], splitOrder[0]);
        binaryString += this.decodeByte(imageData.data[i + 1], splitOrder[1]);
        binaryString += this.decodeByte(imageData.data[i + 2], splitOrder[2]);
        if (binaryString.length >= lengthInBytes * 8) {
          break;
        }
      }
      console.log(binaryString)

      const decodedBuffer = this.convertToBuffer(binaryString);
      const blob = new Blob([decodedBuffer])
      blob.text().then(data => console.log(data));
    }
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
