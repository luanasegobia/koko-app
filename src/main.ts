import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { configuracionDeLaApp } from './app/app.config';

bootstrapApplication(AppComponent, configuracionDeLaApp).catch((error) => console.error(error));
