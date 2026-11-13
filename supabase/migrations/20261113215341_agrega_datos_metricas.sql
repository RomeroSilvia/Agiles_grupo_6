-- Datos para el panel de métricas de administración.

-- Géneros del título, con los ids de TMDB.
-- Nullable: los títulos guardados antes de esta migración no tienen el dato.
alter table public.titulo
  add column generos_tmdb integer[];

-- Búsquedas realizadas, para las métricas del panel.
-- El texto se guarda normalizado para que el ranking agrupe las variantes de una misma búsqueda.
create table public.registro_busqueda (
  id bigint generated always as identity primary key,
  texto varchar(100) check (texto = lower(btrim(texto)) and texto <> ''), -- null: solo filtros
  tipo public.tipo_titulo,                                -- null: sin filtro de tipo
  genero varchar(30) check (genero ~ '^[a-z]+(-[a-z]+)*$'), -- id de GENEROS_BUSQUEDA; null: sin filtro
  region char(2) check (region ~ '^[A-Z]{2}$'),           -- null: no se pudo detectar
  creada_en timestamptz not null default now()
);

create index registro_busqueda_creada_en_idx
  on public.registro_busqueda (creada_en);

alter table public.registro_busqueda enable row level security;

-- Totales y rankings del panel en una sola consulta
--   p_desde:   inicio del período; null toma todo el historial.
--   p_generos: mapeo de los géneros de la app a sus ids de TMDB, armado por la API
--              desde GENEROS_BUSQUEDA, por ejemplo {"accion-aventura": [28, 12, 10759]}.
--              Así cada título suma una sola vez por género de la app aunque tenga
--              varios ids de TMDB del mismo grupo.
-- Los rankings van de mayor a menor y, si empatan, por clave. Un ranking sin datos es [].
create function public.obtener_metricas_admin(p_desde timestamptz, p_generos jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with
  items_periodo as (
    select wi.usuario_id, wi.titulo_id
    from public.watchlist_item as wi
    where p_desde is null or wi.agregado_en >= p_desde
  ),
  busquedas_periodo as (
    select rb.texto, rb.tipo, rb.genero, rb.region
    from public.registro_busqueda as rb
    where p_desde is null or rb.creada_en >= p_desde
  ),
  generos_app as (
    select
      g.key as genero,
      array(select jsonb_array_elements_text(g.value)::integer) as tmdb_ids
    from jsonb_each(coalesce(p_generos, '{}'::jsonb)) as g
  )
  select jsonb_build_object(
    'totales', jsonb_build_object(
      'usuarios', (select count(*) from public.perfil),
      'usuariosNuevos', (
        select count(*) from public.perfil as p
        where p_desde is null or p.creado_en >= p_desde
      ),
      'titulosWatchlist', (select count(*) from public.watchlist_item),
      'titulosWatchlistNuevos', (select count(*) from items_periodo),
      'regionesActivas', (select count(distinct p.region) from public.perfil as p),
      'plataformasElegidas', (
        select count(distinct up.plataforma_id) from public.usuario_plataforma as up
      )
    ),
    'watchlist', jsonb_build_object(
      'generos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('genero', r.genero, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.genero
          ),
          '[]'::jsonb
        )
        from (
          select ga.genero, count(*) as cantidad
          from items_periodo as i
          join public.titulo as t on t.id = i.titulo_id
          join generos_app as ga on t.generos_tmdb && ga.tmdb_ids
          group by ga.genero
        ) as r
      ),
      'tipos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('tipo', r.tipo, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.tipo
          ),
          '[]'::jsonb
        )
        from (
          select t.tipo, count(*) as cantidad
          from items_periodo as i
          join public.titulo as t on t.id = i.titulo_id
          group by t.tipo
        ) as r
      ),
      -- Usuarios distintos que agregaron algo en el período, por región del perfil
      'regiones', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('region', r.region, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.region
          ),
          '[]'::jsonb
        )
        from (
          select p.region, count(distinct i.usuario_id) as cantidad
          from items_periodo as i
          join public.perfil as p on p.id = i.usuario_id
          where p.region is not null
          group by p.region
        ) as r
      )
    ),
    'busquedas', jsonb_build_object(
      'textos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('texto', r.texto, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.texto
          ),
          '[]'::jsonb
        )
        from (
          select b.texto, count(*) as cantidad
          from busquedas_periodo as b
          where b.texto is not null
          group by b.texto
          order by cantidad desc, b.texto
          limit 10
        ) as r
      ),
      'generos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('genero', r.genero, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.genero
          ),
          '[]'::jsonb
        )
        from (
          select b.genero, count(*) as cantidad
          from busquedas_periodo as b
          where b.genero is not null
          group by b.genero
        ) as r
      ),
      'tipos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('tipo', r.tipo, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.tipo
          ),
          '[]'::jsonb
        )
        from (
          select b.tipo, count(*) as cantidad
          from busquedas_periodo as b
          where b.tipo is not null
          group by b.tipo
        ) as r
      ),
      'regiones', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('region', r.region, 'cantidad', r.cantidad)
            order by r.cantidad desc, r.region
          ),
          '[]'::jsonb
        )
        from (
          select b.region, count(*) as cantidad
          from busquedas_periodo as b
          where b.region is not null
          group by b.region
        ) as r
      )
    ),
    'plataformas', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('plataformaId', r.plataforma_id, 'cantidad', r.cantidad)
          order by r.cantidad desc, r.plataforma_id
        ),
        '[]'::jsonb
      )
      from (
        select up.plataforma_id, count(*) as cantidad
        from public.usuario_plataforma as up
        where p_desde is null or up.agregada_en >= p_desde
        group by up.plataforma_id
      ) as r
    )
  );
$$;

revoke execute on function public.obtener_metricas_admin(timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.obtener_metricas_admin(timestamptz, jsonb)
  to service_role;
