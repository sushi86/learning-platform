import {EventEmitter, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  socket: WebSocket;

  public drawEvents: EventEmitter<any> = new EventEmitter();
  public commandEvents: EventEmitter<any> = new EventEmitter();

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
        const eventObject = JSON.parse(event.data);
        if (eventObject.type === 'draw') {
          this.drawEvents.emit(eventObject.data);
        }
        if (eventObject.type === 'command') {
          this.commandEvents.emit(eventObject.data);
        }
      } catch (e) {
        console.log(e);
        console.log(event.data);
      }
    };
  }

  public send(eventType: string, msg: any): void {
    this.socket.send(JSON.stringify({type: eventType, data: msg}));
  }


}
