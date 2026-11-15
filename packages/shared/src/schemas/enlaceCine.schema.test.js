import { describe, expect, it } from 'vitest';
import {
  crearPoliticaEnlacesCine,
  enlaceCineSchema,
  validarEnlaceCine,
} from './enlaceCine.schema.js';
import { CINES_FIXTURE, FUNCIONES_FIXTURE } from '../testing/funcionCine.fixture.js';

const cine = {
  ...CINES_FIXTURE[0],
  fuentes: [{ ...CINES_FIXTURE[0].fuentes[0], fuenteId: 'butaca' }],
};
const funcion = { ...FUNCIONES_FIXTURE[0], fuentes: cine.fuentes };
const sitio = 'https://www.cinemark.com.ar/';
const regla = {
  tipo: 'compra',
  fuenteId: 'butaca',
  cineId: cine.id,
  funcionId: funcion.id,
  tmdbId: 77,
  url: 'https://entradas.example.org/sesion?id=123',
  permitirHttp: false,
  evidencia: 'Fixture de un destino explícito, sin capacidad productiva',
};
describe('política compartida de enlaces de cine', () => {
  it('solo habilita el sitio oficial como información general para la cadena asociada', () => {
    expect(validarEnlaceCine(sitio, { cine, funcion, tipo: 'sitio' })).toBe(sitio);
    expect(validarEnlaceCine(sitio, { cine, funcion, tipo: 'compra' })).toBeNull();
    expect(validarEnlaceCine(sitio, { cine: CINES_FIXTURE[0], funcion, tipo: 'sitio' })).toBeNull();
  });
  it('un destino de compra revisado requiere la función, película, cine y fuente exactos', () => {
    const politica = crearPoliticaEnlacesCine([regla]);
    expect(politica.validar(regla.url, { cine, funcion, tipo: 'compra' })).toBe(regla.url);
    for (const cambios of [
      { id: FUNCIONES_FIXTURE[1].id },
      { tmdbId: 78 },
      { cineId: CINES_FIXTURE[1].id },
      { fuentes: [] },
    ])
      expect(
        politica.validar(regla.url, { cine, funcion: { ...funcion, ...cambios }, tipo: 'compra' }),
      ).toBeNull();
    expect(validarEnlaceCine(regla.url, { cine, funcion, tipo: 'compra' })).toBeNull();
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,peligro',
    'file:///tmp/archivo',
    '/cartelera',
    '//www.cinemark.com.ar/',
    'http://www.cinemark.com.ar/',
    'https://usuario:clave@www.cinemark.com.ar/',
    'https://localhost/',
    'https://127.0.0.1/',
    'https://10.0.0.1/',
    'https://192.168.1.1/',
    'https://169.254.169.254/',
    'https://2130706433/',
    'https://[::1]/',
    'https://[fd00::1]/',
    'https://www.cinemark.com.ar.ejemplo.com/',
    'https://cinemark.com.ar/',
    'https://www.google.com/search?q=entradas',
    'https://www.cinemark.com.ar:444/',
    'https://www.cinemark.com.ar/redirect',
    'https://www.cinemark.com.ar/?url=https://evil.example/',
    'https://www.cinemark.com.ar/?next=%2F%2Fevil.example',
    'https://www.cinemark.com.ar/?api_key=clave',
    'https://www.cinemark.com.ar/?access_token=clave',
    'https://www.cinemark.com.ar/\n',
    'https://www.cinemark.com.ar/%0a',
    'https://www.cinemark.com.ar/#redirect',
  ])('rechaza destino inseguro o no revisado: %s', (url) => {
    expect(enlaceCineSchema.safeParse(url).success).toBe(false);
    expect(validarEnlaceCine(url, { cine, funcion, tipo: 'sitio' })).toBeNull();
  });
  it('normaliza hosts internacionales y permite HTTP solo en el destino configurado expresamente', () => {
    const internacional = { ...regla, url: 'https://ciné.example.org/sesion?id=123' };
    const politica = crearPoliticaEnlacesCine([
      internacional,
      { ...regla, url: 'http://entradas.example.org/sesion?id=123', permitirHttp: true },
    ]);
    expect(
      politica.validar(new URL(internacional.url).href, { cine, funcion, tipo: 'compra' }),
    ).toBe(new URL(internacional.url).href);
    expect(
      politica.validar('http://entradas.example.org/sesion?id=123', {
        cine,
        funcion,
        tipo: 'compra',
      }),
    ).not.toBeNull();
    expect(
      politica.validar('http://ciné.example.org/sesion?id=123', { cine, funcion, tipo: 'compra' }),
    ).toBeNull();
  });
  it('rechaza redirects y secretos aunque una configuración los incluya por error', () => {
    for (const url of [
      'https://entradas.example.org/redirect?id=123',
      'https://entradas.example.org/sesion?return_url=https%3A%2F%2Fevil.example',
      'https://entradas.example.org/sesion?api_key=clave',
    ]) {
      expect(
        crearPoliticaEnlacesCine([{ ...regla, url }]).validar(url, {
          cine,
          funcion,
          tipo: 'compra',
        }),
      ).toBeNull();
    }
  });
});
