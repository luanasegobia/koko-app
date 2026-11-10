import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Notificacion } from '../../core/modelos';
import { NotificacionesService } from '../../core/servicios/notificaciones.service';
import { PanelNotificacionesComponent } from './panel-notificaciones.component';

function notificacion(parcial: Partial<Notificacion> = {}): Notificacion {
  return {
    id: 'n1',
    user_id: 'u1',
    type: 'chat_reply',
    title: 'Nueva respuesta',
    body: 'Ana: hola',
    link: '/perdidas',
    read: false,
    ...parcial,
  };
}

/**
 * Cada notificación trae un `link` a la pantalla que la originó. El panel solo
 * la marcaba como leída: tocarla no llevaba a ningún lado.
 */
describe('PanelNotificacionesComponent: abrir una notificación', () => {
  let marcarLeida: ReturnType<typeof vi.fn>;
  let navegar: ReturnType<typeof vi.fn>;
  let panel: PanelNotificacionesComponent;
  let cierres: number;

  beforeEach(() => {
    TestBed.resetTestingModule();
    marcarLeida = vi.fn(async () => undefined);
    navegar = vi.fn(async () => true);
    TestBed.configureTestingModule({
      providers: [
        { provide: NotificacionesService, useValue: { marcarLeida } },
        { provide: Router, useValue: { navigateByUrl: navegar } },
      ],
    });
    TestBed.overrideComponent(PanelNotificacionesComponent, { set: { template: '', imports: [] } });
    panel = TestBed.createComponent(PanelNotificacionesComponent).componentInstance;
    cierres = 0;
    panel.cerrar.subscribe(() => cierres++);
  });

  it('la marca como leída, cierra el panel y lleva a su destino', () => {
    panel['abrir'](notificacion());

    expect(marcarLeida).toHaveBeenCalledWith('n1');
    expect(cierres).toBe(1);
    expect(navegar).toHaveBeenCalledWith('/perdidas');
  });

  it('una ya leída igual lleva a su destino, sin volver a marcarla', () => {
    panel['abrir'](notificacion({ read: true }));

    expect(marcarLeida).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/perdidas');
  });

  it('sin destino solo la marca como leída', () => {
    panel['abrir'](notificacion({ link: undefined }));

    expect(marcarLeida).toHaveBeenCalledWith('n1');
    expect(navegar).not.toHaveBeenCalled();
    expect(cierres).toBe(0);
  });

  it('no navega a direcciones externas', () => {
    panel['abrir'](notificacion({ link: 'https://ejemplo.com' }));
    panel['abrir'](notificacion({ link: '//ejemplo.com' }));

    expect(navegar).not.toHaveBeenCalled();
  });
});
