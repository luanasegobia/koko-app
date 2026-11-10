import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonInput, IonSpinner } from '@ionic/angular';
import { LayoutAuthComponent } from '../../compartido/layout-auth/layout-auth.component';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [ReactiveFormsModule, RouterLink, IonButton, IonIcon, IonInput, IonSpinner, LayoutAuthComponent],
  template: `
    <app-layout-auth
      icono="mail-outline"
      titulo="Recuperar contraseña"
      subtitulo="Te mandamos un enlace para que elijas una nueva"
    >
      @if (enviado()) {
        <p class="texto-chico texto-centrado">
          Si existe una cuenta con ese correo, en un rato te va a llegar el enlace. Revisá
          también la carpeta de spam.
        </p>
      } @else {
        <form class="formulario" [formGroup]="formulario" (ngSubmit)="enviar()">
          <ion-input
            label="Tu email"
            labelPlacement="stacked"
            fill="outline"
            type="email"
            formControlName="email"
            placeholder="vos@ejemplo.com"
            autocomplete="email"
            errorText="Ingresá un email válido"
          >
            <ion-icon slot="start" name="mail-outline" aria-hidden="true"></ion-icon>
          </ion-input>
          <ion-button type="submit" expand="block" [disabled]="cargando()">
            @if (cargando()) {
              <ion-spinner slot="start" name="crescent"></ion-spinner>
              Enviando...
            } @else {
              Enviar enlace
            }
          </ion-button>
        </form>
      }
      <a pie routerLink="/login" class="enlace">
        <ion-icon name="arrow-back" aria-hidden="true"></ion-icon> Volver al inicio de sesión
      </a>
    </app-layout-auth>
  `,
  styles: `
    .enlace {
      color: var(--ion-color-primary);
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    ion-spinner {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  `,
})
export class RecuperarContrasenaPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(false);
  protected readonly enviado = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.pedirRestablecerContrasena(this.formulario.controls.email.value);
    } catch {
      // Siempre se muestra el mismo mensaje: no se revela si el correo existe.
    } finally {
      this.cargando.set(false);
      this.enviado.set(true);
    }
  }
}
