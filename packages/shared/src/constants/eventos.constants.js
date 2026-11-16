import { ZONA_HORARIA_AR } from './cartelera.constants.js';

export const CATEGORIAS_EVENTOS = Object.freeze([
  { id: 'todas', nombre: 'Todas las categorías' },
  { id: 'musica', nombre: 'Música' },
  { id: 'teatro', nombre: 'Teatro' },
  { id: 'arte', nombre: 'Arte' },
  { id: 'festivales', nombre: 'Festivales' },
  { id: 'talleres', nombre: 'Talleres' },
  { id: 'humor', nombre: 'Humor' },
  { id: 'infancias', nombre: 'Para las infancias' },
  { id: 'deportes', nombre: 'Deportes' },
  { id: 'gastronomia', nombre: 'Gastronomía' },
]);

export const PERIODOS_EVENTOS = Object.freeze([
  { id: 'todas', nombre: 'Próximos eventos' },
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'manana', nombre: 'Mañana' },
  { id: 'fin_de_semana', nombre: 'Este fin de semana' },
]);

export const ZONA_HORARIA_EVENTOS = ZONA_HORARIA_AR;
export const CIUDAD_EVENTOS = Object.freeze({ CIUDAD: 'La Plata', PROVINCIA: 'Buenos Aires' });
export const URL_FUENTE_EVENTOS = 'https://allevents.in/la-plata';
export const PAGINA_MAXIMA_EVENTOS = 5;
