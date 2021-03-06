// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
import { Renderer2 } from '@angular/core';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
export function invertColor(r: number, g: number, b: number) {
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#FFFFFF';
}

export function download(renderer: Renderer2, url: string, name: string) {
  const a = renderer.createElement('a') as HTMLAnchorElement;
  renderer.setStyle(a, 'display', 'hidden');

  renderer.appendChild(document.body, a);

  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
  renderer.removeChild(document.body, a);
}
