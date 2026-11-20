import { describe, expect, it } from 'vitest';
import { consejosDelMes } from './consejos';

describe('consejosDelMes', () => {
  it('en enero muestra los de verano y fiestas, y deja para el final el de todo el año', () => {
    const titulos = consejosDelMes(1).map((consejo) => consejo.etiqueta);
    expect(titulos).toEqual(['Verano', 'Fiestas', 'Parásitos', 'Todo el año']);
  });

  it('en julio muestra el de invierno y no los de verano', () => {
    const titulos = consejosDelMes(7).map((consejo) => consejo.etiqueta);
    expect(titulos).toEqual(['Invierno', 'Todo el año']);
  });

  it('siempre hay al menos un consejo', () => {
    for (let mes = 1; mes <= 12; mes++) {
      expect(consejosDelMes(mes).length).toBeGreaterThan(0);
    }
  });
});
