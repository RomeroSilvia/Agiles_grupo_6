-- =====================================================================
-- Esquema inicial - STREAMLY
-- TMDB es la fuente de verdad del catálogo. La base guarda solo lo necesario:
-- perfiles, sus plataformas, su watchlist, un cache de los títulos que les
-- interesan y el snapshot de disponibilidad que permite detectar cambios
-- y disparar los mails.
--
-- Decisiones:
--   * Las cuentas (mail y contraseña) las maneja Supabase Auth en auth.users.
--     perfil extiende auth.users y se crea solo con un trigger (mail o Google).
--   * ON DELETE CASCADE desde auth.users hacia todos los datos del usuario (E4HU7).
--   * Los enums coinciden con packages/shared/src/constants/index.js.
--   * RLS habilitado en todas las tablas y sin políticas: la API REST pública
--     de Supabase queda bloqueada y el backend accede con la clave secreta.
-- =====================================================================

-- ---------- Tipos ----------

create type public.tipo_titulo as enum ('pelicula', 'serie');

create type public.tipo_oferta as enum ('suscripcion', 'gratis', 'con_anuncios', 'alquiler', 'compra');

create type public.estado_notificacion as enum ('pendiente', 'enviada', 'fallida');

-- ---------- Catálogos ----------

-- Fuentes externas de datos, para la atribución (E6HU3)
create table public.fuente_datos (
  id smallint generated always as identity primary key,
  nombre varchar(50) not null unique,
  url varchar(255) not null,
  texto_atribucion varchar(255) not null,
  logo_url varchar(255)
);

-- Plataformas de streaming, según los watch providers de TMDB (E4HU4, E3HU2)
create table public.plataforma (
  id integer generated always as identity primary key,
  tmdb_provider_id integer not null unique,
  nombre varchar(100) not null,
  logo_path varchar(255),
  url_home varchar(255),     -- respaldo cuando no hay deep link (E3HU2)
  url_busqueda varchar(255), -- ej: 'https://www.netflix.com/search?q={query}'
  activa boolean not null default true
);

-- Cache de los títulos de TMDB que interesan a algún usuario (E1HU5).
-- En TMDB los ids de películas y series se pisan (el 1399 existe en ambos):
-- la clave natural es (tmdb_id, tipo), no tmdb_id solo.
create table public.titulo (
  id bigint generated always as identity primary key,
  tmdb_id integer not null,
  tipo public.tipo_titulo not null,
  nombre varchar(255) not null,
  anio smallint,
  sinopsis text,
  poster_path varchar(255),
  puntuacion numeric(3, 1) check (puntuacion between 0 and 10),
  actualizado_en timestamptz not null default now(),
  constraint titulo_tmdb_id_tipo_key unique (tmdb_id, tipo)
);

-- Snapshot de disponibilidad (E1HU2, E3HU1, F5HU1). Comparando lo que devuelve
-- la API contra lo guardado se detecta cuándo un título ENTRA a una plataforma.
create table public.disponibilidad (
  titulo_id bigint not null references public.titulo (id) on delete cascade,
  plataforma_id integer not null references public.plataforma (id),
  region char(2) not null check (region ~ '^[A-Z]{2}$'),
  tipo_oferta public.tipo_oferta not null,
  deep_link varchar(500), -- null: se usa plataforma.url_home
  fuente_id smallint not null references public.fuente_datos (id),
  detectada_en timestamptz not null default now(),  -- cuándo apareció (o reapareció)
  verificada_en timestamptz not null default now(), -- última sincronización que la confirmó
  vigente boolean not null default true,            -- false: salió de la plataforma
  primary key (titulo_id, plataforma_id, region, tipo_oferta)
);

create index disponibilidad_plataforma_region_idx
  on public.disponibilidad (plataforma_id, region)
  where vigente;

-- ---------- Datos de usuario ----------

-- Extiende auth.users con los datos propios de la aplicación (E2HU1)
create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  region char(2) check (region ~ '^[A-Z]{2}$'), -- null: todavía no se detectó
  creado_en timestamptz not null default now()
);

-- Plataformas propias de cada usuario (E4HU4)
create table public.usuario_plataforma (
  usuario_id uuid not null references public.perfil (id) on delete cascade,
  plataforma_id integer not null references public.plataforma (id),
  agregada_en timestamptz not null default now(),
  primary key (usuario_id, plataforma_id)
);

-- Watchlist, "ver más tarde" (E4HU5)
create table public.watchlist_item (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfil (id) on delete cascade,
  titulo_id bigint not null references public.titulo (id),
  aviso_activo boolean not null default true, -- si se avisa por mail cuando esté disponible (F5HU2)
  agregado_en timestamptz not null default now(),
  constraint watchlist_item_usuario_titulo_key unique (usuario_id, titulo_id)
);

-- La sincronización diaria busca qué títulos tienen avisos activos
create index watchlist_item_aviso_activo_idx
  on public.watchlist_item (titulo_id)
  where aviso_activo;

-- Avisos por mail (patrón outbox): la sincronización los inserta como pendientes
-- y el job de envío los manda, reintenta y marca (F5HU2).
-- El UNIQUE evita avisar dos veces lo mismo (F5HU2, escenario 3).
create table public.notificacion (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfil (id) on delete cascade,
  titulo_id bigint not null references public.titulo (id),
  plataforma_id integer not null references public.plataforma (id),
  region char(2) not null check (region ~ '^[A-Z]{2}$'),
  estado public.estado_notificacion not null default 'pendiente',
  intentos smallint not null default 0 check (intentos >= 0),
  ultimo_error text,
  creada_en timestamptz not null default now(),
  enviada_en timestamptz,
  constraint notificacion_usuario_titulo_plataforma_region_key
    unique (usuario_id, titulo_id, plataforma_id, region)
);

-- El job de envío procesa las pendientes y las fallidas
create index notificacion_por_enviar_idx
  on public.notificacion (creada_en)
  where estado <> 'enviada';

-- Bloqueo temporal por intentos fallidos de login (E4HU2, escenario 6).
-- Se identifica por mail porque al fallar el login no se sabe qué usuario es.
-- No referencia a auth.users: también se cuentan los intentos con mails inexistentes,
-- así la respuesta es la misma exista o no la cuenta.
create table public.intento_login (
  email varchar(255) primary key check (email = lower(email)),
  intentos_fallidos smallint not null default 0 check (intentos_fallidos >= 0),
  bloqueado_hasta timestamptz, -- null: no está bloqueado
  ultimo_intento_en timestamptz not null default now()
);

-- ---------- Registro de procesos ----------

-- Cada ejecución de la sincronización diaria (F5HU1)
create table public.sincronizacion (
  id bigint generated always as identity primary key,
  iniciada_en timestamptz not null default now(),
  finalizada_en timestamptz,
  titulos_procesados integer not null default 0,
  avisos_generados integer not null default 0,
  error text
);

-- ---------- Funciones ----------

-- Crea el perfil cuando se registra un usuario, por mail o por Google
create function public.crear_perfil_para_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfil (id) values (new.id);
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario_nuevo();

-- Registra un login fallido de forma atómica y devuelve hasta cuándo queda
-- bloqueado el mail (null si todavía no llegó al máximo). Si el bloqueo anterior
-- ya venció, vuelve a contar desde cero. Tras un login exitoso, el backend
-- borra la fila del mail.
create function public.registrar_login_fallido(
  p_email text,
  p_max_intentos integer,
  p_minutos_bloqueo integer
)
returns timestamptz
language plpgsql
set search_path = ''
as $$
declare
  v_bloqueado_hasta timestamptz;
begin
  insert into public.intento_login as i (email, intentos_fallidos, ultimo_intento_en)
  values (lower(p_email), 1, now())
  on conflict (email) do update
    set intentos_fallidos = case
          when i.bloqueado_hasta is not null and i.bloqueado_hasta <= now() then 1
          else i.intentos_fallidos + 1
        end,
        bloqueado_hasta = case
          when i.bloqueado_hasta is not null and i.bloqueado_hasta <= now() then null
          else i.bloqueado_hasta
        end,
        ultimo_intento_en = now();

  update public.intento_login
  set bloqueado_hasta = now() + make_interval(mins => p_minutos_bloqueo)
  where email = lower(p_email)
    and intentos_fallidos >= p_max_intentos
    and bloqueado_hasta is null
  returning bloqueado_hasta into v_bloqueado_hasta;

  if v_bloqueado_hasta is null then
    select bloqueado_hasta into v_bloqueado_hasta
    from public.intento_login
    where email = lower(p_email);
  end if;

  return v_bloqueado_hasta;
end;
$$;

-- Las funciones de public quedan expuestas por la API REST (rpc): solo las
-- puede ejecutar el backend con la clave secreta.
revoke execute on function public.crear_perfil_para_usuario_nuevo() from public, anon, authenticated;
revoke execute on function public.registrar_login_fallido(text, integer, integer) from public, anon, authenticated;
grant execute on function public.registrar_login_fallido(text, integer, integer) to service_role;

-- ---------- RLS: sin políticas = sin acceso por la API REST ----------

alter table public.fuente_datos enable row level security;
alter table public.plataforma enable row level security;
alter table public.titulo enable row level security;
alter table public.disponibilidad enable row level security;
alter table public.perfil enable row level security;
alter table public.usuario_plataforma enable row level security;
alter table public.watchlist_item enable row level security;
alter table public.notificacion enable row level security;
alter table public.intento_login enable row level security;
alter table public.sincronizacion enable row level security;
