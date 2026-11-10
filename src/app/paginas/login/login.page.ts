import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular';
import { IconoGoogleComponent } from '../../compartido/icono-google/icono-google.component';
import { SplashComponent } from '../../compartido/splash/splash.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { AuthService } from '../../core/servicios/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    SplashComponent,
    IconoGoogleComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly splashTerminado = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async ingresar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.cargando.set(true);
    try {
      const { email, password } = this.formulario.getRawValue();
      await this.auth.iniciarSesion(email, password);
      // Se recarga el perfil antes de navegar, así las guardias ya ven la sesión.
      await this.auth.recargarUsuario();
      await this.router.navigateByUrl(this.destino());
    } catch (error) {
      this.error.set(mensajeDeError(error) || 'Email o contraseña incorrectos');
    } finally {
      this.cargando.set(false);
    }
  }

  continuarConGoogle(): void {
    // Sin destino: el servicio arma la URL absoluta que exige Supabase.
    void this.auth.iniciarConProveedor('google').catch((error) => this.error.set(mensajeDeError(error)));
  }

  /** A dónde volver después de entrar: lo que pidió ?redirect=, si es una ruta de la app. */
  private destino(): string {
    const redirect = this.rutaActiva.snapshot.queryParamMap.get('redirect') || '/';
    if (redirect.startsWith(window.location.origin)) {
      return redirect.slice(window.location.origin.length) || '/';
    }
    return redirect.startsWith('/') ? redirect : '/';
  }
}
