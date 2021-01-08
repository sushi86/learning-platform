import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  connection$: WebSocketSubject<any>;

  constructor() {
    this.connection$ = webSocket('http://localhost:3000');
  }
}
