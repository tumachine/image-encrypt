import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CanvasViewState, Color, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';
import { FormBuilder } from '@angular/forms';
import { FileMeta, ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { formatBytes, invertColor } from '../utils';
import { DomSanitizer } from '@angular/platform-browser';

enum FileType {
  Image,
  Sound,
  Document,
  Text,
  Any,
}

interface FileWrapper {
  type: FileType,
  humanReadableSize: string,
  file: File,
  objUrl: null | any,
}

interface PixelDifference {
  original: {
    r: Color;
    g: Color;
    b: Color;
    color: Color;
  };
  encrypted: {
    r: Color;
    g: Color;
    b: Color;
    color: Color;
  };
  difference: {
    r: number;
    g: number;
    b: number;
  };
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

  image!: HTMLImageElement;

  viewState!: CanvasViewState;

  metadataBitLength = 32;

  pixelDifference!: PixelDifference;

  position!: Vector;

  rangeBits = [0, 2, 4, 8, 16, 32, 64, 128, 255];

  uploadFiles: FileWrapper[] = [];

  readonly formGroup = this.fb.group({
    r: 7,
    g: 7,
    b: 7,
  })

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    const src = '../assets/images/image.jpg';
    this.image = await this.getImage(src);

    // const buffer = await ImageEncrypt.convertDataToBuffer(shake);
    const buffer = await ImageEncrypt.convertDataToBuffer( shake);
    const file = new File([buffer], 'file.txt');
    this.uploadFiles.push({ file, type: FileType.Text, humanReadableSize: formatBytes(file.size), objUrl: null });
  }

  files(files: File[]): void {
    files.forEach(file => {
      let type: FileType = FileType.Any;
      let url: string | any = null;
      if (file.type.match('image.*')) {
        console.log('is image')
        type = FileType.Image;
        url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      }
      this.uploadFiles.push({ file, type, humanReadableSize: formatBytes(file.size), objUrl: url });
    })
  }

  deleteFile(index: number) {
    this.uploadFiles.splice(index, 1);
  }

  async getImage(src: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    })
  }

  updateViewState(viewState: CanvasViewState) {
    this.viewState = viewState;
  }

  async updateImage(files: FileList) {
    const arrFiles = Array.from(files);
    if (arrFiles.length === 1) {
      const url = URL.createObjectURL(arrFiles[0]);
      this.image = await this.getImage(url as any);
    }
  }

  updatePosition(position: Vector | null) {
    if (position) {
      const originalPixel = this.mainCanvas.canvasComponent.getPixel(position);
      const encryptedPixel = this.secondaryCanvas.canvasComponent.getPixel(position);
      if (originalPixel && encryptedPixel) {
        this.position = new Vector(Math.floor(originalPixel.position.x), Math.floor(originalPixel.position.y));
        this.pixelDifference = {
          difference: {
            r: encryptedPixel.color.r - originalPixel.color.r,
            g: encryptedPixel.color.g - originalPixel.color.g,
            b: encryptedPixel.color.b - originalPixel.color.b,
          },
          original: {
            r: new Color(originalPixel.color.r, 0, 0),
            g: new Color(0, originalPixel.color.g, 0),
            b: new Color(0, 0, originalPixel.color.b),
            color: originalPixel.color,
          },
          encrypted: {
            r: new Color(encryptedPixel.color.r, 0, 0),
            g: new Color(0, encryptedPixel.color.g, 0),
            b: new Color(0, 0, encryptedPixel.color.b),
            color: encryptedPixel.color,
          },
        }
      }
      // if (pixel) {
      //   const binary = {
      //     r: pixel.color.r.toString(2).padStart(8, '0'),
      //     g: pixel.color.g.toString(2).padStart(8, '0'),
      //     b: pixel.color.b.toString(2).padStart(8, '0'),
      //     a: pixel.color.a.toString(2).padStart(8, '0'),
      //   }
      //   this.pixel = { ...pixel, binary };
      // }
      // this.position = new Vector(Math.floor(position.x), Math.floor(position.y));
    }
  }

  invertColor(color: Color) {
    return invertColor(color.r, color.g, color.b);
  }

  encodeIntoImage() {
    const meta: ImageMetaInfo = { ...this.formGroup.value, files: [] }
    this.encodeData(shake, meta);
  }

  async encodeData(data: any, meta: ImageMetaInfo) {
    const imageData = this.mainCanvas.getImageData();

    if (imageData) {
      // console.log(formatBytes((imageData.width * imageData.height) * 9 / 8));
      // console.log(formatBytes(dataBuffer.byteLength))
      // const dataBuffer = await ImageEncrypt.convertDataToBuffer(data);
      const filesInfo: FileMeta[] = [];
      const fileBinaryStrings: string[] = [];
      for (let i = 0; i < this.uploadFiles.length; i++) {
        const buffer = await this.uploadFiles[i].file.arrayBuffer();
        const fileBinaryString = ImageEncrypt.convertToBinaryString(buffer);

        filesInfo.push({ size: fileBinaryString.length, name: this.uploadFiles[i].file.name })
        fileBinaryStrings.push(fileBinaryString);
      }

      meta.files = filesInfo;

      const metadataBuffer = await ImageEncrypt.convertDataToBuffer(JSON.stringify(meta));
      const metadataBinaryString = ImageEncrypt.convertToBinaryString(metadataBuffer);
      const binaryStringOfMetadataLength = metadataBinaryString.length.toString(2).padStart(this.metadataBitLength, '0');

      const endImageIndexOfMetadataLength = await ImageEncrypt.encodeBinaryString(imageData, 0, [2, 2, 2], binaryStringOfMetadataLength);
      const endImageIndexOfMetadata = await ImageEncrypt.encodeBinaryString(imageData, endImageIndexOfMetadataLength, [2, 2, 2], metadataBinaryString);

      let startOfData = endImageIndexOfMetadata;

      for (let i = 0; i < filesInfo.length; i++) {
        startOfData = await ImageEncrypt.encodeBinaryString(imageData, startOfData, [meta.r, meta.g, meta.b], fileBinaryStrings[i]);
      }

      this.secondaryCanvas.putImageData(imageData);
    }
  }

  async decodeData() {
    const imageData = this.secondaryCanvas.getImageData();
    if (imageData) {
      const decodedLengthOfMetadata = ImageEncrypt.decodePixelsRange(imageData.data, 0, this.metadataBitLength, [2, 2, 2]);
      const lengthOfMetadataInBytes = parseInt(decodedLengthOfMetadata.binaryString, 2);

      const decodedMetadata = ImageEncrypt.decodePixelsRange(imageData.data, decodedLengthOfMetadata.nextPixelIndex, lengthOfMetadataInBytes, [2, 2, 2]);
      const decodedMetadataBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedMetadata.binaryString);
      const metadataBlob = new Blob([decodedMetadataBuffer]);
      const metadataText = await metadataBlob.text();
      const dataInfo: ImageMetaInfo = JSON.parse(metadataText);

      let decodedData = decodedMetadata;

      for (let i = 0; i < dataInfo.files.length; i++) {
        decodedData = ImageEncrypt.decodePixelsRange(imageData.data, decodedData.nextPixelIndex, dataInfo.files[i].size, [dataInfo.r, dataInfo.g, dataInfo.b]);
        const decodedBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedData.binaryString);
        const blob = new Blob([decodedBuffer])
        const file = new File([decodedBuffer], dataInfo.files[i].name)
        const decodedDataText = await file.text();
        console.log(decodedDataText);
      }
    }
  }
}
