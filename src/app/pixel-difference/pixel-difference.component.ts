import { Component, Input } from '@angular/core';
import { Color } from '../canvas/canvas.component';
import { invertColor } from '../utils';

interface PixelDifference {
  original: {
    r: Color;
    g: Color;
    b: Color;
    color: Color;
  };
  encrypted: {
    r: Color;
    g: Color;
    b: Color;
    color: Color;
  };
  difference: {
    r: number;
    g: number;
    b: number;
  };
}

@Component({
  selector: 'app-pixel-difference',
  templateUrl: './pixel-difference.component.html',
  styleUrls: ['./pixel-difference.component.css']
})
export class PixelDifferenceComponent {
  @Input()
  set pixels({ main, secondary }: { main: Color, secondary: Color }) {
    main = main || this.defaultColor;
    secondary = secondary || this.defaultColor;
    this.pixelDifference = {
      difference: {
        r: secondary.r - main.r,
        g: secondary.g - main.g,
        b: secondary.b - main.b,
      },
      original: {
        r: new Color(main.r, 0, 0),
        g: new Color(0, main.g, 0),
        b: new Color(0, 0, main.b),
        color: main,
      },
      encrypted: {
        r: new Color(secondary.r, 0, 0),
        g: new Color(0, secondary.g, 0),
        b: new Color(0, 0, secondary.b),
        color: secondary,
      },
    }
  }

  pixelDifference!: PixelDifference;

  private defaultColor = new Color(0, 0, 0);

  // if (pixel) {
  //   const binary = {
  //     r: pixel.color.r.toString(2).padStart(8, '0'),
  //     g: pixel.color.g.toString(2).padStart(8, '0'),
  //     b: pixel.color.b.toString(2).padStart(8, '0'),
  //     a: pixel.color.a.toString(2).padStart(8, '0'),
  //   }
  //   this.pixel = { ...pixel, binary };
  // }
  // this.position = new Vector(Math.floor(position.x), Math.floor(position.y));

  invertColor(color: Color) {
    return invertColor(color.r, color.g, color.b);
  }
}
