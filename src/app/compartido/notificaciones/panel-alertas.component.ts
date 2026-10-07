import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonRange,
  IonSpinner,
  IonToggle,
} from '@ionic/angular';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { AvisosService } from '../../core/servicios/avisos.service';
import { GeolocalizacionService } from '../../core/servicios/geolocalizacion.service';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';

/** Configuración de la zona y los tipos de alerta que recibe la persona. */
@Component({
  selector: 'app-panel-alertas',
  imports: [
    ReactiveFormsModule,
    IonInput,
    IonButton,
    IonIcon,
    IonRange,
    IonToggle,
    IonSpinner,
    IonItem,
    IonLabel,
  ],
  templateUrl: './panel-alertas.component.html',
  styleUrl: './panel-alertas.component.scss',
})
export class PanelAlertasComponent {
  private readonly notificaciones = inject(NotificacionesService);
  private readonly geolocalizacion = inject(GeolocalizacionService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(FormBuilder);

  protected readonly suscripcion = this.notificaciones.suscripcion;
  protected readonly localizando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly guardado = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    location_label: '',
    lat: null as number | null,
    lng: null as number | null,
    radius_km: 5,
    notify_lost_pets: true,
    notify_urgent_cases: true,
  });

  constructor() {
    // Cuando llega (o cambia) la suscripción guardada, se vuelca en el formulario.
    effect(() => {
      const actual = this.suscripcion();
      untracked(() => {
        if (!actual) return;
        this.formulario.patchValue({
          location_label: actual.location_label || '',
          lat: actual.lat ?? null,
          lng: actual.lng ?? null,
          radius_km: actual.radius_km || 5,
          notify_lost_pets: actual.notify_lost_pets ?? true,
          notify_urgent_cases: actual.notify_urgent_cases ?? true,
        });
      });
    });
  }

  protected get tieneUbicacion(): boolean {
    const { lat, lng } = this.formulario.getRawValue();
    return lat !== null && lng !== null;
  }

  async localizar(): Promise<void> {
    this.localizando.set(true);
    try {
      const posicion = await this.geolocalizacion.obtenerPosicion();
      this.formulario.patchValue({ lat: posicion.lat, lng: posicion.lng });
    } catch (error) {
      await this.avisos.error((error as Error).message);
    } finally {
      this.localizando.set(false);
    }
  }

  async guardar(): Promise<void> {
    const valores = this.formulario.getRawValue();
    if (valores.lat === null || valores.lng === null) return;
    this.guardando.set(true);
    try {
      await this.notificaciones.guardarSuscripcion({
        ...valores,
        lat: Number(valores.lat),
        lng: Number(valores.lng),
      });
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
      this.guardado.set(true);
      setTimeout(() => this.guardado.set(false), 2000);
    } catch (error) {
      await this.avisos.error(mensajeDeError(error), 'No se pudieron guardar las alertas');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(): Promise<void> {
    try {
      await this.notificaciones.eliminarSuscripcion();
      this.formulario.reset();
    } catch (error) {
      await this.avisos.error(mensajeDeError(error));
    }
  }
}
