import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

/**
 * Botón para elegir (o sacar) una foto, con vista previa. Los archivos se
 * entregan al formulario padre, que es quien los sube al guardar.
 */
@Component({
  selector: 'app-selector-foto',
  imports: [IonButton, IonIcon],
  template: `
    @if (vistaPrevia(); as url) {
      <img class="vista-previa" [src]="url" alt="Vista previa de la foto" />
    }
    @if (nombres().length > 0) {
      <p class="texto-mini texto-secundario">{{ nombres().join(', ') }}</p>
    }
    <ion-button type="button" fill="outline" expand="block" (click)="abrir()">
      <ion-icon slot="start" [name]="capturar() ? 'camera-outline' : 'images-outline'"></ion-icon>
      {{ etiquetaBoton() }}
    </ion-button>
    <input
      #entrada
      type="file"
      class="oculto"
      [accept]="aceptar()"
      [multiple]="multiple()"
      [attr.capture]="capturar() ? 'environment' : null"
      (change)="alCambiar($event)"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vista-previa {
      width: 100%;
      height: 160px;
      object-fit: cover;
      border-radius: 12px;
      border: 1px solid var(--ion-border-color);
    }

    .oculto {
      display: none;
    }
  `,
})
export class SelectorFotoComponent {
  /** URL de una foto ya guardada (al editar). */
  readonly fotoActual = input<string | null | undefined>(null);
  readonly multiple = input(false);
  readonly aceptar = input('image/*');
  /** Abre la cámara trasera en el celular en vez de la galería. */
  readonly capturar = input(false);
  readonly etiqueta = input<string>();

  readonly archivos = output<File[]>();

  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');
  private readonly seleccionada = signal<string | null>(null);
  protected readonly nombres = signal<string[]>([]);

  protected vistaPrevia(): string | null {
    if (this.multiple()) return null;
    return this.seleccionada() ?? this.fotoActual() ?? null;
  }

  protected etiquetaBoton(): string {
    if (this.etiqueta()) return this.etiqueta()!;
    if (this.multiple()) return 'Elegir archivos';
    if (this.capturar()) return this.vistaPrevia() ? 'Cambiar foto' : 'Sacar foto';
    return this.vistaPrevia() ? 'Cambiar foto' : 'Elegir foto';
  }

  /** Abre el selector de archivos. También lo usa el padre para abrir la cámara al montar. */
  abrir(): void {
    this.entrada().nativeElement.click();
  }

  protected alCambiar(evento: Event): void {
    const lista = (evento.target as HTMLInputElement).files;
    const archivos = lista ? Array.from(lista) : [];
    if (archivos.length === 0) return;

    if (!this.multiple()) {
      this.seleccionada.set(URL.createObjectURL(archivos[0]));
    }
    this.nombres.set(this.multiple() ? archivos.map((a) => a.name) : []);
    this.archivos.emit(archivos);
  }
}
