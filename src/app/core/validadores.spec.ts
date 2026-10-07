import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { camposCoinciden } from './validadores';

function grupo(password: string, confirmacion: string) {
  return new FormGroup(
    { password: new FormControl(password), confirmacion: new FormControl(confirmacion) },
    { validators: camposCoinciden('password', 'confirmacion') },
  );
}

describe('camposCoinciden', () => {
  it('marca el grupo cuando los dos valores son distintos', () => {
    expect(grupo('secreto1', 'secreto2').hasError('noCoinciden')).toBe(true);
  });

  it('no marca error cuando coinciden', () => {
    expect(grupo('secreto1', 'secreto1').valid).toBe(true);
  });

  it('no marca error mientras alguno esté vacío (eso lo resuelve required)', () => {
    expect(grupo('secreto1', '').hasError('noCoinciden')).toBe(false);
    expect(grupo('', 'secreto1').hasError('noCoinciden')).toBe(false);
  });
});
