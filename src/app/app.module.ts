import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ControlBoardComponent } from './control-board/control-board.component';
import { CanvasesComponent } from './canvases-control/canvases.component';
import { CanvasWrapperComponent } from './canvas-wrapper/canvas-wrapper.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from './file-upload/file-upload.module';
import { PixelDifferenceComponent } from './pixel-difference/pixel-difference.component';
import { FilesListComponent } from './files-list/files-list.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    ControlBoardComponent,
    CanvasesComponent,
    CanvasWrapperComponent,
    PixelDifferenceComponent,
    FilesListComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FileUploadModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
