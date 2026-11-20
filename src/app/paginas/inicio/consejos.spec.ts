import { describe, expect, it } from 'vitest';
import { consejosDelMes } from './consejos';

describe('consejosDelMes', () => {
  it('en enero muestra los de verano y fiestas, además del de todo el año', () => {
    const titulos = consejosDelMes(1).map((consejo) => consejo.etiqueta);
    expect(titulos).toEqual(['Verano', 'Fiestas', 'Calor', 'Todo el año']);
  });

  it('en julio muestra el de invierno y no los de verano', () => {
    const titulos = consejosDelMes(7).map((consejo) => consejo.etiqueta);
    expect(titulos).toEqual(['Invierno', 'Todo el año']);
  });

  it('reconoce las temporadas que cruzan el fin de año', () => {
    const deDiciembre = consejosDelMes(12).map((consejo) => consejo.id);
    expect(deDiciembre).toContain('pirotecnia');
    expect(consejosDelMes(2).map((consejo) => consejo.id)).not.toContain('pirotecnia');
  });

  it('siempre hay al menos un consejo', () => {
    for (let mes = 1; mes <= 12; mes++) {
      expect(consejosDelMes(mes).length).toBeGreaterThan(0);
    }
  });
});
