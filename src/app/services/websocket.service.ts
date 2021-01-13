import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  socket: WebSocket;

  public drawEvents: EventEmitter<any> = new EventEmitter();

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.socket = new WebSocket('wss://api-learn.skrauss.net');

    this.socket.onopen = event => {
      console.log(event);
    };

    this.socket.onclose = event => {
      console.log(event);
    };

    this.socket.onerror = event => {
      console.log(event);
    };

    this.socket.onmessage = event => {
      try {
        this.drawEvents.emit(JSON.parse(event.data));
      } catch (e) {
        console.log(e);
        console.log(event.data);
      }
    };
  }

  public send(msg: object): void {
    this.socket.send(JSON.stringify(msg));
  }


}
