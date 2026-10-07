import { describe, expect, it } from 'vitest';
import { ErrorDeArchivo, ErrorDeDatos, SinPermisoError } from './errores';
import { mensajeDeError } from './mensaje-de-error';

describe('mensajeDeError', () => {
  it('devuelve un mensaje genérico cuando no hay error', () => {
    expect(mensajeDeError(null)).toBe('Ocurrió un error inesperado.');
  });

  it('respeta el mensaje de los errores tipados', () => {
    expect(mensajeDeError(new ErrorDeArchivo('Pesa demasiado.'))).toBe('Pesa demasiado.');
    expect(mensajeDeError(new SinPermisoError())).toBe('No tenés permiso para hacer esto.');
  });

  it('traduce los códigos conocidos de PostgREST', () => {
    const duplicado = new ErrorDeDatos('duplicate key', { causa: { code: '23505' } });
    expect(mensajeDeError(duplicado)).toBe('Ese registro ya existe.');
    expect(mensajeDeError({ code: '42501', message: 'rls' })).toBe('No tenés permiso para hacer esto.');
  });

  it('detecta la falta de conexión', () => {
    const red = new TypeError('Failed to fetch');
    expect(mensajeDeError(red)).toMatch(/conexión a internet/);
  });

  it('cae en el mensaje original para cualquier otro error', () => {
    expect(mensajeDeError(new Error('Algo raro'))).toBe('Algo raro');
  });
});
