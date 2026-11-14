import { useMemo, useState } from 'react';
import { filtrosFuncionesSchema } from '@buscador/shared/schemas';
import { filtrarFunciones, obtenerOpcionesFunciones } from './filtrosFunciones.js';

export function useFiltrosFunciones(data) {
  const [estado, setEstado] = useState({
    dataset: null,
    contexto: '',
    fecha: '',
    cineId: '',
    aviso: '',
    error: '',
  });
  const { fechas, cines } = useMemo(() => obtenerOpcionesFunciones(data), [data]);
  let vigente = estado;
  if (data && estado.dataset !== data) {
    const contexto = `${data.tmdbId}:${data.ciudad.id}`;
    const mismoContexto = contexto === estado.contexto;
    const fecha = mismoContexto && fechas.includes(estado.fecha) ? estado.fecha : '';
    const cineId =
      mismoContexto && cines.some((cine) => cine.id === estado.cineId) ? estado.cineId : '';
    const retirados = mismoContexto && ((estado.fecha && !fecha) || (estado.cineId && !cineId));
    vigente = {
      dataset: data,
      contexto,
      fecha,
      cineId,
      aviso: retirados ? 'Se limpiaron filtros que ya no están en los datos actualizados.' : '',
      error: '',
    };
    // Se ajusta solo ante otro dataset; React descarta este render antes de mostrar datos viejos.
    setEstado(vigente);
  }
  function cambiarFiltros(valores) {
    const resultado = filtrosFuncionesSchema.safeParse(valores);
    if (
      !resultado.success ||
      (valores.fecha && !fechas.includes(valores.fecha)) ||
      (valores.cineId && !cines.some((cine) => cine.id === valores.cineId))
    ) {
      setEstado((actual) => ({
        ...actual,
        error: 'Elegí una fecha y un cine de las opciones disponibles.',
      }));
      return;
    }
    setEstado((actual) => ({ ...actual, ...resultado.data, aviso: '', error: '' }));
  }
  function limpiar() {
    setEstado((actual) => ({ ...actual, fecha: '', cineId: '', aviso: '', error: '' }));
  }
  return {
    fechas,
    cines,
    fecha: vigente.fecha,
    cineId: vigente.cineId,
    aviso: vigente.aviso,
    error: vigente.error,
    funciones: filtrarFunciones(data?.funciones ?? [], vigente),
    cambiarFiltros,
    limpiar,
  };
}
