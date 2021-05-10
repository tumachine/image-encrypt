import { ChangeDetectorRef, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CanvasViewState, Color, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { shake } from '../text';
import { FormBuilder } from '@angular/forms';
import { FileMeta, ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { formatBytes, invertColor } from '../utils';
import { DomSanitizer } from '@angular/platform-browser';

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

  position!: Vector;

  mainPixel!: Pixel | null;
  encryptedPixel!: Pixel | null;

  availableSpace!: number;
  availableSpaceFormatted!: string;

  totalFileSize!: number;
  totalFileSizeFormatted!: string;

  spaceLeft!: number;
  spaceLeftFormatted!: string;

  rangeBits = [0, 2, 4, 8, 16, 32, 64, 128, 255];

  files: File[] = [];

  readonly formGroup = this.fb.group({
    r: 4,
    g: 4,
    b: 4,
  })

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private sanitizer: DomSanitizer, private renderer: Renderer2) {}

  async ngOnInit() {
    const src = '../assets/images/image.jpg';
    this.image = await this.getImage(src);

    this.formGroup.valueChanges.subscribe(({ r, g, b }) => {
      this.calculateAvailableSpace(this.image, new Color(r, g, b));
    })
  }

  updateUploadFiles(files: File[]) {
    this.files = files;
    this.totalFileSize = this.files.map(file => file.size).reduce((prev, curr) => prev + curr, 0);
    this.totalFileSizeFormatted = formatBytes(this.totalFileSize);
    this.calculateSpaceLeft();
  }

  calculateAvailableSpace(image: HTMLImageElement, color: Color) {
    if (image && color) {
      this.availableSpace = Math.floor(image.width * image.height * (color.r + color.g + color.b) / 8)
      this.availableSpaceFormatted = formatBytes(this.availableSpace);
      this.calculateSpaceLeft();
    }
  }

  calculateSpaceLeft() {
    if (this.totalFileSize && this.availableSpace) {
      this.spaceLeft = this.availableSpace - this.totalFileSize;
      this.spaceLeftFormatted = formatBytes(this.spaceLeft);
    }
  }

  async getImage(src: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const { r, g, b } = this.formGroup.value;
        this.calculateAvailableSpace(image, new Color(r, g, b));
        resolve(image);
      }
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
      this.mainPixel = this.mainCanvas.canvasComponent.getPixel(position);
      this.encryptedPixel = this.secondaryCanvas.canvasComponent.getPixel(position);
      if (this.mainPixel) {
        this.position = new Vector(Math.floor(this.mainPixel.position.x), Math.floor(this.mainPixel.position.y));
      }
    }
  }

  invertColor(color: Color) {
    return invertColor(color.r, color.g, color.b);
  }

  download() {
    const link = this.renderer.createElement('a') as HTMLAnchorElement;
    link.href = this.secondaryCanvas.canvasComponent.canvas.toDataURL();
    link.download = 'image.jpeg';
    link.click();
  }

  encodeIntoImage() {
    const meta: ImageMetaInfo = { ...this.formGroup.value, files: [] }
    this.encodeData(shake, meta);
  }

  async encodeData(data: any, meta: ImageMetaInfo) {
    const imageData = this.mainCanvas.getImageData();

    if (imageData) {
      const filesInfo: FileMeta[] = [];
      const fileBinaryStrings: string[] = [];
      for (let i = 0; i < this.files.length; i++) {
        const buffer = await this.files[i].arrayBuffer();
        const fileBinaryString = ImageEncrypt.convertToBinaryString(buffer);

        filesInfo.push({ size: fileBinaryString.length, name: this.files[i].name })
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
