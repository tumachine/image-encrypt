import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { DragAndDropDirective } from './drag-and-drop.directive';

@NgModule({
  declarations: [
    FileUploadComponent,
    DragAndDropDirective
  ],
  exports: [
    FileUploadComponent,
    DragAndDropDirective
  ],
  imports: [
    CommonModule
  ]
})
export class FileUploadModule { }
