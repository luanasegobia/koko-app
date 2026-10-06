import { describe, expect, it } from 'vitest';
import { Veterinaria } from '../../core/modelos';
import { estadoDeVeterinaria } from './estado-veterinaria';

function veterinaria(parcial: Partial<Veterinaria> = {}): Veterinaria {
  return { id: 'v1', name: 'San Roque', address: 'Av. Libertad 450', phone: '3878', ...parcial };
}

// Un martes a las 15:00.
const MARTES_15 = new Date(2026, 9, 6, 15, 0);

describe('estadoDeVeterinaria', () => {
  it('las de emergencia están siempre disponibles', () => {
    const estado = estadoDeVeterinaria(veterinaria({ is_emergency: true }), MARTES_15);
    expect(estado).toMatchObject({ etiqueta: 'Emergencia 24h', abierta: true, color: 'danger' });
  });

  it('está de turno dentro del horario de hoy', () => {
    const estado = estadoDeVeterinaria(
      veterinaria({ schedule: [{ day: 'martes', open: '09:00', close: '18:00' }] }),
      MARTES_15,
    );
    expect(estado).toMatchObject({ etiqueta: 'De turno', abierta: true, horario: '09:00 – 18:00' });
  });

  it('avisa que abre hoy más tarde', () => {
    const estado = estadoDeVeterinaria(
      veterinaria({ schedule: [{ day: 'martes', open: '17:00', close: '21:00' }] }),
      MARTES_15,
    );
    expect(estado).toMatchObject({ abierta: false, proximaApertura: 'Abre hoy 17:00' });
  });

  it('busca el próximo día con horario cuando hoy ya cerró', () => {
    const estado = estadoDeVeterinaria(
      veterinaria({
        schedule: [
          { day: 'martes', open: '08:00', close: '12:00' },
          { day: 'jueves', open: '09:00', close: '13:00' },
        ],
      }),
      MARTES_15,
    );
    expect(estado).toMatchObject({ abierta: false, proximaApertura: 'Abre jueves 09:00' });
  });

  it('sin horario cargado queda cerrada', () => {
    expect(estadoDeVeterinaria(veterinaria(), MARTES_15)).toMatchObject({
      etiqueta: 'Cerrada',
      abierta: false,
      color: 'medium',
    });
  });
});
