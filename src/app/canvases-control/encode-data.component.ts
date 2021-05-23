import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CanvasViewState, Pixel, Vector } from '../canvas/canvas.component';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';
import { FormBuilder } from '@angular/forms';
import { download, formatBytes } from '../utils';
import { startWith, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { ImageEncryptService } from '../image-encrypt.service';
import { fromPromise } from 'rxjs/internal-compatibility';

interface Size {
  bytes: number,
  formatted: string,
}

@Component({
  selector: 'app-encode-data',
  templateUrl: './encode-data.component.html',
  styleUrls: ['./encode-data.component.css']
})
export class EncodeDataComponent implements OnInit {
  @ViewChild('mainCanvas')
  mainCanvas!: CanvasWrapperComponent;

  @ViewChild('secondaryCanvas')
  secondaryCanvas!: CanvasWrapperComponent;

  image$ = new BehaviorSubject<HTMLImageElement | null>(null);

  loading$ = new BehaviorSubject<boolean>(false);

  encoded$ = new BehaviorSubject<boolean>(false);

  viewState!: CanvasViewState;

  metadataBitLength = 32;

  position!: Vector;

  mainPixel!: Pixel | null;
  encryptedPixel!: Pixel | null;

  availableImageSpace!: Size;
  totalFileSize!: Size;
  spaceLeft!: Size;

  totalBits!: number;

  rangeBits = [0, 1, 3, 7, 15, 31, 63, 127, 255];

  files$ = new BehaviorSubject<File[]>([]);


  readonly formGroup = this.fb.group({
    r: 4,
    g: 4,
    b: 4,
  })

  constructor(private fb: FormBuilder, private renderer: Renderer2, private imageEncryptService: ImageEncryptService) {}

  ngOnInit() {
    combineLatest([this.formGroup.valueChanges.pipe(startWith(this.formGroup.value)), this.image$])
      .subscribe(([color, image]) => {
        if (image) {
          this.availableImageSpace = this.wrapSize(Math.floor(image.width * image.height * (color.r + color.g + color.b) / 8))
          this.calculateSpaceLeft();
        }
      });

    this.formGroup.valueChanges.pipe(startWith(this.formGroup.value)).subscribe(({ r, g, b }) => {
      this.totalBits = r + g + b;
    })

    this.image$.subscribe(image => {
      this.loading$.next(false);
    })

    this.files$.subscribe(files => {
      this.totalFileSize = this.wrapSize(files.map(file => file.size).reduce((prev, curr) => prev + curr, 0));
      this.calculateSpaceLeft();
    })
  }

  loadRandomImage() {
    this.loading$.next(true);
    this.imageEncryptService.loadRandomImageSrc().pipe(switchMap(src => fromPromise(this.imageEncryptService.createImage(src))))
      .subscribe(img => this.image$.next(img));
  }

  addFiles(files: File[]) {
    this.files$.next([ ...files, ...this.files$.value ]);
  }

  deleteFile(index: number) {
    const filesCopy = [...this.files$.value];
    filesCopy.splice(index, 1);
    this.files$.next(filesCopy);
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
      this.loading$.next(true);
      this.imageEncryptService.createImage(url as any).then(image => this.image$.next(image));
    }
  }

  updateViewState(viewState: CanvasViewState) {
    this.viewState = viewState;
  }

  reset() {
    this.image$.next(null);
    this.files$.next([]);
    this.formGroup.reset({ r: 4, g: 4, b: 4 });
    this.encoded$.next(false);
  }

  updatePosition(position: Vector | null) {
    if (position && this.secondaryCanvas?.canvasComponent) {
      this.mainPixel = this.mainCanvas.canvasComponent.getPixel(position);
      this.encryptedPixel = this.secondaryCanvas.canvasComponent.getPixel(position);
      if (this.mainPixel) {
        this.position = new Vector(Math.floor(this.mainPixel.position.x), Math.floor(this.mainPixel.position.y));
      }
    }
  }

  download() {
    download(this.renderer, this.secondaryCanvas.canvasComponent.canvas.toDataURL(), 'encoded.jpg');
  }

  calculateSpaceLeft() {
    if (this.totalFileSize && this.availableImageSpace) {
      this.spaceLeft = this.wrapSize(this.availableImageSpace.bytes - this.totalFileSize.bytes);
    }
  }

  wrapSize(bytes: number): Size {
    return { bytes, formatted: formatBytes(bytes) };
  }

  async encodeData() {
    const meta = this.formGroup.value;
    const imageData = this.mainCanvas.getImageData();

    if (imageData) {
      this.encoded$.next(false);

      await this.imageEncryptService.encodeData(meta, this.files$.value, imageData);
      this.secondaryCanvas.putImageData(imageData);

      setTimeout(() => {
        this.secondaryCanvas.canvasComponent.onResize();
        this.mainCanvas.canvasComponent.onResize();
      })

      this.encoded$.next(true);
    }
  }
}
