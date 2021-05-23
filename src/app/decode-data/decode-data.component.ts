import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { BehaviorSubject } from 'rxjs';
import { ImageEncryptService } from '../image-encrypt.service';

@Component({
  selector: 'app-decode-data',
  templateUrl: './decode-data.component.html',
  styleUrls: ['./decode-data.component.css']
})
export class DecodeDataComponent implements OnInit {
  @ViewChild(CanvasWrapperComponent)
  canvasWrapper!: CanvasWrapperComponent;

  metadataBitLength = 32;

  image$ = new BehaviorSubject<HTMLImageElement | null>(null);

  files$ = new BehaviorSubject<File[]>([])

  loading$ = new BehaviorSubject<boolean>(false);

  decoded$ = new BehaviorSubject<boolean>(false);

  errorMessage$ = new BehaviorSubject<string>('');

  readonly formGroup = this.fb.group({
    password: null
  })

  constructor(private fb: FormBuilder, private imageEncryptService: ImageEncryptService) {}

  ngOnInit() {
    this.image$.subscribe(image => {
      if (image) {
        this.reset();
        setTimeout(() => this.decodeData());
      }
    });
  }

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
    this.formGroup.reset();
  }

  async decodeData() {
    const imageData = this.canvasWrapper.getImageData();
    if (imageData) {
      this.loading$.next(true);
      try {
        this.decoded$.next(false);
        this.errorMessage$.next('');
        const { password } = this.formGroup.value;
        const { meta, files } = await this.imageEncryptService.decodeData(imageData, password ? password : null);

        this.files$.next(files);
        this.decoded$.next(true);
      } catch {
        this.errorMessage$.next('Could not decrypt this image, try with password')
      }
      this.loading$.next(false);
    }
  }
}
