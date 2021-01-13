import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {WebsocketService} from '../../services/websocket.service';

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

  private cx: CanvasRenderingContext2D;
  private isTouchDevice: boolean;
  private drawer: any;
  private canvasEl: HTMLCanvasElement;
  private lastCoords: any;
  private currentLine = [];
  private lines = [];

  public color = '#000';

  ngAfterViewInit(): void {
    this.canvasEl = this.canvas.nativeElement;
    this.cx = this.canvasEl.getContext('2d');

    // set the width and height
    this.canvasEl.width = 1500;
    this.canvasEl.height = 1000;

    this.setBackground();

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
            self.cx.strokeStyle = self.color;
            self.cx.lineTo(coors.x, coors.y);
            self.cx.stroke();
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
        this.cx.beginPath();
        this.cx.strokeStyle = '#0000FF';
        this.cx.moveTo(data.prev.x, data.prev.y);
        this.cx.lineTo(data.cur.x, data.cur.y);
        this.cx.stroke();
      }
    );
  }

  private setBackground(): void {
    const bg = new Image();
    bg.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Kariertes_Papier_23-09-2016_PD.svg/1772px-Kariertes_Papier_23-09-2016_PD.svg.png';
    bg.onload = () => {
      this.cx.save();
      this.cx.globalAlpha = 0.1;
      this.cx.drawImage(bg, 0, 0);
      this.cx.restore();
    };
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
    this.socket.send(coors);
  }

  public removeLast(): void {
    this.lines.pop();
    this.repaint();
  }

  public clear(): void {
    this.cx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.setBackground();
  }

  private repaint(): void {
    this.clear();
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
