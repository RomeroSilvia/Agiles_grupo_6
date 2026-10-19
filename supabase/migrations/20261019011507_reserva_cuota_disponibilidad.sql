-- Reserva cada consulta antes de llamar al proveedor para que ejecuciones
-- concurrentes compartan el mismo cupo diario y los fallos del proceso queden contabilizados.
create function public.reservar_cupo_disponibilidad(
  p_sincronizacion_id bigint,
  p_inicio timestamptz,
  p_fin timestamptz,
  p_limite integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservadas bigint;
begin
  if p_limite < 0 or p_fin <= p_inicio then
    raise exception 'Parámetros inválidos para reservar el cupo de disponibilidad';
  end if;

  perform pg_advisory_xact_lock(
    98173,
    floor(extract(epoch from p_inicio) / 86400)::integer
  );

  select coalesce(sum(titulos_procesados), 0)
  into v_reservadas
  from public.sincronizacion
  where iniciada_en >= p_inicio
    and iniciada_en < p_fin;

  if v_reservadas >= p_limite then
    return false;
  end if;

  update public.sincronizacion
  set titulos_procesados = titulos_procesados + 1
  where id = p_sincronizacion_id
    and iniciada_en >= p_inicio
    and iniciada_en < p_fin;

  return found;
end;
$$;

revoke execute on function public.reservar_cupo_disponibilidad(bigint, timestamptz, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.reservar_cupo_disponibilidad(bigint, timestamptz, timestamptz, integer)
  to service_role;
