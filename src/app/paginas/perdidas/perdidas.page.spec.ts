import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/servicios/auth.service';
import { AvisosService } from '../../core/servicios/avisos.service';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { PerdidasPage } from './perdidas.page';

/**
 * Los accesos directos de la portada (?action=report, ?action=sighting,
 * ?search=) tenían dos defectos:
 *   - al recargar con sesión iniciada, se chequeaba la sesión antes de que
 *     terminara de leerse y la persona terminaba en el login;
 *   - se leían una sola vez en ngOnInit, pero Ionic reutiliza la vista al
 *     volver a /perdidas, así que la segunda vez no hacían nada.
 */
const esperarTareas = () => new Promise((resolver) => setTimeout(resolver, 0));

describe('PerdidasPage: accesos directos por URL', () => {
  let parametros$: BehaviorSubject<ParamMap>;
  let autenticado: ReturnType<typeof signal<boolean>>;
  let resolverSesion: () => void;
  let auth: { autenticado: typeof autenticado; listo: () => Promise<void>; irAlLogin: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let pagina: PerdidasPage;

  function crear(parametrosIniciales: Record<string, string> = {}): void {
    parametros$ = new BehaviorSubject(convertToParamMap(parametrosIniciales));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParamMap: parametros$.asObservable() } },
        { provide: SupabaseService, useValue: { mascotasPerdidas: { listar: vi.fn(async () => []) } } },
        { provide: AvisosService, useValue: { error: vi.fn() } },
      ],
    });
    // Sin la plantilla: estos tests miran la lógica, no los componentes de Ionic.
    TestBed.overrideComponent(PerdidasPage, { set: { template: '', imports: [] } });
    pagina = TestBed.createComponent(PerdidasPage).componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    autenticado = signal(false);
    const sesion = new Promise<void>((resolver) => (resolverSesion = resolver));
    auth = { autenticado, listo: () => sesion, irAlLogin: vi.fn() };
    router = { navigate: vi.fn(async () => true) };
  });

  it('espera a que se lea la sesión antes de decidir (no manda al login a quien está logueado)', async () => {
    crear({ action: 'report' });
    await esperarTareas();
    // Todavía cargando: no se abrió nada ni se redirigió.
    expect(pagina['mostrarFormulario']()).toBe(false);
    expect(auth.irAlLogin).not.toHaveBeenCalled();

    autenticado.set(true);
    resolverSesion();
    await esperarTareas();

    expect(auth.irAlLogin).not.toHaveBeenCalled();
    expect(pagina['mostrarFormulario']()).toBe(true);
    expect(pagina['abrirCamara']()).toBe(false);
  });

  it('sin sesión manda al login, y la acción queda en la URL para volver con el formulario abierto', async () => {
    crear({ action: 'report' });
    resolverSesion();
    await esperarTareas();

    expect(auth.irAlLogin).toHaveBeenCalledTimes(1);
    expect(pagina['mostrarFormulario']()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('consume la acción de la URL para que "atrás" no reabra el formulario', async () => {
    autenticado.set(true);
    resolverSesion();
    crear({ action: 'sighting' });
    await esperarTareas();

    expect(pagina['abrirCamara']()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/perdidas'], {
      queryParams: { action: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('vuelve a abrir el formulario cuando Ionic reutiliza la vista con la misma acción', async () => {
    autenticado.set(true);
    resolverSesion();
    crear({ action: 'report' });
    await esperarTareas();
    pagina['cerrarFormulario']();
    expect(pagina['mostrarFormulario']()).toBe(false);

    // Volver a /perdidas?action=report desde la portada: misma instancia, parámetros nuevos.
    parametros$.next(convertToParamMap({ action: 'report' }));
    await esperarTareas();

    expect(pagina['mostrarFormulario']()).toBe(true);
  });

  it('?search= precarga el buscador cada vez que llega, y no lo pisa si no viene', async () => {
    crear({ search: 'labrador' });
    expect(pagina['busqueda']()).toBe('labrador');

    parametros$.next(convertToParamMap({ search: 'max' }));
    expect(pagina['busqueda']()).toBe('max');

    parametros$.next(convertToParamMap({}));
    expect(pagina['busqueda']()).toBe('max');
  });
});
