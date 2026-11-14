// Sucursales contrastadas con el directorio y las direcciones del sitio oficial.
// No usar `city` del BFF como municipio: Córdoba figura como «Interior».
const CABA_ID = 'ar:a2c2aae3-5cc8-4f9e-8e9d-389cf7def8ff';
const CORDOBA_ID = 'ar:d036bc1a-707f-49c5-b6b3-8f0430fd25af';

export const EVIDENCIA_CINEMARK = Object.freeze({
  evidencia:
    'Directorio oficial, direcciones y lecturas anónimas de películas y funciones verificadas el 14/11/2026; ver docs/evidencia/cinemark-2026-11-14.json.',
  registroId: null,
  url: 'https://www.cinemark.com.ar/cines',
  consultadoEn: '2026-11-14T18:49:31.000Z',
  actualizadoEn: null,
});

export const CINES_CINEMARK = Object.freeze(
  [
    [103, 'abasto', 'Abasto', 'Aguero 665, Abasto Shopping', CABA_ID],
    [734, 'caballito', 'Caballito', 'Av. La Plata 96, Caballito', CABA_ID],
    [111, 'dot', 'DOT', 'Vedia 3626, Shopping DOT', CABA_ID],
    [733, 'palermo', 'Palermo', 'Beruti 3399, Palermo CABA', CABA_ID],
    [
      2016,
      'parquebrown',
      'Parque Brown',
      'Av. Gral. Francisco Fernández, de la Cruz 4602',
      CABA_ID,
    ],
    [
      730,
      'puertomadero',
      'Puerto Madero',
      'Av Alicia Moreau de Justo 1920, Puerto Madero',
      CABA_ID,
    ],
    [105, 'nuevocentro', 'Nuevo Centro', 'Duarte Quiros 1400, Nuevo Centro Shopping', CORDOBA_ID],
    [106, 'patioolmos', 'Patio Olmos', 'Av. Vélez Sarfield 361, Patio Olmos', CORDOBA_ID],
  ].map(([id, slug, nombre, direccion, ciudadId]) =>
    Object.freeze({ id, slug, nombre, direccion, ciudadId }),
  ),
);
