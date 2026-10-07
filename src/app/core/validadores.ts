import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de grupo: dos campos del formulario tienen que tener el mismo
 * valor (por ejemplo, la contraseña y su repetición). Mientras alguno esté
 * vacío no marca error: de eso se ocupa Validators.required en cada campo.
 *
 * Devuelve `{ noCoinciden: true }` sobre el grupo.
 */
export function camposCoinciden(campo: string, repeticion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value;
    const repetido = grupo.get(repeticion)?.value;
    return valor && repetido && valor !== repetido ? { noCoinciden: true } : null;
  };
}
