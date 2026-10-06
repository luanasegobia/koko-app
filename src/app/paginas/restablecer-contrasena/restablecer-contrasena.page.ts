import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular';
import { LayoutAuthComponent } from '../../compartido/layout-auth/layout-auth.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { AuthService } from '../../core/servicios/auth.service';

function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('nueva')?.value;
  const confirmacion = grupo.get('confirmacion')?.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

/** Se llega desde el enlace del correo de recuperación, que trae la sesión en la URL. */
@Component({
  selector: 'app-restablecer-contrasena',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    LayoutAuthComponent,
  ],
  template: `
    @if (!tieneToken()) {
      <app-layout-auth
        icono="warning-outline"
        titulo="El enlace no es válido"
        subtitulo="Este enlace para restablecer la contraseña está incompleto o venció"
      >
        <p class="texto-chico texto-centrado">
          Puede que lo hayas abierto desde otro dispositivo o que ya haya vencido. Pedí uno
          nuevo y revisá tu correo.
        </p>
        <a pie routerLink="/forgot-password" class="enlace">Pedir un enlace nuevo</a>
      </app-layout-auth>
    } @else {
      <app-layout-auth
        icono="lock-closed-outline"
        titulo="Contraseña nueva"
        subtitulo="Elegí la contraseña con la que vas a entrar"
      >
        @if (error()) {
          <p class="error-formulario">{{ error() }}</p>
        }
        <form class="formulario" [formGroup]="formulario" (ngSubmit)="guardar()">
          <ion-input
            label="Contraseña nueva"
            labelPlacement="stacked"
            fill="outline"
            type="password"
            formControlName="nueva"
            placeholder="••••••••"
            autocomplete="new-password"
            errorText="La contraseña tiene que tener al menos 6 caracteres"
          >
            <ion-icon slot="start" name="lock-closed-outline" aria-hidden="true"></ion-icon>
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
          <ion-input
            label="Repetí la contraseña"
            labelPlacement="stacked"
            fill="outline"
            type="password"
            formControlName="confirmacion"
            placeholder="••••••••"
            autocomplete="new-password"
            errorText="Repetí la contraseña"
          >
            <ion-icon slot="start" name="lock-closed-outline" aria-hidden="true"></ion-icon>
          </ion-input>
          <ion-button type="submit" expand="block" [disabled]="cargando()">
            @if (cargando()) {
              <ion-spinner slot="start" name="crescent"></ion-spinner>
              Guardando...
            } @else {
              Guardar contraseña
            }
          </ion-button>
        </form>
      </app-layout-auth>
    }
  `,
  styles: `
    .enlace {
      color: var(--ion-color-primary);
      font-weight: 600;
      text-decoration: none;

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
export class RestablecerContrasenaPage implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly tieneToken = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  private desuscribir: (() => void) | null = null;

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmacion: ['', Validators.required],
    },
    { validators: contrasenasCoinciden },
  );

  ngOnInit(): void {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      this.tieneToken.set(true);
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      this.desuscribir = this.auth.alCambiarSesion((evento) => {
        if (evento === 'PASSWORD_RECOVERY') this.tieneToken.set(true);
      });
    }
  }

  ngOnDestroy(): void {
    this.desuscribir?.();
  }

  async guardar(): Promise<void> {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      if (this.formulario.hasError('noCoinciden')) this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.cambiarContrasena(this.formulario.controls.nueva.value);
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
