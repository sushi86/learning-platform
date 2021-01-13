import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { CanvasComponent } from './components/canvas/canvas.component';
import { Canvas2Component } from './components/canvas2/canvas2.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    Canvas2Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: Window, useValue: window }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
