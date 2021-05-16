import { RouterModule, Routes } from '@angular/router';
import { EncodeDataComponent } from './canvases-control/encode-data.component';
import { NgModule } from '@angular/core';
import { RootComponent } from './root/root.component';
import { DecodeDataComponent } from './decode-data/decode-data.component';

const routes: Routes = [
  {
    path: '',
    component: RootComponent,
  },
  {
    path: 'encode',
    component: EncodeDataComponent,
  },
  {
    path: 'decode',
    component: DecodeDataComponent,
  },
  {
    path: '**',
    component: RootComponent,
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
