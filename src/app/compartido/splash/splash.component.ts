import { Component, OnDestroy, OnInit, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** Pantalla de bienvenida animada que se muestra al abrir el login. */
@Component({
  selector: 'app-splash',
  imports: [IonIcon],
  template: `
    <div class="splash" [class.saliendo]="saliendo()">
      <div class="circulo circulo-grande"></div>
      <div class="circulo circulo-chico"></div>
      <div class="logo">
        <div class="caja">
          <ion-icon name="paw"></ion-icon>
        </div>
        <h1>Koko</h1>
        <p>Comunidad mascoteril</p>
      </div>
      <div class="puntos">
        <span></span><span></span><span></span>
      </div>
    </div>
  `,
  styleUrl: './splash.component.scss',
})
export class SplashComponent implements OnInit, OnDestroy {
  readonly terminado = output<void>();
  protected readonly saliendo = signal(false);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.temporizadores.push(setTimeout(() => this.saliendo.set(true), 2000));
    this.temporizadores.push(setTimeout(() => this.terminado.emit(), 2500));
  }

  ngOnDestroy(): void {
    this.temporizadores.forEach(clearTimeout);
  }
}
