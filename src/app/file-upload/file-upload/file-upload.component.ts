import { Component, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  host: { class: 'app-file-upload block' }
})
export class FileUploadComponent {
  @Output()
  files = new EventEmitter<File[]>();


  fileDropped(files: FileList) {
    this.filesAdded(files);
  }

  fileBrowse(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      this.filesAdded(files);
    }
  }

  private filesAdded(files: FileList) {
    this.files.emit(Array.from(files));
  }
}
