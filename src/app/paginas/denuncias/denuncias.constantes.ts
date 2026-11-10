import { EstadoDenuncia, TipoDenuncia } from '../../core/modelos';

export const TIPO_DENUNCIA: Record<TipoDenuncia, { etiqueta: string; color: string }> = {
  urgente: { etiqueta: 'Urgente', color: 'danger' },
  regular: { etiqueta: 'Regular', color: 'secondary' },
  anonima: { etiqueta: 'Anónima', color: 'tertiary' },
};

export const ETIQUETA_ESTADO_DENUNCIA: Record<EstadoDenuncia, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  derivada: 'Derivada',
  resuelta: 'Resuelta',
};

export const COLOR_ESTADO_DENUNCIA: Record<EstadoDenuncia, string> = {
  pendiente: 'secondary',
  en_revision: 'tertiary',
  derivada: 'purpura',
  resuelta: 'primary',
};
