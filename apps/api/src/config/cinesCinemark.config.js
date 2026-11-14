// IDs permanentes; conservarlos al actualizar nombres o proveedores.
export const CIUDADES_CINEMARK = Object.freeze(
  [
    [
      'ar:a2c2aae3-5cc8-4f9e-8e9d-389cf7def8ff',
      'CABA',
      'Ciudad Autónoma de Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    ['ar:d036bc1a-707f-49c5-b6b3-8f0430fd25af', 'Córdoba', 'Córdoba', 'America/Argentina/Cordoba'],
    [
      'ar:840ca518-695a-414d-b7cc-c45cfd6e8830',
      'Avellaneda',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:4407d129-6c81-4916-8531-0cbb9626beb1',
      'Boulogne',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:71d66a60-1698-4f94-9364-917e068369ef',
      'Malvinas Argentinas',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:b1a69db5-a380-45f0-8aa2-72518d9e36f8',
      'Martínez',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:0114f825-fcbb-4a16-ba75-d27def7e9829',
      'Moreno',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:d777f222-6904-4129-a86f-8109174a6f40',
      'Morón',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:2a0142ee-911c-4cbe-84d4-652792351282',
      'San Justo',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:2b0ef7bf-256f-4bc9-be22-4d617ba50399',
      'Quilmes',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:638d7a69-331e-4f27-9557-03f3243fb9b9',
      'Temperley',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    [
      'ar:8042cc3e-dce6-4f39-bfb9-d9e285b2366d',
      'Tortuguitas',
      'Buenos Aires',
      'America/Argentina/Buenos_Aires',
    ],
    ['ar:c834819b-0a79-4d5a-8bd8-a05aab7bf2bf', 'Rosario', 'Santa Fe', 'America/Argentina/Cordoba'],
    [
      'ar:8897ba9c-f9b1-4586-be34-49c3d2c71d11',
      'Santa Fe',
      'Santa Fe',
      'America/Argentina/Cordoba',
    ],
    [
      'ar:e6feffe3-2010-42b0-b1d0-7b2063be2d59',
      'Godoy Cruz',
      'Mendoza',
      'America/Argentina/Mendoza',
    ],
    ['ar:2fd65303-0fdb-4247-bebf-4a6e9fc95e8c', 'Neuquén', 'Neuquén', 'America/Argentina/Salta'],
    ['ar:03d58872-3d91-4f57-84a7-ad1080866d6d', 'Salta', 'Salta', 'America/Argentina/Salta'],
  ].map(([id, nombre, provincia, zonaHoraria]) =>
    Object.freeze({ id, nombre, provincia, zonaHoraria }),
  ),
);

export const EVIDENCIA_CINEMARK = Object.freeze({
  evidencia:
    'Directorio oficial, direcciones, mapas y lecturas anónimas de películas y funciones; ver docs/evidencia/cinemark-ciudades-2026-11-14.json y la verificación inicial en docs/evidencia/cinemark-2026-11-14.json.',
  registroId: null,
  url: 'https://www.cinemark.com.ar/cines',
  consultadoEn: '2026-11-14T19:04:02.751Z',
  actualizadoEn: null,
});

// Municipios revisados por dirección y mapa; city del BFF mezcla ciudades y regiones.
export const CINES_CINEMARK = Object.freeze(
  [
    [103, 'abasto', 'Abasto', 'Aguero 665, Abasto Shopping', 'CABA'],
    [
      2015,
      'altoavellaneda',
      'Alto Avellaneda',
      'Av. Guemes 897, Shopping Alto Avellaneda',
      'Avellaneda',
    ],
    [734, 'caballito', 'Caballito', 'Av. La Plata 96, Caballito', 'CABA'],
    [111, 'dot', 'DOT', 'Vedia 3626, Shopping DOT', 'CABA'],
    [
      749,
      'malvinasargentinas',
      'Malvinas Argentinas',
      'Av. Pte. Illia 3770, Shopping Terrazas de Mayo',
      'Malvinas Argentinas',
    ],
    [732, 'mendoza', 'Mendoza', 'Av San Martin Sur 2875, Shopping Palmares', 'Godoy Cruz'],
    [110, 'moreno', 'Moreno', 'Av. Victoria 1128, Nine Shopping', 'Moreno'],
    [101, 'moron', 'Moron', 'Juan Manuel de Rosas 658, Plaza Oeste Shopping', 'Morón'],
    [2014, 'neuquen', 'Neuquen', 'Av. Dr. Ramon 355, Alto Comahue Shopping', 'Neuquén'],
    [105, 'nuevocentro', 'Nuevo Centro', 'Duarte Quiros 1400, Nuevo Centro Shopping', 'Córdoba'],
    [733, 'palermo', 'Palermo', 'Beruti 3399, Palermo CABA', 'CABA'],
    [2016, 'parquebrown', 'Parque Brown', 'Av. Gral. Francisco Fernández, de la Cruz 4602', 'CABA'],
    [106, 'patioolmos', 'Patio Olmos', 'Av. Vélez Sarfield 361, Patio Olmos', 'Córdoba'],
    [730, 'puertomadero', 'Puerto Madero', 'Av Alicia Moreau de Justo 1920, Puerto Madero', 'CABA'],
    [102, 'quilmes', 'Quilmes', 'Av. Calchaqui 3950, Quilmes', 'Quilmes'],
    [113, 'rosario', 'Rosario', 'Nansen 255, Portal Rosario', 'Rosario'],
    [107, 'saltaaltonoa', 'Salta Alto NOA', 'Av del Bicentenario 702, Alto NOA Shopping', 'Salta'],
    [
      2013,
      'saltahiperlibertad',
      'Salta Hiper Libertad',
      'Av. Monseñor Tavella 4400, Paseo Libertad',
      'Salta',
    ],
    [748, 'sanjusto', 'San Justo', 'Juan Manuel de Rosas 3990, San Justo Shopping', 'San Justo'],
    [745, 'santafe', 'Santa Fe', 'Dique 1 Puerto de Santa Fe, Ribera Shopping', 'Santa Fe'],
    [739, 'soleil', 'Soleil', 'Bernardo de Yrigoyen 2647, Soleil Premium Outlet', 'Boulogne'],
    [109, 'temperley', 'Temperley', 'Av. Hipólito Yrigoyen 10669, Temperley', 'Temperley'],
    [756, 'tortugas', 'Tortugas', 'Ramal Pilar km 36,5, Tortuguitas TOM', 'Tortuguitas'],
    [104, 'unicenter', 'Unicenter', 'Paraná 3745, Shopping Unicenter', 'Martínez'],
  ].map(([id, slug, nombre, direccion, ciudadNombre]) =>
    Object.freeze({
      id,
      slug,
      nombre,
      direccion,
      ciudadId: CIUDADES_CINEMARK.find((ciudad) => ciudad.nombre === ciudadNombre).id,
    }),
  ),
);
