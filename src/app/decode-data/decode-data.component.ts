import { Component, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { BehaviorSubject } from 'rxjs';
import { ImageEncryptService } from '../image-encrypt.service';

@Component({
  selector: 'app-decode-data',
  templateUrl: './decode-data.component.html',
  styleUrls: ['./decode-data.component.css']
})
export class DecodeDataComponent {
  @ViewChild(CanvasWrapperComponent)
  canvasWrapper!: CanvasWrapperComponent;

  metadataBitLength = 32;

  image$ = new BehaviorSubject<HTMLImageElement | null>(null);

  files$ = new BehaviorSubject<File[]>([])

  loading$ = new BehaviorSubject<boolean>(false);

  decoded$ = new BehaviorSubject<boolean>(false);

  errorMessage$ = new BehaviorSubject<string>('');

  readonly formGroup = this.fb.group({})

  constructor(private fb: FormBuilder, private imageEncryptService: ImageEncryptService) {}

  fileBrowse(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files?.length === 1) {
      this.updateImage(files);
    }
  }

  updateImage(files: FileList) {
    const arrFiles = Array.from(files);
    if (arrFiles.length === 1) {
      const url = URL.createObjectURL(arrFiles[0]);
      this.imageEncryptService.createImage(url).then(image => this.image$.next(image));
    }
  }

  reset() {
    this.decoded$.next(false);
    this.errorMessage$.next('');
    this.image$.next(null);
    this.files$.next([]);
  }

  async decodeData() {
    const imageData = this.canvasWrapper.getImageData();
    if (imageData) {
      this.loading$.next(true);
      try {
        this.decoded$.next(false);
        this.errorMessage$.next('');
        const { meta, files } = await this.imageEncryptService.decodeData(imageData);

        this.files$.next(files);
        this.decoded$.next(true);
      } catch {
        this.errorMessage$.next('Cannot decrypt this image')
      }
      this.loading$.next(false);
    }
  }
}
