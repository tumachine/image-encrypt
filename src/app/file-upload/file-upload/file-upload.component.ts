import { Component, ElementRef, ViewChild } from '@angular/core';

interface CustomFile extends File {
  progress: number;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @ViewChild("fileDropRef", { static: false }) fileDropEl!: ElementRef;
  files: CustomFile[] = [];

  /**
   * on file drop handler
   */
  onFileDropped(files: FileList) {
    console.log(Array.from(files))
    this.prepareFilesList(files);
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(e: InputEvent) {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      this.prepareFilesList(files);
    }
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteFile(index: number) {
    if (this.files[index].progress < 100) {
      console.log("Upload in progress.");
      return;
    }
    this.files.splice(index, 1);
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[index].progress === 100) {
            clearInterval(progressInterval);
            this.uploadFilesSimulator(index + 1);
          } else {
            this.files[index].progress += 5;
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: FileList) {
    for (const item of Array.from(files)) {
      this.files.push({ ...item, progress: 0 });
    }
    this.fileDropEl.nativeElement.value = "";
    this.uploadFilesSimulator(0);
  }
}
