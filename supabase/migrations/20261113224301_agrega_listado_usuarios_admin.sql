-- Listado de usuarios del panel de administración, filtrado y paginado.
-- Junta auth.users (mail y confirmación) con los datos de la app.
-- Devuelve { total, usuarios }. total cuenta todos los que cumplen los filtros, aunque la
-- página pedida no tenga filas. Plataformas y watchlist se calculan solo para la página.
create function public.listar_usuarios_admin(
  p_email text,
  p_region char(2),
  p_estado text,
  p_limite integer,
  p_offset integer
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  usuarios as (
    select
      p.id,
      u.email,
      p.region,
      p.creado_en,
      case when u.email_confirmed_at is null then 'sin_confirmar' else 'activo' end as estado
    from public.perfil as p
    join auth.users as u on u.id = p.id
  ),
  filtrados as (
    select us.*
    from usuarios as us
    where (
        nullif(btrim(p_email), '') is null
        or us.email ilike (
          '%'
          || replace(replace(replace(btrim(p_email), '\', '\\'), '%', '\%'), '_', '\_')
          || '%'
        ) escape '\'
      )
      and (p_region is null or us.region = p_region)
      and (p_estado is null or us.estado = p_estado)
  ),
  pagina as (
    select f.*
    from filtrados as f
    order by f.creado_en desc, f.id
    limit least(p_limite, 100)
    offset p_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtrados),
    'usuarios', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pg.id,
            'email', pg.email,
            'region', pg.region,
            -- Subconsultas por usuario y no joins: dos joins se multiplican entre sí
            'plataforma_ids', array(
              select up.plataforma_id
              from public.usuario_plataforma as up
              where up.usuario_id = pg.id
              order by up.plataforma_id
            ),
            'titulos_watchlist', (
              select count(*)
              from public.watchlist_item as w
              where w.usuario_id = pg.id
            ),
            'creado_en', pg.creado_en,
            'estado', pg.estado
          )
          order by pg.creado_en desc, pg.id
        )
        from pagina as pg
      ),
      '[]'::jsonb
    )
  );
$$;

revoke execute on function public.listar_usuarios_admin(text, char, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.listar_usuarios_admin(text, char, text, integer, integer)
  to service_role;
