import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {WebsocketService} from '../../services/websocket.service';
import {DrawEvent} from '../../entities/draw-event';
import { faEraser, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-canvas2',
  templateUrl: './canvas2.component.html',
  styleUrls: ['./canvas2.component.scss']
})
export class Canvas2Component implements AfterViewInit {

  constructor(
    private socket: WebsocketService
  ) { }

  @ViewChild('canvas') public canvas: ElementRef;

  faEraser = faEraser;
  faPencilAlt = faPencilAlt;
  faTrashAlt = faTrashAlt;

  private cx: CanvasRenderingContext2D;
  private isTouchDevice: boolean;
  private drawer: any;
  private canvasEl: HTMLCanvasElement;
  private lastCoords: any;
  private currentLine = [];
  private lines = [];

  private color = 'black';
  public markerType = 'marker';

  ngAfterViewInit(): void {
    this.canvasEl = this.canvas.nativeElement;
    this.cx = this.canvasEl.getContext('2d');

    // set the width and height
    this.canvasEl.width = 1500;
    this.canvasEl.height = 1000;

    this.cx.strokeStyle = this.color;
    this.cx.lineJoin = 'round';
    this.cx.lineWidth = 2;

    this.isTouchDevice = 'ontouchstart' in document.documentElement;

    if (this.isTouchDevice) {
      const self = this;
      this.drawer = {
        isDrawing: false,
        touchstart(coors: { x: number; y: number; }): void {
          self.lastCoords = coors;
          self.cx.beginPath();
          self.cx.moveTo(coors.x, coors.y);
          this.isDrawing = true;
        },
        touchmove(coors: { x: number; y: number; }): void {
          if (this.isDrawing) {
            if (self.markerType === 'marker')
            {
              self.cx.globalCompositeOperation = 'source-over';
              self.cx.lineTo(coors.x, coors.y);
              self.cx.stroke();
              self.cx.moveTo(coors.x, coors.y);
            }
            if (self.markerType === 'eraser')
            {
              self.cx.globalCompositeOperation = 'destination-out';
              self.cx.arc(coors.x, coors.y, 10, 0, Math.PI * 2, false);
              self.cx.moveTo(coors.x, coors.y);
              self.cx.fill();
            }
            self.cx.strokeStyle = self.color;

            self.sendLine(coors, false);
            self.lastCoords = coors;
          }
        }
      };

      // attach the touchstart, touchmove, touchend event listeners.
      this.canvasEl.addEventListener('touchstart', (e) => this.draw(e), false);
      this.canvasEl.addEventListener('touchmove', (e) => this.draw(e), false);
      this.canvasEl.addEventListener('touchend', (e) =>
      {
        this.draw(e);
        this.sendLine(null, true);
      }, false);

      // prevent elastic scrolling
      this.canvasEl.addEventListener('touchmove', (event) => {
        event.preventDefault();
      }, false);
    }

    this.socket.drawEvents.subscribe(
      data => {
        const coords = data.coordinates;
        this.cx.beginPath();
        if (data.markerType === 'marker') {
          this.cx.strokeStyle = data.color;
          this.cx.globalCompositeOperation = 'source-over';
          this.cx.moveTo(coords.prev.x, coords.prev.y);
          this.cx.lineTo(coords.cur.x, coords.cur.y);
          this.cx.stroke();
        }
        if (data.markerType === 'eraser') {
          this.cx.globalCompositeOperation = 'destination-out';
          this.cx.arc(coords.prev.x, coords.prev.y, 10, 0, Math.PI * 2, false);
          this.cx.moveTo(coords.cur.x, coords.cur.y);
          this.cx.fill();
        }
      }
    );
    this.socket.commandEvents.subscribe(
      data => {
        if (data === 'clear') {
          this.clear(true);
        }
      }
    );
  }

  public changeColor(color: string): void {
    this.color = color;
    this.markerType = 'marker';
  }

  public getColor(): string {
    return this.color;
  }

  private draw(event): void {
    if (typeof event.targetTouches[0] === 'undefined') { return; }

    // get the touch coordinates.  Using the first touch in case of multi-touch
    const coors = {
      x: event.targetTouches[0].pageX,
      y: event.targetTouches[0].pageY
    };

    // Now we need to get the offset of the canvas location
    let obj = this.canvasEl;

    if (obj.offsetParent) {
      // Every time we find a new object, we add its offsetLeft and offsetTop to curleft and curtop.
      do {
        coors.x -= obj.offsetLeft;
        coors.y -= obj.offsetTop;

        // @ts-ignore
        obj = obj.offsetParent;
      }
      // The while loop can be "while (obj = obj.offsetParent)" only, which does return null
      // when null is passed back, but that creates a warning in some editors (i.e. VS2010).
      while (obj != null);
    }

    // pass the coordinates to the appropriate handler
    this.drawer[event.type](coors);
  }

  private sendLine(curCoors, end): void {
    const coors = {
      prev: this.lastCoords,
      cur: curCoors
    };
    if (!end) {
      this.currentLine.push(coors);
    } else {
      this.lines.push(this.currentLine);
      this.currentLine = [];
      return;
    }
    const de = new DrawEvent();
    de.color = this.color;
    de.markerType = this.markerType;
    de.coordinates = coors;
    this.socket.send('draw', de);
  }

  public removeLast(): void {
    this.lines.pop();
    this.repaint();
  }

  public clear(remote: boolean): void {
    this.cx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    if (!remote) {
      this.socket.send('command', 'clear');
    }
  }

  private repaint(): void {
    this.clear(false);
    this.lines.forEach(ls => {
      ls.forEach(l => {
        this.cx.beginPath();
        this.cx.strokeStyle = '#000';
        this.cx.moveTo(l.prev.x, l.prev.y);
        this.cx.lineTo(l.cur.x, l.cur.y);
        this.cx.stroke();
      });
    });
  }
}
