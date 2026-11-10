import { Pipe, PipeTransform } from '@angular/core';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/** `{{ fecha | fecha }}` → "5 oct 2026". Acepta un formato de date-fns como argumento. */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, formato = 'd MMM yyyy'): string {
    if (!valor) return '';
    return format(new Date(valor), formato, { locale: es });
  }
}

/** `{{ fecha | haceTiempo }}` → "hace 3 horas". */
@Pipe({ name: 'haceTiempo' })
export class HaceTiempoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    return formatDistanceToNow(new Date(valor), { addSuffix: true, locale: es });
  }
}
