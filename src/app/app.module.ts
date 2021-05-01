import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ControlBoardComponent } from './control-board/control-board.component';
import { CanvasesComponent } from './canvases-control/canvases.component';
import { CanvasWrapperComponent } from './canvas-wrapper/canvas-wrapper.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    ControlBoardComponent,
    CanvasesComponent,
    CanvasWrapperComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
