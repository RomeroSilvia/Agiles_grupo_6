import { describe, it, expect } from 'vitest';
import { FILTROS_INICIALES } from './busquedaReducer.js';
import { listarFiltrosActivos } from './filtrosActivos.js';

describe('listarFiltrosActivos', () => {
  it('arma una etiqueta por cada filtro elegido, con el nombre del género y de las personas', () => {
    const filtros = {
      ...FILTROS_INICIALES,
      q: 'Dune',
      tipo: 'serie',
      anio: '2021',
      genero: '18',
      actor: '6193',
      actorNombre: 'Leonardo DiCaprio',
      director: '525',
    };

    expect(listarFiltrosActivos(filtros, [{ id: 18, nombre: 'Drama' }])).toEqual([
      { clave: 'tipo', etiqueta: 'Series' },
      { clave: 'anio', etiqueta: '2021' },
      { clave: 'genero', etiqueta: 'Género: Drama' },
      { clave: 'actor', etiqueta: 'Actor: Leonardo DiCaprio', esPersona: true },
      { clave: 'director', etiqueta: 'Director: Persona 525', esPersona: true },
    ]);
  });

  it('no cuenta el título ni el filtro de plataformas propias', () => {
    const filtros = { ...FILTROS_INICIALES, q: 'Dune', soloPropias: true };

    expect(listarFiltrosActivos(filtros)).toEqual([]);
  });

  it('usa el id del género si todavía no se cargaron los nombres', () => {
    const filtros = { ...FILTROS_INICIALES, genero: '18' };

    expect(listarFiltrosActivos(filtros)).toEqual([{ clave: 'genero', etiqueta: 'Género: 18' }]);
  });
});
