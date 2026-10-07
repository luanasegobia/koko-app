import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasoUrgente } from '../../core/modelos';
import { SupabaseService } from '../../core/servicios/supabase.service';
import { FormularioCasoUrgenteComponent } from './formulario-caso-urgente.component';

const CASO: CasoUrgente = {
  id: 'c1',
  title: 'Cirugía para Bruno',
  description: 'Fractura de cadera',
  goal_amount: 180000,
  donation_alias: 'patitas.oran',
  needs: [
    { label: 'Cirugía', status: 'cubierto' },
    { label: 'Traslado', status: 'pendiente' },
  ],
  status: 'activo',
};

/**
 * Al editar, el formulario se carga en ngOnInit. Antes se difería con
 * queueMicrotask desde el constructor: en una app sin zone.js, la lista de
 * necesidades cambiaba después del primer renderizado y nada la volvía a
 * dibujar.
 */
describe('FormularioCasoUrgenteComponent', () => {
  let actualizar: ReturnType<typeof vi.fn>;

  function crear(registro: CasoUrgente | null) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: { casosUrgentes: { actualizar, crear: vi.fn(async () => ({})) }, subirArchivo: vi.fn() },
        },
      ],
    });
    TestBed.overrideComponent(FormularioCasoUrgenteComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(FormularioCasoUrgenteComponent);
    fixture.componentRef.setInput('registroInicial', registro);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    actualizar = vi.fn(async () => ({}));
  });

  it('al editar, ya en el primer ciclo tiene los datos y las necesidades del caso', () => {
    const formulario = crear(CASO)['formulario'];
    expect(formulario.controls.title.value).toBe('Cirugía para Bruno');
    expect(formulario.controls.goal_amount.value).toBe(180000);
    expect(formulario.controls.necesidades.value).toEqual(['Cirugía', 'Traslado']);
  });

  it('al crear, arranca vacío con una necesidad en blanco', () => {
    const formulario = crear(null)['formulario'];
    expect(formulario.controls.title.value).toBe('');
    expect(formulario.controls.necesidades.value).toEqual(['']);
  });

  it('no acepta una meta de recaudación negativa', () => {
    const formulario = crear(null)['formulario'];
    formulario.patchValue({ title: 'Caso', description: 'Detalle', goal_amount: -5 });
    expect(formulario.controls.goal_amount.hasError('min')).toBe(true);
    expect(formulario.invalid).toBe(true);
  });

  it('al guardar conserva el estado de las necesidades que ya estaban', async () => {
    const componente = crear(CASO);
    componente['agregarNecesidad']();
    componente['formulario'].controls.necesidades.at(2).setValue('Medicamentos');

    await componente.guardar();

    expect(actualizar).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        needs: [
          { label: 'Cirugía', status: 'cubierto' },
          { label: 'Traslado', status: 'pendiente' },
          { label: 'Medicamentos', status: 'pendiente' },
        ],
      }),
    );
  });
});
