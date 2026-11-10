import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonCard, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { BotonVolverComponent } from '../../compartido/boton-volver/boton-volver.component';
import { Mascota } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { enlaceDeWhatsApp, iniciales } from '../../core/utilidades';

/** Ficha que abre el QR del collar. Pública: no pide sesión ni layout. */
@Component({
  selector: 'app-ficha-publica',
  imports: [IonContent, IonCard, IonButton, IonIcon, IonSpinner, BotonVolverComponent],
  templateUrl: './ficha-publica.page.html',
  styleUrl: './ficha-publica.page.scss',
})
export class FichaPublicaPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly rutaActiva = inject(ActivatedRoute);

  protected readonly cargando = signal(true);
  protected readonly mascota = signal<Mascota | null>(null);
  protected readonly notificando = signal(false);
  protected readonly notificado = signal(false);
  protected readonly errorDeAviso = signal('');
  private qrId: string | null = null;

  async ngOnInit(): Promise<void> {
    const qrId = this.rutaActiva.snapshot.paramMap.get('qrId');
    this.qrId = qrId;
    if (!qrId) {
      this.cargando.set(false);
      return;
    }
    try {
      // La tabla pet no es de lectura pública (tiene teléfonos): la ficha se
      // pide por el código del QR y la base devuelve solo esa mascota.
      const resultados = await this.supabase.rpc<Mascota[]>('ficha_publica_mascota', {
        codigo: qrId,
      });
      this.mascota.set(resultados?.[0] ?? null);
    } catch (error) {
      console.error('No se pudo cargar la ficha:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  protected iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  protected enlaceDeWhatsApp(telefono: string): string {
    return enlaceDeWhatsApp(telefono);
  }

  /**
   * Deja una notificación en la campana de quien registró la mascota. La crea
   * una función de la base a partir del código del QR: desde el navegador no se
   * pueden crear notificaciones para otra persona. Solo se muestra "notificado"
   * si la base confirma que el aviso quedó.
   */
  protected async avisarQueLaEncontre(): Promise<void> {
    if (!this.qrId || this.notificando()) return;
    this.notificando.set(true);
    this.errorDeAviso.set('');
    try {
      const avisado = await this.supabase.rpc<boolean>('avisar_mascota_encontrada', {
        codigo: this.qrId,
      });
      if (avisado) this.notificado.set(true);
      else this.errorDeAviso.set('No pudimos dejarle el aviso. Llamá o escribile directamente.');
    } catch (error) {
      console.error('No se pudo avisar:', error);
      this.errorDeAviso.set('No pudimos dejarle el aviso. Llamá o escribile directamente.');
    } finally {
      this.notificando.set(false);
    }
  }
}
