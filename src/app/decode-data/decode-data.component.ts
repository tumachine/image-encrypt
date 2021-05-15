import { Component, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ImageEncrypt, ImageMetaInfo } from '../image-encrypt';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-decode-data',
  templateUrl: './decode-data.component.html',
  styleUrls: ['./decode-data.component.css']
})
export class DecodeDataComponent {
  @ViewChild(CanvasWrapperComponent)
  canvasWrapper!: CanvasWrapperComponent;

  metadataBitLength = 32;

  image!: { image: HTMLImageElement };

  files$ = new BehaviorSubject<File[]>([])

  loading$ = new BehaviorSubject<boolean>(false);

  readonly formGroup = this.fb.group({})

  constructor(private fb: FormBuilder) {}

  async updateImage(files: FileList) {
    const arrFiles = Array.from(files);
    if (arrFiles.length === 1) {
      const url = URL.createObjectURL(arrFiles[0]);
      this.image = await this.getImage(url as any);
    }
  }

  async getImage(src: string): Promise<{ image: HTMLImageElement }> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        resolve({ image });
      }
      image.src = src;
    })
  }

  async decodeData() {
    this.loading$.next(true);
    const imageData = this.canvasWrapper.getImageData();
    if (imageData) {
      const decodedLengthOfMetadata = ImageEncrypt.decodePixelsRange(imageData.data, 0, this.metadataBitLength, [2, 2, 2]);
      const lengthOfMetadataInBytes = parseInt(decodedLengthOfMetadata.binaryString, 2);

      const decodedMetadata = ImageEncrypt.decodePixelsRange(imageData.data, decodedLengthOfMetadata.nextPixelIndex, lengthOfMetadataInBytes, [2, 2, 2]);
      const decodedMetadataBuffer = ImageEncrypt.convertBinaryStringToBuffer(decodedMetadata.binaryString);
      const metadataBlob = new Blob([decodedMetadataBuffer]);
      const metadataText = await metadataBlob.text();
      console.log(metadataText)
      const dataInfo: ImageMetaInfo = JSON.parse(metadataText);
      console.log(dataInfo)

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
    }
  }
}
