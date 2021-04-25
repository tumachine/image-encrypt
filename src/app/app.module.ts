import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas-image/canvas.component';
import { ControlBoardComponent } from './control-board/control-board.component';
import { CanvasesComponent } from './canvases-control/canvases.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    ControlBoardComponent,
    CanvasesComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
