import { describe, expect, it } from 'vitest';
import { crearPoliticaEnlacesCine } from '@buscador/shared/schemas';
import { CINES_FIXTURE, FUNCIONES_FIXTURE } from '@buscador/shared/testing';
import { obtenerDestinoCine } from './destinoCine.js';

const cine = {
  ...CINES_FIXTURE[0],
  urlSitio: 'https://www.cinemark.com.ar/',
  fuentes: [{ ...CINES_FIXTURE[0].fuentes[0], fuenteId: 'butaca' }],
};
const funcion = { ...FUNCIONES_FIXTURE[0], fuentes: cine.fuentes };
describe('destino de una función de cine', () => {
  it('prioriza compra explícita revisada en un fixture de contrato', () => {
    const urlCompra = 'https://entradas.example.org/sesion?id=1';
    const politica = crearPoliticaEnlacesCine([
      {
        tipo: 'compra',
        fuenteId: 'butaca',
        cineId: cine.id,
        funcionId: funcion.id,
        tmdbId: 77,
        url: urlCompra,
        permitirHttp: false,
        evidencia: 'Fixture: esta capacidad no se habilita en producción',
      },
    ]);
    expect(
      obtenerDestinoCine({ cine, funcion: { ...funcion, urlCompra } }, politica.validar),
    ).toMatchObject({ tipo: 'compra', url: urlCompra });
  });
  it('ofrece solo el sitio general cuando falta compra o el enlace es inválido', () => {
    for (const urlCompra of [
      null,
      'https://www.google.com/search?q=pelicula',
      'javascript:alert(1)',
      'https://www.cinemark.com.ar/redirect?url=mal',
    ])
      expect(obtenerDestinoCine({ cine, funcion: { ...funcion, urlCompra } })).toMatchObject({
        tipo: 'sitio',
        url: cine.urlSitio,
        etiqueta: 'Ir al sitio de Cine Central',
      });
  });
  it('no crea una acción falsa sin destinos y no adjudica enlaces a otra sucursal', () => {
    expect(obtenerDestinoCine({ cine: { ...cine, urlSitio: null }, funcion })).toBeNull();
    expect(
      obtenerDestinoCine({ cine, funcion: { ...funcion, cineId: CINES_FIXTURE[1].id } }),
    ).toBeNull();
  });
});
