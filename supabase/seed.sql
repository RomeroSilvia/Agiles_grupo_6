-- Datos iniciales. Idempotente: se puede correr más de una vez.
-- El workflow Migraciones lo aplica en la base compartida con --include-seed.

insert into public.fuente_datos (nombre, url, texto_atribucion) values
  ('TMDB', 'https://www.themoviedb.org',
   'Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.'),
  ('JustWatch', 'https://www.justwatch.com',
   'Datos de disponibilidad provistos por JustWatch.'),
  ('Streaming Availability', 'https://www.movieofthenight.com/about/api',
   'Enlaces provistos por Streaming Availability API (Movie of the Night).')
on conflict (nombre) do nothing;

-- tmdb_provider_id: verificar contra GET /watch/providers/movie?watch_region=AR
-- url_busqueda queda en null hasta completar el relevamiento de deep links por plataforma.
insert into public.plataforma (tmdb_provider_id, nombre, url_home) values
  (8,    'Netflix',            'https://www.netflix.com'),
  (119,  'Amazon Prime Video', 'https://www.primevideo.com'),
  (337,  'Disney Plus',        'https://www.disneyplus.com'),
  (1899, 'HBO Max',            'https://www.hbomax.com'),
  (350,  'Apple TV+',          'https://tv.apple.com'),
  (531,  'Paramount Plus',     'https://www.paramountplus.com'),
  (283,  'Crunchyroll',        'https://www.crunchyroll.com'),
  (11,   'MUBI',               'https://mubi.com')
on conflict (tmdb_provider_id) do nothing;
