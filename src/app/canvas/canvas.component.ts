import { Component, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CanvasdrawDirective } from '../canvasdraw.directive';

@Component({
  selector: 'app-canvas',
  imports: [ReactiveFormsModule, CanvasdrawDirective],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent {
  colorControl = new FormControl('#FFF');
  strokeWidthControl = new FormControl(2);

  @ViewChild(CanvasdrawDirective)
  drawDirective!: CanvasdrawDirective;

  clearCanvas() {
    this.drawDirective.clear();
  }

  undo() {
    this.drawDirective.undo();
  }

  redo() {
    this.drawDirective.redo();
  }

}
