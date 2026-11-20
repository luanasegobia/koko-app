/** Un bloque de la guía completa: una lista con título o una nota destacada. */
export type SeccionDeConsejo =
  | { tipo: 'lista' | 'pasos' | 'evitar'; titulo: string; items: string[] }
  | { tipo: 'nota'; texto: string };

export interface Consejo {
  id: string;
  /** Mes en que empieza y mes en que termina (1 a 12). Puede cruzar el fin de año: [10, 3] va de octubre a marzo. */
  meses: [number, number];
  etiqueta: string;
  /** El tono elige el color del borde y de la etiqueta: cálido (naranja) o frío (azul). */
  tono: 'calido' | 'frio';
  icono: string;
  titulo: string;
  /** Lo que se lee en la tarjeta del inicio. */
  resumen: string;
  /** La primera frase de la guía completa. */
  bajada: string;
  secciones: SeccionDeConsejo[];
  /** El botón al pie de la guía: lleva a `ruta` si la tiene, o solo la cierra. */
  boton: { texto: string; ruta?: string };
}

export const ACLARACION_DE_CONSEJOS =
  'Información orientativa. No reemplaza la consulta con un profesional veterinario.';

/** Consejos de cuidado según la época del año, pensados para el hemisferio sur. */
export const CONSEJOS: Consejo[] = [
  {
    id: 'calor',
    meses: [10, 3],
    etiqueta: 'Verano',
    tono: 'calido',
    icono: 'sunny-outline',
    titulo: 'Golpe de calor en mascotas',
    resumen:
      'Jadeo fuerte, baba y encías muy rojas son señales de alerta. Enfriá con agua fresca y consultá a tu veterinario.',
    bajada:
      'En zonas de altas temperaturas como la nuestra, saber qué hacer puede salvarle la vida.',
    secciones: [
      {
        tipo: 'lista',
        titulo: 'Señales de alerta',
        items: [
          'Jadeo muy fuerte y mucha baba.',
          'Encías rojo intenso o muy pálidas.',
          'Decaimiento, tambaleo o vómitos.',
          'Desmayo o convulsiones: es una emergencia.',
        ],
      },
      {
        tipo: 'pasos',
        titulo: 'Qué hacer ahora',
        items: [
          'Llevalo a un lugar fresco y con sombra.',
          'Mojalo con agua fresca (no helada), sobre todo panza, axilas, patas y orejas.',
          'Ponele un ventilador para que el agua se evapore.',
          'Ofrecele agua fresca en pocos sorbos, sin forzarlo.',
          'Contactá a tu veterinario de confianza o andá a la consulta más cercana, aunque parezca recuperado.',
        ],
      },
      {
        tipo: 'nota',
        texto:
          'Si es fuera de horario de atención, empezá a enfriarlo igual y llamá a tu veterinario de confianza para que te oriente. Aunque se lo vea mejor, el golpe de calor puede dañar órganos por dentro: siempre hace falta un control veterinario.',
      },
      {
        tipo: 'evitar',
        titulo: 'Qué NO hacer',
        items: [
          'No uses hielo ni agua helada.',
          'No lo envuelvas en toallas mojadas por mucho rato: atrapan el calor.',
          'No lo dejes en el auto, ni siquiera “un ratito”.',
          'No lo obligues a tomar agua.',
        ],
      },
      {
        tipo: 'lista',
        titulo: 'Cómo prevenirlo',
        items: [
          'Paseá temprano a la mañana o al atardecer, evitá la siesta.',
          'Tocá el piso con el dorso de la mano 5 segundos: si te quema, también quema sus almohadillas.',
          'Dejale siempre agua fresca y sombra.',
          'Más cuidado con cachorros, mayores, con sobrepeso y de hocico chato (bulldog, pug, gatos persas).',
        ],
      },
    ],
    boton: { texto: 'Ver veterinarios y horarios', ruta: '/veterinarias' },
  },
  {
    id: 'pirotecnia',
    meses: [11, 1],
    etiqueta: 'Fiestas',
    tono: 'calido',
    icono: 'sparkles-outline',
    titulo: 'Pirotecnia: cuidá a tu mascota',
    resumen:
      'Los ruidos fuertes los asustan mucho. Preparales un lugar tranquilo y chequeá que tengan su identificación.',
    bajada: 'Con un poco de preparación, las fiestas pueden ser mucho más tranquilas para ellos.',
    secciones: [
      {
        tipo: 'lista',
        titulo: 'Antes de los festejos',
        items: [
          'Preparales un cuarto tranquilo, con ventanas y cortinas cerradas.',
          'Dejales agua fresca y su cama o refugio habitual.',
          'Chequeá que tengan su chapita o ID con tu teléfono actualizado.',
          'Evitá sacarlos a pasear en horarios de festejo.',
        ],
      },
      {
        tipo: 'lista',
        titulo: 'Durante',
        items: [
          'Quedate con ellos si podés y mantené la calma: se guían por tu actitud.',
          'Poné música o la tele a volumen moderado para tapar los ruidos.',
        ],
      },
      {
        tipo: 'evitar',
        titulo: 'Qué NO hacer',
        items: [
          'No los dejes atados ni solos en el patio.',
          'No los fuerces a salir de su escondite.',
          'No les des calmantes por tu cuenta: consultá antes con tu veterinario.',
        ],
      },
      {
        tipo: 'nota',
        texto: 'Si se escapa, activá el aviso de Mascota perdida en KOKO cuanto antes.',
      },
    ],
    boton: { texto: 'Entendido' },
  },
  {
    id: 'garrapatas',
    meses: [9, 4],
    etiqueta: 'Calor',
    tono: 'calido',
    icono: 'bug-outline',
    titulo: 'Garrapatas y pulgas',
    resumen:
      'Con el calor aumentan los parásitos. Revisá el pelaje después de cada paseo y consultá qué antiparasitario usar.',
    bajada: 'Detectarlas a tiempo evita molestias y enfermedades.',
    secciones: [
      {
        tipo: 'lista',
        titulo: 'Cómo detectarlas',
        items: [
          'Revisá orejas, cuello, entre los dedos y axilas después de cada paseo.',
          'Rascado insistente, mordisqueos o zonas peladas pueden ser señales.',
          'Bolitas oscuras pegadas a la piel pueden ser garrapatas.',
        ],
      },
      {
        tipo: 'lista',
        titulo: 'Cómo cuidarlos',
        items: [
          'Usá antiparasitarios indicados por tu veterinario.',
          'Mantené limpios patios, camas y mantas.',
          'Lavá y secá bien sus cosas con regularidad.',
        ],
      },
      {
        tipo: 'evitar',
        titulo: 'Qué NO hacer',
        items: [
          'No uses productos para perros en gatos: algunos son tóxicos para ellos.',
          'No las aplastes ni las arranques a tirones.',
        ],
      },
    ],
    boton: { texto: 'Entendido' },
  },
  {
    id: 'frio',
    meses: [5, 8],
    etiqueta: 'Invierno',
    tono: 'frio',
    icono: 'snow-outline',
    titulo: 'Frío en mascotas',
    resumen:
      'Una cama abrigada y lejos del piso hace la diferencia, sobre todo en perros chicos, mayores y de pelo corto.',
    bajada: 'Ellos también sienten el frío, y los animales de la calle más.',
    secciones: [
      {
        tipo: 'lista',
        titulo: 'Cómo abrigarlos',
        items: [
          'Cama gruesa, alejada del piso y de las corrientes de aire.',
          'Ropa o mantita para perros chicos, mayores o de pelo corto.',
          'Secalos bien después de mojarse.',
        ],
      },
      {
        tipo: 'lista',
        titulo: 'Animales de la calle',
        items: ['Si ves un gato abajo de un auto, golpeá el capot antes de arrancar.'],
      },
      {
        tipo: 'evitar',
        titulo: 'Qué NO hacer',
        items: [
          'No los acerques demasiado a estufas o braseros: pueden quemarse o intoxicarse con monóxido.',
        ],
      },
    ],
    boton: { texto: 'Entendido' },
  },
  {
    id: 'identificacion',
    meses: [1, 12],
    etiqueta: 'Todo el año',
    tono: 'frio',
    icono: 'pricetag-outline',
    titulo: 'Que siempre puedan volver a casa',
    resumen:
      'Una chapita con tu teléfono y su ficha en Mis mascotas aumentan mucho las chances de reencontrarse.',
    bajada: 'Identificarlos es lo más simple y lo más útil si se pierden.',
    secciones: [
      {
        tipo: 'pasos',
        titulo: 'Qué podés hacer hoy',
        items: [
          'Ponele una chapita con tu teléfono.',
          'Sacale una foto reciente y clara, de frente y de perfil.',
          'Registralo en Mis mascotas dentro de KOKO y mantené tus datos actualizados.',
          'Consultá con tu veterinario el esquema de vacunas y desparasitación.',
        ],
      },
    ],
    boton: { texto: 'Ir a Mis mascotas', ruta: '/identificacion' },
  },
];

/** Si un mes (1 a 12) cae dentro de un rango, contando los que cruzan el fin de año. */
function estaEnTemporada([desde, hasta]: [number, number], mes: number): boolean {
  return desde <= hasta ? mes >= desde && mes <= hasta : mes >= desde || mes <= hasta;
}

/** Los consejos que corresponden a un mes (1 a 12), en el orden en que están cargados. */
export function consejosDelMes(mes: number, consejos: Consejo[] = CONSEJOS): Consejo[] {
  return consejos.filter((consejo) => estaEnTemporada(consejo.meses, mes));
}
