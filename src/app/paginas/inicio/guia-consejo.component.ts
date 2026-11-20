import { Component, input, output } from '@angular/core';
import { IonContent, IonIcon, IonModal } from '@ionic/angular';
import { ACLARACION_DE_CONSEJOS, Consejo } from './consejos';

/** Hoja con la guía completa de un consejo de temporada. Se abre mientras `consejo` tenga valor. */
@Component({
  selector: 'app-guia-consejo',
  imports: [IonContent, IonIcon, IonModal],
  templateUrl: './guia-consejo.component.html',
  styleUrl: './guia-consejo.component.scss',
})
export class GuiaConsejoComponent {
  readonly consejo = input.required<Consejo | null>();
  /** La persona cerró la hoja (con la cruz, deslizando o tocando afuera). */
  readonly cerrar = output<void>();
  /** La persona tocó el botón al pie de la guía. */
  readonly seguir = output<Consejo>();

  protected readonly aclaracion = ACLARACION_DE_CONSEJOS;
}
