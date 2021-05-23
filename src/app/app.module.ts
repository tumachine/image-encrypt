import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ControlBoardComponent } from './control-board/control-board.component';
import { EncodeDataComponent } from './canvases-control/encode-data.component';
import { CanvasWrapperComponent } from './canvas-wrapper/canvas-wrapper.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from './file-upload/file-upload.module';
import { PixelDifferenceComponent } from './pixel-difference/pixel-difference.component';
import { FilesListComponent } from './files-list/files-list.component';
import { RouterModule } from '@angular/router';
import { RootComponent } from './root/root.component';
import { AppRoutingModule } from './app-routing.module';
import { DecodeDataComponent } from './decode-data/decode-data.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    ControlBoardComponent,
    EncodeDataComponent,
    CanvasWrapperComponent,
    PixelDifferenceComponent,
    FilesListComponent,
    RootComponent,
    DecodeDataComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FileUploadModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
