import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { formatBytes } from '../utils';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageEncrypt } from '../image-encrypt';
import { shake } from '../text';

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
export class FilesListComponent implements OnInit {
  @Output()
  filesChange = new EventEmitter<File[]>();

  fileType = FileType;

  files: FileWrapper[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    const buffer = await ImageEncrypt.convertDataToBuffer( shake);
    const file = new File([buffer], 'file.txt');
    this.fileUpload([file]);
  }

  fileUpload(files: File[]) {
    console.log(files);
    files.forEach(file => {
      let type: FileType = FileType.Any;
      let url: string | any = null;
      if (file.type.match('image.*')) {
        type = FileType.Image;
        url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      }
      this.files.push({ file, type, humanReadableSize: formatBytes(file.size), objUrl: url });
    })

    this.emitFiles();
  }

  deleteFile(index: number) {
    this.files.splice(index, 1);
    this.emitFiles();
  }

  emitFiles() {
    this.filesChange.emit(this.files.map(file => file.file));
  }
}
