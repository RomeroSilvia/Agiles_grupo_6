-- Avisos de disponibilidad (F5HU2).
-- Se avisa cuando un título de la watchlist pasa de no estar disponible a estar
-- disponible en la región del usuario. Para saber si antes no estaba, se guarda el
-- resultado de cada consulta por título y región. La primera consulta solo registra
-- el estado inicial y no genera avisos: no se puede saber si el título acaba de
-- llegar a la plataforma o ya estaba desde antes.

create table public.verificacion_disponibilidad (
  titulo_id bigint not null references public.titulo (id) on delete cascade,
  region char(2) not null check (region ~ '^[A-Z]{2}$'),
  disponible boolean not null, -- si tenía al menos una oferta vigente
  verificada_en timestamptz not null default now(),
  primary key (titulo_id, region)
);

alter table public.verificacion_disponibilidad enable row level security;

-- Un título que sale de una plataforma y vuelve es un cambio nuevo y se avisa otra vez.
-- La restricción pasa a evitar solo los avisos duplicados que todavía no se enviaron.
alter table public.notificacion
  drop constraint notificacion_usuario_titulo_plataforma_region_key;

create unique index notificacion_sin_enviar_key
  on public.notificacion (usuario_id, titulo_id, plataforma_id, region)
  where estado <> 'enviada';

-- La sincronización la llama después de guardar las ofertas de un título y una región
-- consultados con éxito. Si el título pasó de no disponible a disponible, deja un aviso
-- pendiente por cada plataforma para los usuarios que lo tienen en la watchlist con el
-- aviso activo y cuya región es la consultada (los perfiles sin región usan la
-- predeterminada). Devuelve la cantidad de avisos generados.
create function public.registrar_verificacion_disponibilidad(
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

revoke execute on function public.registrar_verificacion_disponibilidad(bigint, char, char)
  from public, anon, authenticated;
grant execute on function public.registrar_verificacion_disponibilidad(bigint, char, char)
  to service_role;
