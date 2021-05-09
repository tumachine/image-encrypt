export interface FileMeta {
  size: number;
  name: string;
}

export interface ImageMetaInfo {
  files: FileMeta[];
  r: number;
  g: number;
  b: number;
}

export class ImageEncrypt {
  private static firstBitsMasks = [0, 1, 3, 7, 15, 31, 63, 127, 255];

  static convertDataToBuffer(data: any, type: string = 'text/plain'): Promise<ArrayBuffer> {
    const blob = new Blob([data], { type });
    return blob.arrayBuffer();
  }

  static convertToBinaryString(arrayBuffer: ArrayBuffer): string {
    const uInt8Array = new Uint8ClampedArray(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uInt8Array.byteLength; i++) {
      binaryString += uInt8Array[i].toString(2).padStart(8, '0');
    }
    return binaryString;
  }

  static async encodeBinaryString(imageData: ImageData, start: number, splitOrder: number[], binaryString: string): Promise<number> {
    const sum = splitOrder.reduce((prev, curr) => prev + curr);
    const end = start + Math.ceil(binaryString.length / sum) * 4;
    this.encodeBinaryStringIntoPixelData(imageData.data, binaryString, start, end, splitOrder);
    return end;
  }

  static encodeBinaryStringIntoPixelData(imageData: Uint8ClampedArray, binaryString: string, start: number, end: number, splitOrder: number[]): void {
    let counter = 0;

    for (let i = start; i < end; i += 4) {
      imageData[i] = this.encodeByte(imageData[i], binaryString.substr(counter, splitOrder[0]).padEnd(splitOrder[0], '0'));
      counter += splitOrder[0];
      imageData[i + 1] = this.encodeByte(imageData[i + 1], binaryString.substr(counter, splitOrder[1]).padEnd(splitOrder[1], '0'));
      counter += splitOrder[1]
      imageData[i + 2] = this.encodeByte(imageData[i + 2], binaryString.substr(counter, splitOrder[2]).padEnd(splitOrder[2], '0'));
      counter += splitOrder[2];
    }
  }

  static decodePixelsRange(imageData: Uint8ClampedArray, start: number, lengthInBits: number, splitOrder: number[]): { binaryString: string, nextPixelIndex: number } {
    const pixelsRange = this.getPixelsRange(lengthInBits, splitOrder);
    const lastIndex = start + pixelsRange * 4;
    const rawPixelsData = this.extractBinaryStringRange(imageData, start, lastIndex, splitOrder);
    const binaryString = this.adjustBinaryString(rawPixelsData, lengthInBits);
    return { binaryString, nextPixelIndex: lastIndex };
  }

  static getPixelsRange(lengthInBits: number, splitOrder: number[]): number {
    const sum = splitOrder.reduce((prev, curr) => prev + curr);
    return Math.ceil(lengthInBits / sum);
  }

  static extractBinaryStringRange(imageData: Uint8ClampedArray, start: number, end: number, splitOrder: number[]) {
    let binaryString = '';
    for (let i = start; i < end; i += 4) {
      binaryString += this.decodeByte(imageData[i], splitOrder[0]);
      binaryString += this.decodeByte(imageData[i + 1], splitOrder[1]);
      binaryString += this.decodeByte(imageData[i + 2], splitOrder[2]);
    }
    return binaryString;
  }

  static adjustBinaryString(binaryString: string, length: number) {
    if (binaryString.length !== length) {
      return binaryString.slice(0, length);
    }
    return binaryString;
  }

  static convertBinaryStringToBuffer(binaryString: string): Int8Array {
    // now convert back
    const bufferArr = []
    for (let i = 0; i < binaryString.length; i += 8) {
      bufferArr.push(parseInt(binaryString.substr(i, 8), 2))
    }
    return new Int8Array(bufferArr);
  }

  static encodeByte(value: number, insert: string): number {
    if (insert === undefined) {
      return 0;
    }
    return value >> insert.length << insert.length | parseInt(insert, 2);
  }

  static decodeByte(value: number, firstBytesLength: number): string {
    if (firstBytesLength === 0) {
      return '';
    }
    return (value & ImageEncrypt.firstBitsMasks[firstBytesLength]).toString(2).padStart(firstBytesLength, '0');
  }
}
