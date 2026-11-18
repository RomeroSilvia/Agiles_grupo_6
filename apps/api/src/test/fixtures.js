export const USUARIO = { id: 'b7d8e1c2-0000-4000-8000-000000000001', email: 'ana@mail.com' };

export const FILA_NETFLIX = {
  id: 1,
  tmdb_provider_id: 8,
  nombre: 'Netflix',
  logo_path: null,
  url_home: 'https://www.netflix.com',
};

export const NETFLIX = {
  id: 1,
  tmdbProviderId: 8,
  nombre: 'Netflix',
  logoPath: null,
  urlHome: 'https://www.netflix.com',
};

export const FILA_METRICAS = {
  totales: {
    usuarios: 1284,
    usuariosNuevos: 38,
    titulosWatchlist: 6912,
    titulosWatchlistNuevos: 412,
    regionesActivas: 9,
    plataformasElegidas: 8,
  },
  watchlist: {
    generos: [
      { genero: 'drama', cantidad: 1840 },
      { genero: 'comedia', cantidad: 1215 },
    ],
    tipos: [
      { tipo: 'pelicula', cantidad: 4010 },
      { tipo: 'serie', cantidad: 2902 },
    ],
    regiones: [{ region: 'AR', cantidad: 612 }],
  },
  busquedas: {
    textos: [
      { texto: 'friends', cantidad: 87 },
      { texto: 'ana@mail.com', cantidad: 1 },
    ],
    generos: [{ genero: 'terror', cantidad: 20 }],
    tipos: [{ tipo: 'serie', cantidad: 50 }],
    regiones: [{ region: 'MX', cantidad: 30 }],
  },
  plataformas: [{ plataformaId: 1, cantidad: 903 }],
};
