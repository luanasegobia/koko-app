import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonInputOtp,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular';
import { IconoGoogleComponent } from '../../compartido/icono-google/icono-google.component';
import { LayoutAuthComponent } from '../../compartido/layout-auth/layout-auth.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { camposCoinciden } from '../../core/validadores';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonIcon,
    IonInput,
    IonInputOtp,
    IonInputPasswordToggle,
    IonSpinner,
    LayoutAuthComponent,
    IconoGoogleComponent,
  ],
  templateUrl: './registro.page.html',
  styleUrl: './registro.page.scss',
})
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly esperandoCodigo = signal(false);
  protected readonly codigo = signal('');

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmacion: ['', Validators.required],
    },
    { validators: camposCoinciden('password', 'confirmacion') },
  );

  async crearCuenta(): Promise<void> {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      if (this.formulario.hasError('noCoinciden')) this.error.set('Las contraseñas no coinciden.');
      else if (this.formulario.controls.password.hasError('minlength')) {
        this.error.set('La contraseña tiene que tener al menos 6 caracteres.');
      }
      return;
    }

    this.cargando.set(true);
    try {
      const { nombre, email, password } = this.formulario.getRawValue();
      // El nombre viaja como metadato del alta: el trigger de la base lo copia al perfil.
      await this.auth.registrar({ email, password, nombre: nombre.trim() });
      this.esperandoCodigo.set(true);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  async verificar(): Promise<void> {
    if (this.codigo().length < 6) return;
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.verificarCodigo(this.formulario.controls.email.value, this.codigo());
      await this.auth.recargarUsuario();
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  async reenviar(): Promise<void> {
    this.error.set('');
    try {
      await this.auth.reenviarCodigo(this.formulario.controls.email.value);
      await this.avisos.exito('Revisá tu correo, te mandamos uno nuevo.', 'Código reenviado');
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  continuarConGoogle(): void {
    void this.auth.iniciarConProveedor('google').catch((error) => this.error.set(mensajeDeError(error)));
  }

  protected alCambiarCodigo(evento: CustomEvent<{ value?: string | number | null }>): void {
    this.codigo.set(String(evento.detail.value ?? ''));
  }
}
