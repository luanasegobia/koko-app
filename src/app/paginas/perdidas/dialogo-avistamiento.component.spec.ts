import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MascotaPerdida } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { DialogoAvistamientoComponent } from './dialogo-avistamiento.component';

const MASCOTA: MascotaPerdida = { id: 'm1', pet_name: 'Luna', species: 'perro', status: 'perdida' };

/**
 * Después de guardar, el diálogo se cierra solo a los 1,5 s. Si la persona lo
 * cerraba antes, el temporizador seguía vivo y emitía `cerrar` sobre un
 * componente ya destruido: Angular descarta el evento y avisa NG0953 en consola.
 */
describe('DialogoAvistamientoComponent', () => {
  let rpc: ReturnType<typeof vi.fn>;

  function crear() {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { rpc } }],
    });
    TestBed.overrideComponent(DialogoAvistamientoComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(DialogoAvistamientoComponent);
    fixture.componentRef.setInput('mascota', MASCOTA);
    const componente = fixture.componentInstance;
    componente['formulario'].setValue({ direccion: 'Plaza 9 de Julio', nota: '' });
    const cerrar = vi.fn();
    componente.cerrar.subscribe(cerrar);
    return { fixture, componente, cerrar };
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    rpc = vi.fn(async () => null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registra el avistamiento con la función de la base y se cierra solo', async () => {
    const { componente, cerrar } = crear();
    await componente.enviar();

    expect(rpc).toHaveBeenCalledWith('agregar_avistamiento', {
      id_mascota: 'm1',
      direccion: 'Plaza 9 de Julio',
      nota: null,
      lat: null,
      lng: null,
    });
    expect(cerrar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('si se cierra antes de tiempo, el temporizador se cancela y no emite sobre el componente destruido', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, componente, cerrar } = crear();
    await componente.enviar();

    fixture.destroy();
    vi.advanceTimersByTime(1500);

    expect(cerrar).not.toHaveBeenCalled();
    expect(aviso).not.toHaveBeenCalledWith(expect.stringContaining('NG0953'));
    aviso.mockRestore();
  });
});
