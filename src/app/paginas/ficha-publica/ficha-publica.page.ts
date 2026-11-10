import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonButton, IonCard, IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { Mascota } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { iniciales } from '../../core/utilidades';

/** Ficha que abre el QR del collar. Pública: no pide sesión ni layout. */
@Component({
  selector: 'app-ficha-publica',
  imports: [IonContent, IonCard, IonButton, IonIcon, IonSpinner],
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

  async ngOnInit(): Promise<void> {
    const qrId = this.rutaActiva.snapshot.paramMap.get('qrId');
    if (!qrId) {
      this.cargando.set(false);
      return;
    }
    try {
      const resultados = await this.supabase.mascotas.filtrar({ qr_id: qrId });
      this.mascota.set(resultados[0] ?? null);
    } catch (error) {
      console.error('No se pudo cargar la ficha:', error);
    } finally {
      this.cargando.set(false);
    }
  }

  protected iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  /**
   * Todavía no avisa a la persona dueña: el aviso automático necesita el
   * módulo de notificaciones. Se deja marcado en pantalla e invita a llamar.
   */
  protected avisarQueLaEncontre(): void {
    this.notificando.set(true);
    setTimeout(() => {
      this.notificando.set(false);
      this.notificado.set(true);
    }, 400);
  }
}
