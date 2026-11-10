import { describe, expect, it } from 'vitest';
import { edadONull, enlaceDeWhatsApp, rutaDeRetorno } from './utilidades';

describe('edadONull', () => {
  it('conserva el cero: una mascota de menos de un año es un dato válido', () => {
    expect(edadONull(0)).toBe(0);
  });

  it('devuelve null cuando el campo quedó vacío, para que la base borre el valor viejo', () => {
    expect(edadONull(null)).toBeNull();
    expect(edadONull(undefined)).toBeNull();
    expect(edadONull('')).toBeNull();
  });

  it('acepta el número como texto, que es como lo puede entregar el campo', () => {
    expect(edadONull('3')).toBe(3);
  });
});

describe('enlaceDeWhatsApp', () => {
  it('deja solo dígitos', () => {
    expect(enlaceDeWhatsApp('+54 9 387 123-4567')).toBe('https://wa.me/5493871234567');
  });

  it('agrega el código de país a un número local', () => {
    expect(enlaceDeWhatsApp('3878 123456')).toBe('https://wa.me/5493878123456');
  });

  it('quita el cero inicial del código de área', () => {
    expect(enlaceDeWhatsApp('03878 123456')).toBe('https://wa.me/5493878123456');
  });

  it('agrega el 9 de celular cuando el número trae solo el 54', () => {
    expect(enlaceDeWhatsApp('+54 387 1234567')).toBe('https://wa.me/5493871234567');
  });
});

describe('rutaDeRetorno', () => {
  it('sin pedido va al inicio', () => {
    expect(rutaDeRetorno(null)).toBe('/');
    expect(rutaDeRetorno('')).toBe('/');
  });

  it('acepta una ruta de la app, con sus parámetros', () => {
    expect(rutaDeRetorno('/perdidas?action=report')).toBe('/perdidas?action=report');
  });

  it('acepta la dirección completa de esta misma app y se queda con la ruta', () => {
    expect(rutaDeRetorno(`${window.location.origin}/denuncias`)).toBe('/denuncias');
  });

  it('descarta otros sitios, también los escritos como //sitio', () => {
    expect(rutaDeRetorno('https://ejemplo.com/robo')).toBe('/');
    expect(rutaDeRetorno('//ejemplo.com/robo')).toBe('/');
  });
});
