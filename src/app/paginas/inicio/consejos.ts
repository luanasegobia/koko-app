export interface Consejo {
  /** Meses (1 a 12) en los que se muestra. Vacío = todo el año. */
  meses: number[];
  etiqueta: string;
  titulo: string;
  bajada: string;
  pasos: string[];
  nota: string;
}

/** Consejos de cuidado según la época del año, pensados para el hemisferio sur. */
export const CONSEJOS: Consejo[] = [
  {
    meses: [10, 11, 12, 1, 2, 3],
    etiqueta: 'Verano',
    titulo: 'Golpe de calor',
    bajada: 'Señales: jadeo fuerte, mucha baba, encías muy rojas, decaimiento o vómitos.',
    pasos: [
      'Llevalo a la sombra o a un lugar fresco.',
      'Mojalo con agua fresca (no helada): panza, axilas, patas y orejas.',
      'Ventilá para que se evapore y ofrecé agua en pocos sorbos.',
      'Andá al veterinario enseguida, aunque parezca recuperado.',
    ],
    nota: 'Sin hielo ni agua helada. Nunca lo dejes en el auto.',
  },
  {
    meses: [11, 12, 1],
    etiqueta: 'Fiestas',
    titulo: 'Pirotecnia: cómo cuidarlos',
    bajada: 'Para muchas mascotas, el ruido es muy estresante.',
    pasos: [
      'Dejalo en un cuarto interno, con ventanas cerradas y música o tele.',
      'Armale un rincón seguro y no lo dejes solo.',
      'Revisá collar y chapita antes: muchas se pierden por el susto.',
    ],
    nota: 'Si es muy miedoso, consultá a tu veterinario. No lo medices por tu cuenta.',
  },
  {
    meses: [9, 10, 11, 12, 1, 2, 3, 4],
    etiqueta: 'Parásitos',
    titulo: 'Pulgas y garrapatas',
    bajada: 'Con el calor aumentan los parásitos.',
    pasos: [
      'Usá el antiparasitario que indique tu veterinario.',
      'Revisá orejas, axilas y entre los dedos después de cada paseo.',
      'Lavá sus camas y aspirá los rincones donde descansa.',
    ],
    nota: 'No uses productos de perros en gatos: pueden ser tóxicos.',
  },
  {
    meses: [5, 6, 7, 8],
    etiqueta: 'Invierno',
    titulo: 'Frío y abrigo',
    bajada: 'El frío afecta más a cachorros y mayores.',
    pasos: [
      'Cama alzada del piso y con mantas.',
      'Cuidado con estufas y braseros: quemaduras y monóxido.',
      'Golpeá el capó antes de arrancar: los gatos buscan calor en los motores.',
    ],
    nota: 'Si ves animales de la calle, un refugio con techo ayuda.',
  },
  {
    meses: [],
    etiqueta: 'Todo el año',
    titulo: 'Cuidado al día',
    bajada: 'Lo básico que protege a tu mascota.',
    pasos: [
      'Chapita puesta y registro en el módulo ID.',
      'Vacunas y desparasitación según indique tu veterinario.',
      'Control veterinario una vez al año.',
    ],
    nota: 'Una mascota identificada tiene más chances de volver a casa.',
  },
];

/** Los consejos que corresponden a un mes (1 a 12): primero los de temporada, al final los de todo el año. */
export function consejosDelMes(mes: number, consejos: Consejo[] = CONSEJOS): Consejo[] {
  const deTemporada = consejos.filter((consejo) => consejo.meses.includes(mes));
  const deTodoElAnio = consejos.filter((consejo) => consejo.meses.length === 0);
  return [...deTemporada, ...deTodoElAnio];
}
