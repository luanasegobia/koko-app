import { Veterinaria } from '../../core/modelos';

export interface EstadoDeVeterinaria {
  etiqueta: string;
  /** Color de Ionic para la insignia y el punto. */
  color: 'danger' | 'success' | 'medium';
  abierta: boolean;
  pulso: boolean;
  icono: string;
  horario?: string;
  proximaApertura?: string;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const CERRADA: EstadoDeVeterinaria = {
  etiqueta: 'Cerrada',
  color: 'medium',
  abierta: false,
  pulso: false,
  icono: 'time-outline',
};

/** Calcula si la veterinaria está de turno ahora, según su horario semanal. */
export function estadoDeVeterinaria(veterinaria: Veterinaria, ahora = new Date()): EstadoDeVeterinaria {
  if (veterinaria.is_emergency) {
    return { etiqueta: 'Emergencia 24h', color: 'danger', abierta: true, pulso: true, icono: 'flash' };
  }

  const hoy = DIAS[ahora.getDay()];
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const horarios = veterinaria.schedule ?? [];

  const deHoy = horarios.find((h) => h.day === hoy);
  if (deHoy && horaActual >= deHoy.open && horaActual <= deHoy.close) {
    return {
      etiqueta: 'De turno',
      color: 'success',
      abierta: true,
      pulso: true,
      icono: 'time-outline',
      horario: `${deHoy.open} – ${deHoy.close}`,
    };
  }

  for (let i = 0; i < 7; i++) {
    const dia = DIAS[(ahora.getDay() + i) % 7];
    const horario = horarios.find((h) => h.day === dia);
    if (!horario) continue;
    if (i === 0 && horaActual < horario.open) {
      return { ...CERRADA, proximaApertura: `Abre hoy ${horario.open}` };
    }
    if (i > 0) {
      return { ...CERRADA, proximaApertura: `Abre ${dia} ${horario.open}` };
    }
  }

  return CERRADA;
}
