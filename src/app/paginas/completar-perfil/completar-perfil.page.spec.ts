import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/servicios/auth.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { CompletarPerfilPage } from './completar-perfil.page';

/**
 * El alta de veterinaria tiene que exigir nombre, dirección y teléfono, igual
 * que la ficha que después edita administración. La versión en React lo
 * validaba con un esquema; en la migración el teléfono había quedado opcional
 * y el botón "Llamar" del directorio podía apuntar a la nada.
 */
describe('CompletarPerfilPage: alta de veterinaria', () => {
  let crearVeterinaria: ReturnType<typeof vi.fn>;
  let filtrarVeterinarias: ReturnType<typeof vi.fn>;
  let actualizarPerfil: ReturnType<typeof vi.fn>;
  let pagina: CompletarPerfilPage;

  beforeEach(() => {
    TestBed.resetTestingModule();
    crearVeterinaria = vi.fn(async () => ({}));
    filtrarVeterinarias = vi.fn(async () => []);
    actualizarPerfil = vi.fn(async () => ({}));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            usuario: () => ({ id: 'u1' }),
            actualizarPerfil,
            recargarUsuario: vi.fn(async () => null),
          },
        },
        {
          provide: SupabaseService,
          useValue: { veterinarias: { crear: crearVeterinaria, filtrar: filtrarVeterinarias } },
        },
        { provide: Router, useValue: { navigateByUrl: vi.fn(async () => true) } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    TestBed.overrideComponent(CompletarPerfilPage, { set: { template: '', imports: [] } });
    pagina = TestBed.createComponent(CompletarPerfilPage).componentInstance;
    pagina['tipoDeCuenta'].set('veterinario');
  });

  it('no deja enviar sin teléfono de la clínica', () => {
    pagina['formulario'].patchValue({ vet_clinic_name: 'San Roque', vet_address: 'Av. Libertad 450' });
    expect(pagina['puedeEnviar']()).toBe(false);

    pagina['formulario'].patchValue({ vet_phone: '   ' });
    expect(pagina['puedeEnviar']()).toBe(false);

    pagina['formulario'].patchValue({ vet_phone: '3878 412233' });
    expect(pagina['puedeEnviar']()).toBe(true);
  });

  it('crea la ficha pendiente de verificación con el teléfono de la clínica', async () => {
    pagina['formulario'].patchValue({
      vet_clinic_name: ' San Roque ',
      vet_address: 'Av. Libertad 450',
      vet_phone: ' 3878 412233 ',
    });

    await pagina.guardar();

    expect(crearVeterinaria).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'San Roque', phone: '3878 412233', is_verified: false }),
    );
  });

  const datosDeClinica = { vet_clinic_name: 'San Roque', vet_address: 'Av. Libertad 450', vet_phone: '3878 412233' };

  it('si la ficha no se puede crear, el perfil no queda marcado como completo', async () => {
    crearVeterinaria.mockRejectedValueOnce(new Error('sin conexión'));
    pagina['formulario'].patchValue(datosDeClinica);

    await pagina.guardar();

    expect(actualizarPerfil).not.toHaveBeenCalled();
    expect(pagina['error']()).not.toBe('');
  });

  it('al reintentar no duplica una ficha que ya se había creado', async () => {
    filtrarVeterinarias.mockResolvedValueOnce([{ id: 'v1' }]);
    pagina['formulario'].patchValue(datosDeClinica);

    await pagina.guardar();

    expect(filtrarVeterinarias).toHaveBeenCalledWith({ registered_by_user_id: 'u1' });
    expect(crearVeterinaria).not.toHaveBeenCalled();
    expect(actualizarPerfil).toHaveBeenCalled();
  });

  it('no manda teléfono ni ubicación personales, que este paso no muestra', async () => {
    pagina['formulario'].patchValue(datosDeClinica);

    await pagina.guardar();

    const datos = actualizarPerfil.mock.calls[0][0];
    expect(datos).toMatchObject({ tipo_cuenta: 'veterinario', profile_completed: true });
    expect(datos).not.toHaveProperty('phone');
    expect(datos).not.toHaveProperty('location');
  });
});
