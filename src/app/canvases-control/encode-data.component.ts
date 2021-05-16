import { ChangeDetectorRef, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CanvasViewState, Color, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { FormBuilder } from '@angular/forms';
import { FileMeta, ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { download, formatBytes, invertColor } from '../utils';
import { DomSanitizer } from '@angular/platform-browser';
import { startWith } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-canvases',
  templateUrl: './encode-data.component.html',
  styleUrls: ['./encode-data.component.css']
})
export class EncodeDataComponent implements OnInit {
  @ViewChild('mainCanvas')
  mainCanvas!: CanvasWrapperComponent;

  @ViewChild('secondaryCanvas')
  secondaryCanvas!: CanvasWrapperComponent;

  image$ = new BehaviorSubject<HTMLImageElement | null>(null);

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

  totalBits!: number;
  pixelPercentageChange!: number;

  rangeBits = [0, 2, 4, 8, 16, 32, 64, 128, 255];

  files: File[] = [];

  readonly formGroup = this.fb.group({
    r: 4,
    g: 4,
    b: 4,
  })

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder, private sanitizer: DomSanitizer, private renderer: Renderer2) {}

  async ngOnInit() {
    const src = '../assets/images/drop-image.jpg';
    await this.getImage(src);

    this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value))
      .subscribe(({ r, g, b }) => {
        if (this.image$.value) {
          this.calculateAvailableSpace(this.image$.value, new Color(r, g, b));
        }
        this.totalBits = r + g + b;
        this.pixelPercentageChange = Math.ceil(((this.rangeBits[r] + this.rangeBits[g] + this.rangeBits[b]) / 3) / (255 / 100));
      })
  }

  addFiles(files: File[]) {
    this.files = [ ...files, ...this.files ];
    this.updateFilesInfo();
  }

  deleteFile(index: number) {
    this.files.splice(index, 1);
    this.files = [ ...this.files ];
    this.updateFilesInfo();
  }

  updateFilesInfo() {
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
    if (this.totalFileSize != null && this.availableSpace != null) {
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
        this.image$.next(image);
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
      await this.getImage(url as any);
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
    download(this.renderer, this.secondaryCanvas.canvasComponent.canvas.toDataURL(), 'encoded.jpg');
  }

  encodeIntoImage() {
    this.encodeData(this.formGroup.value);
  }

  async encodeData(meta: ImageMetaInfo) {
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
}
