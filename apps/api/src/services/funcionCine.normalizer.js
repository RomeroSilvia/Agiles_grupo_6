import { createHash } from 'node:crypto';
import {
  lugaresCineConfiguracionSchema,
  correspondenciasPeliculasCineSchema,
} from '../models/funcionCine.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import {
  fechaCivilCarteleraSchema,
  funcionCineSchema,
  sumarDiasCivil,
  validarEnlaceCine,
} from '@buscador/shared/schemas';

export function normalizarTextoCine(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function crearIdCine(prefijo, campos) {
  return `${prefijo}:${createHash('sha256').update(JSON.stringify(campos)).digest('hex')}`;
}

export function obtenerFechaLocalCine(ahora, zonaHoraria) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function crearInicioLocalCine(fecha, hora, zonaHoraria) {
  if (
    !fechaCivilCarteleraSchema.safeParse(fecha).success ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  )
    return null;
  const offset =
    new Intl.DateTimeFormat('en', { timeZone: zonaHoraria, timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${fecha}T${hora}:00Z`))
      .find(({ type }) => type === 'timeZoneName')
      .value.replace('GMT', '') || '+00:00';
  return `${fecha}T${hora}:00${offset}`;
}

export function resolverHoraSerpApi(valor) {
  const hora = String(valor).trim().toLowerCase().replace(/\s+/g, '').replaceAll('.', '');
  const partes = /^(\d{1,2}):([0-5]\d)(am|pm)?$/.exec(hora);
  if (!partes) return null;
  let horas = Number(partes[1]);
  if (partes[3]) {
    if (horas < 1 || horas > 12) return null;
    horas = (horas % 12) + (partes[3] === 'pm' ? 12 : 0);
  }
  return horas <= 23 ? `${String(horas).padStart(2, '0')}:${partes[2]}` : null;
}

export function resolverFechaSerpApi({ day, date }, desde, hasta) {
  const dia = normalizarTextoCine(day);
  const fecha = normalizarTextoCine(date);
  const relativos = { today: 0, hoy: 0, tomorrow: 1, manana: 1 };
  const coincidencias = [];
  for (let indice = 0; indice <= 7; indice += 1) {
    const candidato = sumarDiasCivil(desde, indice);
    if (candidato > hasta) break;
    const instante = new Date(`${candidato}T12:00:00Z`);
    const formatos = ['es-AR', 'en-US'].flatMap((locale) => {
      const mes = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: 'short' }).format(
        instante,
      );
      const mesLargo = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: 'long' }).format(
        instante,
      );
      const numero = String(instante.getUTCDate());
      return [
        `${mes} ${numero}`,
        `${numero} ${mes}`,
        `${numero} de ${mesLargo}`,
        `${mesLargo} ${numero}`,
        `${numero} ${mesLargo}`,
        `${numero}/${instante.getUTCMonth() + 1}`,
      ].map(normalizarTextoCine);
    });
    const dias = ['es-AR', 'en-US'].flatMap((locale) =>
      ['long', 'short'].map((weekday) =>
        normalizarTextoCine(
          new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday }).format(instante),
        ),
      ),
    );
    const coincideDia =
      !dia || (Object.hasOwn(relativos, dia) ? relativos[dia] === indice : dias.includes(dia));
    const coincideFecha =
      !fecha || fecha === normalizarTextoCine(candidato) || formatos.includes(fecha);
    if ((dia || fecha) && coincideDia && coincideFecha) coincidencias.push(candidato);
  }
  return coincidencias.length === 1 ? coincidencias[0] : null;
}

export function corresponderPeliculaCine({
  fuenteId,
  registroId,
  nombre,
  tmdbId,
  correspondencias,
}) {
  if (!nombre) return false;
  const coincidencias = correspondencias.filter(
    (item) =>
      item.fuenteId === fuenteId &&
      item.evidencia?.trim() &&
      (registroId
        ? String(item.registroId) === String(registroId)
        : item.nombre && normalizarTextoCine(item.nombre) === normalizarTextoCine(nombre)) &&
      (!item.nombre || normalizarTextoCine(item.nombre) === normalizarTextoCine(nombre)),
  );
  return coincidencias.length === 1 && coincidencias[0].tmdbId === tmdbId;
}

function resolverLugar(observacion, ciudad, lugares) {
  const candidatos = lugares.filter(
    (lugar) =>
      lugar.ciudadId === ciudad.id &&
      lugar.evidencia?.trim() &&
      lugar.fuentes.some((fuente) => {
        if (fuente.fuenteId !== observacion.fuenteId) return false;
        if (observacion.cineRegistroId && fuente.registroId !== null)
          return String(fuente.registroId) === String(observacion.cineRegistroId);
        return (
          observacion.direccion &&
          fuente.direccion &&
          normalizarTextoCine(fuente.nombre) === normalizarTextoCine(observacion.cineNombre) &&
          normalizarTextoCine(fuente.direccion) === normalizarTextoCine(observacion.direccion)
        );
      }),
  );
  return candidatos.length === 1 ? candidatos[0] : null;
}

export function normalizarObservacionesCine({
  observaciones,
  ciudad,
  tmdbId,
  desde,
  hasta,
  fuente,
  lugares,
  correspondencias,
  estructuraPresente = true,
}) {
  lugares = validateExternalResponse(
    lugaresCineConfiguracionSchema,
    lugares,
    'la configuración de cines',
  );
  correspondencias = validateExternalResponse(
    correspondenciasPeliculasCineSchema,
    correspondencias,
    'las correspondencias de películas',
  );
  const cines = new Map();
  const funciones = [];
  const advertencias = [];
  const diagnostico = [];
  const advertir = (code, message, observacion) => {
    if (!advertencias.some((item) => item.code === code))
      advertencias.push({ code, message, fuenteId: fuente.fuenteId });
    diagnostico.push({
      code,
      registroId: observacion?.registroId ?? null,
      cineRegistroId: observacion?.cineRegistroId ?? null,
      peliculaRegistroId: observacion?.peliculaRegistroId ?? null,
      formatoOriginal: observacion?.formato ?? null,
      idiomaOriginal: observacion?.idioma ?? null,
    });
  };
  if (!estructuraPresente)
    advertir('INCOMPLETE_DATA', 'La fuente no informó una estructura de horarios verificable.');
  for (const observacion of observaciones) {
    if (
      !corresponderPeliculaCine({
        fuenteId: fuente.fuenteId,
        registroId: observacion.peliculaRegistroId,
        nombre: observacion.peliculaNombre,
        tmdbId,
        correspondencias,
      })
    ) {
      advertir(
        'IDENTITY_UNRESOLVED',
        'Se descartaron horarios cuya película no pudo vincularse de forma verificable con TMDB.',
        observacion,
      );
      continue;
    }
    const lugar = resolverLugar(observacion, ciudad, lugares);
    if (!lugar) {
      advertir(
        'IDENTITY_UNRESOLVED',
        'Se descartaron establecimientos sin correspondencia municipal y dirección verificadas.',
        observacion,
      );
      continue;
    }
    const cineId = crearIdCine('cine', [ciudad.id, lugar.clave]);
    const inicio = crearInicioLocalCine(
      observacion.fechaLocal,
      observacion.horaLocal,
      ciudad.zonaHoraria,
    );
    if (!inicio || observacion.fechaLocal < desde || observacion.fechaLocal > hasta) {
      advertir(
        'INCOMPLETE_DATA',
        'Se descartaron fechas ambiguas o fuera del horizonte informado.',
        observacion,
      );
      continue;
    }
    if (Date.parse(inicio) <= Date.now()) continue;
    const origen = { ...fuente, registroId: observacion.registroId ?? null };
    const texto = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);
    const funcion = {
      tmdbId,
      tipo: 'pelicula',
      ciudadId: ciudad.id,
      cineId,
      cineNombre: lugar.nombre,
      inicio,
      fechaLocal: observacion.fechaLocal,
      horaLocal: observacion.horaLocal,
      zonaHoraria: ciudad.zonaHoraria,
      sala: texto(observacion.sala),
      formato: texto(observacion.formato),
      idioma: texto(observacion.idioma),
      subtitulos: texto(observacion.subtitulos),
      urlCompra: null,
      fuentes: [origen],
    };
    funcion.id = crearIdCine('funcion', [
      cineId,
      tmdbId,
      inicio,
      ...['sala', 'formato', 'idioma', 'subtitulos'].map((campo) =>
        funcion[campo] === null ? null : normalizarTextoCine(funcion[campo]),
      ),
    ]);
    const validada = funcionCineSchema.safeParse(funcion);
    if (!validada.success) {
      advertir(
        'INCOMPLETE_DATA',
        'Se descartaron funciones con horarios incoherentes.',
        observacion,
      );
      continue;
    }
    const cine = {
      id: cineId,
      ciudadId: ciudad.id,
      nombre: lugar.nombre,
      direccion: lugar.direccion ?? null,
      zonaHoraria: ciudad.zonaHoraria,
      urlSitio: null,
      fuentes: [{ ...fuente, registroId: String(observacion.cineRegistroId ?? lugar.clave) }],
    };
    cine.urlSitio = validarEnlaceCine(lugar.urlSitio ?? null, {
      cine,
      funcion: validada.data,
      tipo: 'sitio',
    });
    validada.data.urlCompra = validarEnlaceCine(observacion.urlCompra ?? null, {
      cine,
      funcion: validada.data,
      tipo: 'compra',
    });
    for (const [campo, original, validadaUrl] of [
      ['urlSitio', lugar.urlSitio, cine.urlSitio],
      ['urlCompra', observacion.urlCompra, validada.data.urlCompra],
    ]) {
      if (original && !validadaUrl)
        diagnostico.push({
          code: 'INVALID_DESTINATION',
          campo,
          registroId: observacion.registroId ?? null,
        });
    }
    cines.set(cineId, cine);
    funciones.push(validada.data);
  }
  return {
    cines: [...cines.values()],
    funciones,
    estadoFuente: advertencias.length ? 'incompleta' : 'disponible',
    fuentes: [fuente],
    advertencias,
    diagnostico,
  };
}

function unirFuentes(...grupos) {
  return [...new Map(grupos.flat().map((fuente) => [JSON.stringify(fuente), fuente])).values()];
}

export function combinarFuncionesCine(respuestas) {
  const cines = new Map();
  const funciones = [];
  const advertencias = respuestas.flatMap((respuesta) => respuesta.advertencias);
  for (const respuesta of respuestas) {
    for (const cine of respuesta.cines) {
      const anterior = cines.get(cine.id);
      cines.set(cine.id, { ...cine, fuentes: unirFuentes(anterior?.fuentes ?? [], cine.fuentes) });
    }
  }
  const ordenadas = respuestas
    .flatMap((respuesta) => respuesta.funciones)
    .sort(
      (a, b) =>
        Number(b.fuentes.some((fuente) => fuente.fuenteId === 'butaca')) -
        Number(a.fuentes.some((fuente) => fuente.fuenteId === 'butaca')),
    );
  for (const candidata of ordenadas) {
    const exacta = funciones.find((funcion) => funcion.id === candidata.id);
    if (exacta) {
      exacta.fuentes = unirFuentes(exacta.fuentes, candidata.fuentes);
      continue;
    }
    const mismoEvento = funciones.filter(
      (funcion) => funcion.cineId === candidata.cineId && funcion.inicio === candidata.inicio,
    );
    const secundarios = mismoEvento.filter(
      (funcion) => funcion.fuentes[0].fuenteId !== candidata.fuentes[0].fuenteId,
    );
    const ambigua = secundarios.filter((funcion) =>
      ['sala', 'formato', 'idioma', 'subtitulos'].every(
        (campo) =>
          funcion[campo] === null ||
          candidata[campo] === null ||
          normalizarTextoCine(funcion[campo]) === normalizarTextoCine(candidata[campo]),
      ),
    );
    if (ambigua.length) {
      if (ambigua.length === 1)
        ambigua[0].fuentes = unirFuentes(ambigua[0].fuentes, candidata.fuentes);
      advertencias.push({
        code: 'INCOMPLETE_DATA',
        message: 'Se omitió una observación secundaria sin discriminadores suficientes.',
        fuenteId: candidata.fuentes[0].fuenteId,
      });
      continue;
    }
    const conflicto = secundarios.find(
      (funcion) =>
        funcion.sala &&
        candidata.sala &&
        normalizarTextoCine(funcion.sala) === normalizarTextoCine(candidata.sala),
    );
    if (conflicto) {
      conflicto.fuentes = unirFuentes(conflicto.fuentes, candidata.fuentes);
      advertencias.push({
        code: 'CONFLICTING_DATA',
        message:
          'Las fuentes discrepan; se conserva la observación vigente de Cinemark sin mezclar sus datos.',
        fuenteId: candidata.fuentes[0].fuenteId,
      });
      continue;
    }
    funciones.push({ ...candidata, fuentes: [...candidata.fuentes] });
  }
  return {
    cines: [...cines.values()],
    funciones: funciones.sort(
      (a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id),
    ),
    fuentes: unirFuentes(...respuestas.map((respuesta) => respuesta.fuentes)),
    advertencias: [...new Map(advertencias.map((item) => [JSON.stringify(item), item])).values()],
  };
}
