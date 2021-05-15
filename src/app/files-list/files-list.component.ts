import { Component, EventEmitter, Input, Output, Renderer2 } from '@angular/core';
import { download, formatBytes } from '../utils';
import { DomSanitizer } from '@angular/platform-browser';

export enum FileType {
  Image,
  Sound,
  Document,
  Text,
  Any,
}

export interface FileWrapper {
  type: FileType,
  humanReadableSize: string,
  file: File,
  objUrl: null | any,
}

@Component({
  selector: 'app-files-list',
  templateUrl: './files-list.component.html',
  styleUrls: ['./files-list.component.css']
})
export class FilesListComponent {
  @Input()
  set files(files: File[]) {
    this.fileWrappers = files.map(file => {
      let type: FileType = FileType.Any;
      let url: string | any = null;
      if (file.type.match('image.*')) {
        type = FileType.Image;
        url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      }
      return { file, type, humanReadableSize: formatBytes(file.size), objUrl: url };
    })
  }

  @Input()
  title!: string;

  @Input()
  includeDelete = true;

  @Input()
  includeDownload = true;

  @Output()
  delete = new EventEmitter<number>();

  fileType = FileType;

  fileWrappers: FileWrapper[] = [];

  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2) {}

  download(index: number) {
    const file = this.fileWrappers[index].file;

    const url = window.URL.createObjectURL(file);
    download(this.renderer, url, file.name);
  }
}
