import { Directive, Input, inject, ElementRef, HostListener } from "@angular/core";
import { fromEvent, switchMap, takeUntil, pairwise, tap } from "rxjs";

@Directive({
  selector: '[appCanvasdraw]',
})
export class CanvasdrawDirective {
  @Input() strokeColor: string = '#FFF';
  @Input() strokeWidth: number = 2;

  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];


  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private el = inject(ElementRef<HTMLCanvasElement>);

  // ngOnInit(): void {
  //   const canvas = this.el.nativeElement;
  //   this.ctx = canvas.getContext('2d')!;
  //   canvas.width = window.innerWidth;
  //   canvas.height = window.innerHeight - 100;
  // }

  public ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.el.nativeElement;
    this.ctx = canvasEl.getContext('2d')!;

    // set the width and height
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight - 100;

    // set some default properties about the line
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';

    this.saveState(); // Initial state
    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from the canvas element
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        tap(() => this.saveState()),
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              // we'll stop (and unsubscribe) once the user releases the mouse
              // this will trigger a 'mouseup' event
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              // pairwise lets us get the previous value to draw a line from
              // the previous point to the current point
              pairwise()
            )
        })
      )
      .subscribe((res: [Event, Event]) => {
        const rect = canvasEl.getBoundingClientRect();

        // previous and current position with the offset
        if (res[0] instanceof MouseEvent && res[1] instanceof MouseEvent) {
          const prevPos = {
            x: res[0].clientX - rect.left,
            y: res[0].clientY - rect.top
          };

          const currentPos = {
            x: res[1].clientX - rect.left,
            y: res[1].clientY - rect.top
          };
          this.drawOnCanvas(prevPos, currentPos);
        }

        // this method we'll implement soon to do the actual drawing
      });
  }

  private drawOnCanvas(
    prevPos: { x: number, y: number },
    currentPos: { x: number, y: number }
  ) {
    // incase the context is not set
    if (!this.ctx) { return; }

    // start our drawing path
    this.ctx.beginPath();

    // we're drawing lines so we need a previous position
    if (prevPos) {
      // sets the start point
      this.ctx.moveTo(prevPos.x, prevPos.y); // from

      // draws a line from the start pos until the current position
      this.ctx.lineTo(currentPos.x, currentPos.y);
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.lineWidth = this.strokeWidth;
      // strokes the current path with the styles we set earlier
      this.ctx.stroke();
    }
  }

  private saveState() {
    const canvas = this.el.nativeElement as HTMLCanvasElement;
    const snapshot = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.undoStack.push(snapshot);
    this.redoStack = [];
  }

  public undo() {
    if (this.undoStack.length === 0) return;
    const canvas = this.el.nativeElement as HTMLCanvasElement;
    const current = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.redoStack.push(current);
    const prev = this.undoStack.pop()!;
    this.ctx.putImageData(prev, 0, 0);
  }

  public redo() {
    if (this.redoStack.length === 0) return;
    const canvas = this.el.nativeElement as HTMLCanvasElement;
    const current = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.undoStack.push(current);
    const next = this.redoStack.pop()!;
    this.ctx.putImageData(next, 0, 0);
  }



  // @HostListener('mousemove', ['$event'])
  // onMouseMove(event: MouseEvent) {
  //   if (!this.drawing) return;
  //   this.ctx.lineTo(event.offsetX, event.offsetY);
  //   this.ctx.strokeStyle = this.strokeColor;
  //   this.ctx.lineWidth = this.strokeWidth;
  //   this.ctx.stroke();
  // }

  // @HostListener('mouseup')
  // @HostListener('mouseleave')
  // onMouseUp() {
  //   this.drawing = false;
  //   this.ctx.closePath();
  // }

  public clear() {
    const canvas = this.el.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
