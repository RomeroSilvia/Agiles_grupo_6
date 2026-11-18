import { TIPO_TITULO } from '@buscador/shared/constants';
import { crearLimite } from './rateLimit.config.js';

// Ids de géneros de TMDB. Películas y series no comparten todos los ids.
const GENERO_PELICULA = Object.freeze({
  ANIMACION: 16,
  CIENCIA_FICCION: 878,
  COMEDIA: 35,
  CRIMEN: 80,
  DOCUMENTAL: 99,
  DRAMA: 18,
  FAMILIA: 10751,
  GUERRA: 10752,
  HISTORIA: 36,
  MISTERIO: 9648,
  ROMANCE: 10749,
  SUSPENSO: 53,
  TERROR: 27,
});

const GENERO_SERIE = Object.freeze({
  ANIMACION: 16,
  CIENCIA_FICCION_Y_FANTASIA: 10765,
  COMEDIA: 35,
  CRIMEN: 80,
  DOCUMENTAL: 99,
  DRAMA: 18,
  FAMILIA: 10751,
  GUERRA_Y_POLITICA: 10768,
  INFANTIL: 10762,
  MISTERIO: 9648,
  NOTICIAS: 10763,
  REALITY: 10764,
  TALK_SHOW: 10767,
});

// Programas que no son ficción y aparecen mucho en TMDB con géneros como comedia o drama.
const SERIES_SIN_FICCION = Object.freeze([
  GENERO_SERIE.NOTICIAS,
  GENERO_SERIE.REALITY,
  GENERO_SERIE.TALK_SHOW,
]);

// Los votos mínimos evitan que aparezcan títulos con una puntuación alta pero con muy pocos
// votos. Las series tienen menos votos en TMDB, por eso el mínimo es más bajo.
const VOTOS_MINIMOS = Object.freeze({
  [TIPO_TITULO.PELICULA]: 300,
  [TIPO_TITULO.SERIE]: 100,
});

function criterio({ puntuacionMinima, pelicula, serie }) {
  return Object.freeze({
    puntuacionMinima,
    [TIPO_TITULO.PELICULA]: Object.freeze({
      generosIncluidos: Object.freeze(pelicula.incluir),
      generosExcluidos: Object.freeze(pelicula.excluir),
      votosMinimos: VOTOS_MINIMOS[TIPO_TITULO.PELICULA],
    }),
    [TIPO_TITULO.SERIE]: Object.freeze({
      generosIncluidos: Object.freeze(serie.incluir),
      generosExcluidos: Object.freeze([...serie.excluir, ...SERIES_SIN_FICCION]),
      votosMinimos: VOTOS_MINIMOS[TIPO_TITULO.SERIE],
    }),
  });
}

// Criterios de cada estado de ánimo. Un título entra si tiene al menos uno de los géneros
// incluidos, ninguno de los excluidos y supera la puntuación y los votos mínimos.
export const CRITERIOS_ANIMO = Object.freeze({
  'para-reir': criterio({
    puntuacionMinima: 6.5,
    pelicula: {
      incluir: [GENERO_PELICULA.COMEDIA],
      excluir: [GENERO_PELICULA.TERROR, GENERO_PELICULA.SUSPENSO],
    },
    serie: { incluir: [GENERO_SERIE.COMEDIA], excluir: [] },
  }),
  'algo-liviano': criterio({
    puntuacionMinima: 6,
    pelicula: {
      incluir: [
        GENERO_PELICULA.COMEDIA,
        GENERO_PELICULA.ANIMACION,
        GENERO_PELICULA.FAMILIA,
        GENERO_PELICULA.ROMANCE,
      ],
      excluir: [
        GENERO_PELICULA.TERROR,
        GENERO_PELICULA.SUSPENSO,
        GENERO_PELICULA.GUERRA,
        GENERO_PELICULA.CRIMEN,
      ],
    },
    serie: {
      incluir: [GENERO_SERIE.COMEDIA, GENERO_SERIE.ANIMACION, GENERO_SERIE.FAMILIA],
      excluir: [GENERO_SERIE.CRIMEN, GENERO_SERIE.GUERRA_Y_POLITICA, GENERO_SERIE.MISTERIO],
    },
  }),
  'para-pensar': criterio({
    puntuacionMinima: 7.5,
    pelicula: {
      incluir: [
        GENERO_PELICULA.DRAMA,
        GENERO_PELICULA.DOCUMENTAL,
        GENERO_PELICULA.HISTORIA,
        GENERO_PELICULA.CIENCIA_FICCION,
      ],
      excluir: [GENERO_PELICULA.ANIMACION, GENERO_PELICULA.FAMILIA],
    },
    serie: {
      incluir: [GENERO_SERIE.DRAMA, GENERO_SERIE.DOCUMENTAL, GENERO_SERIE.GUERRA_Y_POLITICA],
      excluir: [GENERO_SERIE.ANIMACION, GENERO_SERIE.FAMILIA, GENERO_SERIE.INFANTIL],
    },
  }),
  'con-tension': criterio({
    puntuacionMinima: 6.5,
    pelicula: {
      incluir: [
        GENERO_PELICULA.SUSPENSO,
        GENERO_PELICULA.CRIMEN,
        GENERO_PELICULA.MISTERIO,
        GENERO_PELICULA.TERROR,
      ],
      excluir: [GENERO_PELICULA.ANIMACION, GENERO_PELICULA.FAMILIA, GENERO_PELICULA.COMEDIA],
    },
    serie: {
      incluir: [GENERO_SERIE.CRIMEN, GENERO_SERIE.MISTERIO],
      excluir: [
        GENERO_SERIE.ANIMACION,
        GENERO_SERIE.FAMILIA,
        GENERO_SERIE.COMEDIA,
        GENERO_SERIE.INFANTIL,
      ],
    },
  }),
  'para-emocionarme': criterio({
    puntuacionMinima: 7,
    pelicula: {
      incluir: [GENERO_PELICULA.DRAMA, GENERO_PELICULA.ROMANCE],
      excluir: [GENERO_PELICULA.TERROR, GENERO_PELICULA.SUSPENSO],
    },
    serie: {
      incluir: [GENERO_SERIE.DRAMA],
      excluir: [
        GENERO_SERIE.CRIMEN,
        GENERO_SERIE.MISTERIO,
        GENERO_SERIE.CIENCIA_FICCION_Y_FANTASIA,
      ],
    },
  }),
});

export const ANIMO_CONFIG = Object.freeze({
  RATE_LIMIT: crearLimite(30),
});
