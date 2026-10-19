-- Completa logo_path de las plataformas cargadas por el seed (que no lo tenía).
-- Rutas de GET /watch/providers/movie?watch_region=AR y /watch/providers/tv (iguales en ambos).
-- La web arma la URL con la base de imágenes de TMDB.
-- Solo pisa los logos vacíos: si alguien ya cargó uno, se respeta.

update public.plataforma as p
set logo_path = l.logo_path
from (values
  (8,    '/rK1KljqmbvO9HQa1PBFLILWah72.png'),
  (119,  '/gMZdpavHmxFNnLpMHwVxfqeux2g.png'),
  (337,  '/5eZ872CghnHFLB1j8grszbrx0dx.png'),
  (1899, '/skypuy7SXuugIQeYg0IglmzoKaS.png'),
  (350,  '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png'),
  (531,  '/pkx3klJlwW5JdtaulvDx6hDNtch.png'),
  (283,  '/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png'),
  (11,   '/k7iSlvgWzZuO4zU5PcBjhABMuia.png')
) as l (tmdb_provider_id, logo_path)
where p.tmdb_provider_id = l.tmdb_provider_id
  and p.logo_path is null;
