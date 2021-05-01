import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Pixel } from '../canvas/canvas.component';

@Component({
  selector: 'app-control-board',
  templateUrl: './control-board.component.html',
  styleUrls: ['./control-board.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlBoardComponent {
  @Input()
  pixel!: Pixel | null;
}
