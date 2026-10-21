-- Un aviso que agotó sus reintentos queda como fallido y, por el índice único de avisos sin
-- enviar, impedía generar uno nuevo para el mismo usuario, título y plataforma. Ahora, cuando
-- el título vuelve a estar disponible, los avisos fallidos de la llegada anterior se borran
-- antes de generar los nuevos. Si el título sigue disponible no se vuelve a avisar.

create or replace function public.registrar_verificacion_disponibilidad(
  p_titulo_id bigint,
  p_region char(2),
  p_region_predeterminada char(2)
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_disponible_antes boolean;
  v_disponible boolean;
  v_avisos integer := 0;
begin
  -- Bloquea la verificación anterior para que dos ejecuciones simultáneas
  -- no generen el mismo aviso.
  select disponible
  into v_disponible_antes
  from public.verificacion_disponibilidad
  where titulo_id = p_titulo_id
    and region = p_region
  for update;

  v_disponible := exists (
    select 1
    from public.disponibilidad
    where titulo_id = p_titulo_id
      and region = p_region
      and vigente
  );

  -- v_disponible_antes es null en la primera consulta: no se avisa.
  if v_disponible_antes = false and v_disponible then
    -- Los avisos que fallaron son de la llegada anterior: se reemplazan por los de esta.
    delete from public.notificacion
    where titulo_id = p_titulo_id
      and region = p_region
      and estado = 'fallida';

    insert into public.notificacion (usuario_id, titulo_id, plataforma_id, region)
    select distinct w.usuario_id, w.titulo_id, d.plataforma_id, d.region
    from public.watchlist_item as w
    join public.perfil as p on p.id = w.usuario_id
    join public.disponibilidad as d on d.titulo_id = w.titulo_id
    where w.titulo_id = p_titulo_id
      and w.aviso_activo
      and coalesce(p.region, p_region_predeterminada) = p_region
      and d.region = p_region
      and d.vigente
    on conflict do nothing;

    get diagnostics v_avisos = row_count;
  end if;

  insert into public.verificacion_disponibilidad (titulo_id, region, disponible, verificada_en)
  values (p_titulo_id, p_region, v_disponible, now())
  on conflict (titulo_id, region) do update
    set disponible = excluded.disponible,
        verificada_en = excluded.verificada_en;

  return v_avisos;
end;
$$;
