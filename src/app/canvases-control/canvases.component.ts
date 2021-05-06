import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';
import { FormBuilder } from '@angular/forms';
import { ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { formatBytes } from '../utils';

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

  updatePosition(position: Vector | null) {
    this.position = position;
  }

  pixelUpdate(pixel: Pixel | null) {
    this.pixel = pixel;
  }

  encodeIntoImage() {
    const meta: ImageMetaInfo = {
      lengthInBytes: 0,
      r: 3,
      g: 3,
      b: 3,
    }
    this.encodeData(shake, meta);
  }

  async encodeData(data: any, meta: ImageMetaInfo) {
    const imageData = this.mainCanvas.getImageData();

    if (imageData) {
      console.log(formatBytes((imageData.width * imageData.height) * 9 / 8));
      const dataBuffer = await ImageEncrypt.convertDataToBuffer(data);
      console.log(formatBytes(dataBuffer.byteLength))
      const dataBinaryString = ImageEncrypt.convertToBinaryString(dataBuffer);
      meta.lengthInBytes = dataBinaryString.length;

      const metadataBuffer = await ImageEncrypt.convertDataToBuffer(JSON.stringify(meta));
      const metadataBinaryString = ImageEncrypt.convertToBinaryString(metadataBuffer);
      const binaryStringOfMetadataLength = metadataBinaryString.length.toString(2).padStart(this.metadataBitLength, '0');

      const endImageIndexOfMetadataLength = await ImageEncrypt.encodeBinaryString(imageData, 0, [2, 2, 2], binaryStringOfMetadataLength);
      const endImageIndexOfMetadata = await ImageEncrypt.encodeBinaryString(imageData, endImageIndexOfMetadataLength, [2, 2, 2], metadataBinaryString);

      await ImageEncrypt.encodeBinaryString(imageData, endImageIndexOfMetadata, [meta.r, meta.g, meta.b], dataBinaryString);

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

      const decodedData = ImageEncrypt.decodePixelsRange(imageData.data, decodedMetadata.nextPixelIndex, dataInfo.lengthInBytes, [dataInfo.r, dataInfo.g, dataInfo.b]);
      const decodedBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedData.binaryString);
      const blob = new Blob([decodedBuffer])
      const decodedDataText = await blob.text();
      console.log(decodedDataText);
    }
  }
}
