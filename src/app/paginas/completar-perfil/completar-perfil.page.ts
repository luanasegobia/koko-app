import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular';
import { SelectorRolComponent } from '../../compartido/onboarding/selector-rol.component';
import { mensajeDeError } from '../../core/mensaje-de-error';
import { Perfil, TipoCuenta } from '../../core/modelos';
import { AuthService } from '../../core/servicios/auth.service';
import { SupabaseService } from '../../core/servicios/supabase.service';

/** Onboarding en dos pasos: tipo de cuenta y datos de contacto (o de la clínica). */
@Component({
  selector: 'app-completar-perfil',
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSpinner,
    SelectorRolComponent,
  ],
  templateUrl: './completar-perfil.page.html',
  styleUrl: './completar-perfil.page.scss',
})
export class CompletarPerfilPage {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly paso = signal<1 | 2>(1);
  protected readonly tipoDeCuenta = signal<TipoCuenta>('usuario');
  protected readonly esVeterinario = computed(() => this.tipoDeCuenta() === 'veterinario');
  protected readonly guardando = signal(false);
  protected readonly error = signal('');

  protected readonly formulario = this.fb.nonNullable.group({
    organization_name: '',
    bio: '',
    phone: '',
    location: '',
    // Campos de veterinario
    vet_clinic_name: '',
    vet_address: '',
    vet_phone: '',
    vet_services: '',
  });

  protected puedeEnviar(): boolean {
    const valores = this.formulario.getRawValue();
    if (this.tipoDeCuenta() === 'organizacion' && !valores.organization_name.trim()) return false;
    if (this.esVeterinario() && (!valores.vet_clinic_name.trim() || !valores.vet_address.trim())) {
      return false;
    }
    return true;
  }

  async guardar(): Promise<void> {
    this.guardando.set(true);
    this.error.set('');
    const valores = this.formulario.getRawValue();
    const datos: Partial<Perfil> = {
      tipo_cuenta: this.tipoDeCuenta(),
      profile_completed: true,
      bio: valores.bio,
      phone: valores.phone,
      location: valores.location,
    };
    if (this.tipoDeCuenta() === 'organizacion') datos.organization_name = valores.organization_name;

    try {
      await this.auth.actualizarPerfil(datos);

      // Si es veterinario, se crea la ficha pendiente de verificación.
      // registered_by_user_id lo pone el servidor con auth.uid().
      if (this.esVeterinario()) {
        await this.supabase.veterinarias.crear({
          name: valores.vet_clinic_name.trim(),
          address: valores.vet_address.trim(),
          phone: valores.vet_phone || valores.phone,
          services: valores.vet_services,
          bio: valores.bio,
          is_emergency: false,
          is_verified: false,
        });
      }

      await this.auth.recargarUsuario();
      // Vuelve a donde la persona quería ir, que es lo que anotó la guardia de perfil.
      const volverA = this.rutaActiva.snapshot.queryParamMap.get('volverA') || '/';
      await this.router.navigateByUrl(volverA, { replaceUrl: true });
    } catch (error) {
      // Sin este catch el botón quedaría girando y la persona volvería al onboarding en cada inicio.
      this.error.set(mensajeDeError(error));
      this.guardando.set(false);
    }
  }
}
