import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-decode-data',
  templateUrl: './decode-data.component.html',
  styleUrls: ['./decode-data.component.css']
})
export class DecodeDataComponent implements AfterViewInit {
  @ViewChild(CanvasWrapperComponent)
  canvasWrapper!: CanvasWrapperComponent;

  metadataBitLength = 32;

  image$ = new BehaviorSubject<HTMLImageElement | null>(null);

  files$ = new BehaviorSubject<File[]>([])

  loading$ = new BehaviorSubject<boolean>(false);

  errorMessage$ = new BehaviorSubject<string>('');

  readonly formGroup = this.fb.group({})

  constructor(private fb: FormBuilder) {}

  async ngAfterViewInit() {
    await this.getImage('../assets/images/drop-image.jpg');
  }

  async updateImage(files: FileList) {
    const arrFiles = Array.from(files);
    if (arrFiles.length === 1) {
      const url = URL.createObjectURL(arrFiles[0]);
      await this.getImage(url as any);
    }
  }

  async getImage(src: string): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        this.image$.next(image);
        resolve(image);
      }
      image.src = src;
    })
  }

  async decodeData() {
    this.loading$.next(true);
    const imageData = this.canvasWrapper.getImageData();
    if (imageData) {
      try {
        const decodedLengthOfMetadata = ImageEncrypt.decodePixelsRange(imageData.data, 0, this.metadataBitLength, [2, 2, 2]);
        const lengthOfMetadataInBytes = parseInt(decodedLengthOfMetadata.binaryString, 2);

        if (lengthOfMetadataInBytes / 8 / 1024 > 10) {
          throw new Error('');
        }

        const decodedMetadata = ImageEncrypt.decodePixelsRange(imageData.data, decodedLengthOfMetadata.nextPixelIndex, lengthOfMetadataInBytes, [2, 2, 2]);
        const decodedMetadataBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedMetadata.binaryString);
        const metadataBlob = new Blob([decodedMetadataBuffer]);
        const metadataText = await metadataBlob.text();
        const dataInfo: ImageMetaInfo = JSON.parse(metadataText);
        let decodedData = decodedMetadata;

        const files = [];
        for (let i = 0; i < dataInfo.files.length; i++) {
          decodedData = ImageEncrypt.decodePixelsRange(imageData.data, decodedData.nextPixelIndex, dataInfo.files[i].size, [dataInfo.r, dataInfo.g, dataInfo.b]);
          const decodedBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedData.binaryString);
          const file = new File([decodedBuffer], dataInfo.files[i].name)
          files.push(file);
        }

        this.files$.next(files);
        this.loading$.next(false);
        this.errorMessage$.next('Success!');
      } catch {
        this.errorMessage$.next('Cannot decrypt this image')
      }

    }
  }
}
