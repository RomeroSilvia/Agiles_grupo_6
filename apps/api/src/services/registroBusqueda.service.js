import * as registroBusquedaRepository from '../repositories/registroBusqueda.repository.js';

function normalizarTexto(texto) {
  const normalizado = texto?.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalizado || null;
}

export function registrarBusqueda({ q, tipo, genero, region }) {
  return registroBusquedaRepository.insertar({
    texto: normalizarTexto(q),
    tipo: tipo ?? null,
    genero: genero ?? null,
    region: region ?? null,
  });
}
