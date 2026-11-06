import { ROL_PERSONA } from '@buscador/shared/constants';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';

function etiquetaPersona(filtros, rol, prefijo) {
  return `${prefijo}: ${filtros[`${rol}Nombre`] || `Persona ${filtros[rol]}`}`;
}

export function listarFiltrosActivos(filtros, generos = []) {
  const activos = [];

  if (filtros.tipo) {
    activos.push({ clave: 'tipo', etiqueta: ETIQUETAS_TIPO_TITULO[filtros.tipo] ?? filtros.tipo });
  }
  if (filtros.anio) {
    activos.push({ clave: 'anio', etiqueta: String(filtros.anio) });
  }
  if (filtros.genero) {
    const genero = generos.find(({ id }) => String(id) === String(filtros.genero));
    activos.push({ clave: 'genero', etiqueta: `Género: ${genero?.nombre ?? filtros.genero}` });
  }
  if (filtros.actor) {
    activos.push({
      clave: ROL_PERSONA.ACTOR,
      etiqueta: etiquetaPersona(filtros, ROL_PERSONA.ACTOR, 'Actor'),
      esPersona: true,
    });
  }
  if (filtros.director) {
    activos.push({
      clave: ROL_PERSONA.DIRECTOR,
      etiqueta: etiquetaPersona(filtros, ROL_PERSONA.DIRECTOR, 'Director'),
      esPersona: true,
    });
  }

  return activos;
}
