import { Component, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

enum FileType {
  Image,
  Sound,
  Document,
  Text,
  Any,
}

interface FileWrapper {
  type: FileType,
  humanReadableSize: string,
  file: File,
  objUrl: null | any,
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Output()
  files = new EventEmitter<File[]>();

  constructor(private sanitizer: DomSanitizer) {}

  // files: FileWrapper[] = [];

  fileDropped(files: FileList) {
    this.filesAdded(files);
  }

  fileBrowse(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      this.filesAdded(files);
    }
  }

  // deleteFile(index: number) {
  //   this.files.splice(index, 1);
  // }

  private filesAdded(files: FileList) {
    // Array.from(files).forEach(file => {
    //   let type: FileType = FileType.Any;
    //   let url: string | any = null;
    //   if (file.type.match('image.*')) {
    //     console.log('is image')
    //     type = FileType.Image;
    //     url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    //   }
    //   this.files.push({ file, type, humanReadableSize: formatBytes(file.size), objUrl: url });
    // });
    this.files.emit(Array.from(files));
  }
}
