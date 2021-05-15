import { Injectable, Renderer2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private renderer: Renderer2) { }

}
