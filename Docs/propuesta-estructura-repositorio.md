# Estructura inicial del repositorio

**Buscador Unificado de Streaming · Grupo 6**

## Índice

1. Resumen de decisiones
2. Puntos para confirmar en equipo
3. Estructura del repositorio
4. Cómo arrancar
5. AGENTS.md y CLAUDE.md
6. Configuración de la raíz
7. Paquete shared (`packages/shared`)
8. Backend (`apps/api`)
9. Frontend (`apps/web`)
10. Base de datos (`supabase/`)
11. CI, template de PR y README

---

## 1. Resumen de decisiones

| Tema           | Decisión                                                                                                                                                                              | Por qué                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio    | Monorepo con npm workspaces (`apps/api`, `apps/web`, `packages/shared`)                                                                                                               | Las HU son verticales (front + back en el mismo PR) y los agentes de IA ven el contrato de la API completo. Sin Turborepo/Nx: no hace falta aún.        |
| Lenguaje       | JavaScript con ESM, sin TypeScript                                                                                                                                                    | Decisión del equipo. Los esquemas Zod compartidos cumplen el rol de contrato entre front y back.                                                        |
| Frontend       | React 19 + Vite + React Router + Tailwind CSS v4. Estado global con Context, un contexto por dominio                                                                                  | Modo oscuro por clase desde `ThemeProvider`.                                                                                                            |
| Backend        | Express 5 con capas modelo / repositorio / servicio / controlador / middleware                                                                                                        | Express 5 captura errores de handlers `async`, así que no hace falta `asyncHandler`.                                                                    |
| Datos          | Un solo proyecto de Supabase compartido por los 5, accedido **solo desde el backend** con `supabase-js`                                                                               | El front nunca habla con Supabase. El esquema vive en migraciones SQL versionadas y las aplica el CI al mergear a `main`.                               |
| Validación     | Zod                                                                                                                                                                                   | El mismo esquema valida el formulario en React y el request en Express. express-validator solo sirve del lado del servidor.                             |
| Tests          | Vitest (front y back) + supertest (endpoints) + Testing Library (componentes)                                                                                                         | Un solo runner y un solo comando para todo el monorepo.                                                                                                 |
| Lint y formato | ESLint 9 + Prettier (con orden de clases de Tailwind)                                                                                                                                 | Se usa ESLint 9 y no 10 porque `eslint-plugin-react` todavía no es compatible con ESLint 10.                                                            |
| Commits        | `tipo(alcance): descripción` en español e imperativo. Tipos: feat, fix, chore, refactor, docs, test                                                                                   | Se hace cumplir con commitlint en un hook local **y** en el CI, sin importar qué herramienta de IA use cada uno.                                        |
| Idioma         | Lo técnico en inglés (carpetas, sufijos, middlewares, contextos, jobs); lo del negocio en español (entidades, funciones de negocio, pantallas). Comentarios, commits y PRs en español | Ejemplos: `validate.middleware.js`, `ThemeProvider`, `plataforma.service.js` → `listarPlataformasDisponibles()`. Detalle en `AGENTS.md`.                |
| Mails          | Resend                                                                                                                                                                                | Alguien del equipo ya lo usó.                                                                                                                           |
| Docker         | Nadie lo instala                                                                                                                                                                      | Todos usan el proyecto compartido de Supabase. El único uso de Docker es el job que prueba las migraciones en el CI, y corre en las máquinas de GitHub. |
| Node / npm     | Node >= 22.22, npm >= 11                                                                                                                                                              | Ver punto 2.1.                                                                                                                                          |
| Agentes de IA  | `AGENTS.md` como única fuente de verdad; `CLAUDE.md` solo lo importa                                                                                                                  | Codex y Cursor leen `AGENTS.md`; Claude Code lee `CLAUDE.md`.                                                                                           |

---

## 2. Puntos para confirmar en equipo

**2.1. El mínimo de Node sube de 22.13 a 22.22.** Varias dependencias en su versión actual (React Router 8, jsdom, lint-staged) exigen Node 22.22 o superior. No es un cambio de versión mayor, es la misma línea 22: alcanza con `nvm install 22`. Además, **Node 22 trae npm 10**, así que cada uno tiene que correr `npm install -g npm@11`. El archivo `.npmrc` tiene `engine-strict=true`: con versiones menores, `npm install` falla con un mensaje claro en lugar de romper algo más adelante.

**2.2. Valores de los enums.** El esquema original tenía los enums como `USER-DEFINED`, sin sus valores. La migración propone:

- `tipo_titulo`: `pelicula`, `serie`
- `tipo_oferta`: `suscripcion`, `gratis`, `con_anuncios`, `alquiler`, `compra`
- `estado_notificacion`: `pendiente`, `enviada`, `fallida`

Si en Supabase ya existen con otros valores, hay que ajustar la migración **y** `packages/shared/src/constants/index.js`.

**2.3. Cambios al esquema respecto de `db-inicial.txt`.** Los nombres de tablas y columnas no cambian. Lo que se agrega:

- `region` pasa a `char(2)` con validación. En Postgres, `character` sin largo equivale a un solo carácter; probablemente la exportación perdió el largo, pero conviene dejarlo explícito.
- `UNIQUE (tmdb_id, tipo)` en `titulo`, necesario para que la sincronización diaria pueda hacer upsert.
- `UNIQUE (usuario_id, titulo_id)` en `watchlist_item`, para que no se repita un título en la watchlist.
- Columna `watchlist_item.aviso_activo`, para la HU "activar un aviso en un título de mi watchlist".
- `ON DELETE CASCADE` desde `auth.users` hacia perfil, watchlist, plataformas propias y notificaciones. Así la eliminación de cuenta (E4HU7) borra todo con una sola llamada.
- Un trigger que crea la fila en `perfil` cuando se registra un usuario, venga por mail o por Google.
- RLS habilitado en todas las tablas sin políticas: la API REST pública de Supabase queda bloqueada, y el backend accede igual porque usa la clave secreta.

**2.4. Rama principal.** El CI asume que la rama principal se llama `main`. La tarjeta "Definir forma de trabajar en GitHub" sigue abierta: si deciden usar otra rama (por ejemplo `develop`), se cambia en `.github/workflows/ci.yml`.

**2.5. Las migraciones las aplica el CI, nunca una persona.** Descartamos hacer los cambios directo desde el dashboard: los agentes de IA dejarían de conocer el esquema, los cambios de la base no pasarían por code review y no habría forma de recrear la base (la exportación del dashboard ya perdió los enums una vez). Todos pueden escribir migraciones en sus ramas, pero nadie las aplica a mano. Hay dos workflows:

- En cada PR, el job `migraciones` de `ci.yml` levanta un Postgres de Supabase descartable en GitHub Actions y aplica todas las migraciones y el seed desde cero. Si una migración tiene un error, el PR falla y nunca llega a la base compartida. Este job usa Docker, pero en las máquinas de GitHub: nadie del equipo tiene que instalarlo.
- Al mergear a `main`, el workflow `migraciones.yml` las aplica a la base compartida. Nunca corren dos a la vez.

Esto trae dos reglas de trabajo que el equipo tiene que aceptar (están en `AGENTS.md`):

- **Migración primero.** Mientras trabajás en tu rama no podés probar tu migración contra la base compartida. Por eso, si una HU cambia el esquema, la migración va en un PR chico y aparte que se revisa y mergea rápido; después se sigue con la HU sobre la base ya actualizada.
- **Migraciones compatibles.** Como se aplican a la base que todos usan en ese momento, no pueden romper el código de `main` ni de las ramas de los demás. Agregar tablas o columnas: sí. Renombrar o borrar: en dos pasos.

También quedan las reglas de uso de la base compartida: nadie borra ni modifica datos masivamente sin avisar, y los agentes de IA no ejecutan SQL que escriba en la base sin confirmación de la persona. Todos tienen la clave secreta en su `.env`, y un agente con esa clave puede borrar cualquier cosa.

Hace falta una persona que administre el proyecto de Supabase, pero solo para tareas puntuales: el reset inicial (punto 2.6), cargar los secretos en GitHub, pasar las claves al resto y reactivar el proyecto si Supabase lo pausa por inactividad.

**2.6. La base actual se recrea desde la migración.** El proyecto compartido ya tiene tablas creadas desde el dashboard, y la migración inicial falla si las tablas ya existen. Como todavía no hay datos reales, lo más limpio es que quien administra el proyecto borre las tablas actuales y aplique la migración desde cero, una única vez (ver sección 4). A partir de ahí, la base y el repo coinciden siempre. Si hay datos que quieran conservar, avisen antes.

**2.7. IDs de plataformas en el seed.** Los `tmdb_provider_id` de `supabase/seed.sql` (Netflix 8, Prime Video 119, Disney+ 337, etc.) hay que verificarlos contra la API de TMDB para Argentina antes de dar la base por buena.

**2.8. Resend necesita un dominio verificado** para enviar mails a cualquier dirección. Sin dominio, solo se puede enviar al mail de la cuenta de Resend, lo que alcanza para desarrollo pero no para producción. Conviene que quien ya lo usó lo confirme.

**2.9. Login con Google desde el backend (E4HU1).** Como el front no habla con Supabase, el flujo OAuth pasa entero por Express. Es la HU técnicamente más riesgosa: sugerimos un spike antes de estimarla.

**2.10. Impeccable.** No está incluido en esta propuesta. Si lo queremos para el diseño del front, se instala con `npx impeccable skills install` (detecta la herramienta de cada uno) y se agrega una línea en `AGENTS.md`.

---

## 3. Estructura del repositorio

```
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── migraciones.yml
│   └── pull_request_template.md
├── .husky/
│   ├── commit-msg
│   └── pre-commit
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── cookies.config.js
│   │   │   │   ├── env.config.js
│   │   │   │   └── supabase.config.js
│   │   │   ├── controllers/
│   │   │   │   ├── plataforma.controller.js
│   │   │   │   └── region.controller.js
│   │   │   ├── errors/
│   │   │   │   └── index.js
│   │   │   ├── integrations/
│   │   │   │   ├── geoip.integration.js
│   │   │   │   ├── resend.integration.js
│   │   │   │   ├── streamingAvailability.integration.js
│   │   │   │   └── tmdb.integration.js
│   │   │   ├── jobs/
│   │   │   │   ├── index.js
│   │   │   │   ├── run.js
│   │   │   │   ├── sendNotifications.job.js
│   │   │   │   └── syncAvailability.job.js
│   │   │   ├── middlewares/
│   │   │   │   ├── detectRegion.middleware.js
│   │   │   │   ├── errorHandler.middleware.js
│   │   │   │   ├── requireSession.middleware.js
│   │   │   │   ├── validate.middleware.js
│   │   │   │   └── validate.middleware.test.js
│   │   │   ├── models/
│   │   │   │   └── plataforma.model.js
│   │   │   ├── repositories/
│   │   │   │   └── plataforma.repository.js
│   │   │   ├── routes/
│   │   │   │   ├── index.js
│   │   │   │   ├── plataforma.routes.js
│   │   │   │   ├── plataforma.routes.test.js
│   │   │   │   └── region.routes.js
│   │   │   ├── services/
│   │   │   │   └── plataforma.service.js
│   │   │   ├── app.js
│   │   │   ├── app.test.js
│   │   │   └── server.js
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── vitest.config.js
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── MainLayout.jsx
│       │   │   ├── NotFoundPage.jsx
│       │   │   └── router.js
│       │   ├── components/
│       │   │   └── ui/
│       │   │       ├── Attribution.jsx
│       │   │       └── ThemeToggle.jsx
│       │   ├── contexts/
│       │   │   ├── region/
│       │   │   │   ├── RegionContext.js
│       │   │   │   └── RegionProvider.jsx
│       │   │   ├── session/
│       │   │   │   ├── SessionContext.js
│       │   │   │   └── SessionProvider.jsx
│       │   │   └── theme/
│       │   │       ├── ThemeContext.js
│       │   │       ├── ThemeProvider.jsx
│       │   │       └── ThemeProvider.test.jsx
│       │   ├── features/
│       │   │   └── busqueda/
│       │   │       └── PaginaBusqueda.jsx
│       │   ├── hooks/
│       │   ├── services/
│       │   │   └── api.service.js
│       │   ├── test/
│       │   │   └── setup.js
│       │   ├── main.jsx
│       │   └── styles.css
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── constants/
│       │   │   └── index.js
│       │   └── schemas/
│       │       ├── auth.schema.js
│       │       ├── busqueda.schema.js
│       │       ├── index.js
│       │       └── region.schema.js
│       └── package.json
├── supabase/
│   ├── migrations/
│   │   └── 20260927000000_initial_schema.sql
│   ├── config.toml
│   └── seed.sql
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .npmrc
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── AGENTS.md
├── CLAUDE.md
├── commitlint.config.js
├── eslint.config.js
├── package.json
└── README.md
```

`supabase/config.toml` no se incluye en este documento porque lo genera `npx supabase init`.

---

## 4. Cómo arrancar

**Una sola vez, quien crea la estructura en el repo:**

```bash
# con los archivos de este documento ya copiados en el repo
npx supabase init          # genera supabase/config.toml (responder "no" a las preguntas de VS Code)
npm install                # instala todo y activa los hooks de Git (husky)
npm run check              # lint + formato + tests: tiene que pasar
git add -A
git commit -m "chore: agrega esqueleto inicial del monorepo"
```

**Una sola vez, quien administra el proyecto de Supabase**, en este orden y **antes** de mergear el esqueleto a `main`:

```bash
# 1. Desde la rama del esqueleto: recrear la base desde la migración + seed.
#    Borra TODO lo que hay en la base (ver punto 2.6). Es la única vez que se aplica a mano.
npx supabase login
npx supabase link --project-ref <ref-del-proyecto-compartido>
npx supabase db reset --linked
```

2. Cargar tres secretos en GitHub (Settings → Secrets and variables → Actions):
   - `SUPABASE_ACCESS_TOKEN`: token personal, se genera en supabase.com → Account → Access Tokens.
   - `SUPABASE_DB_PASSWORD`: contraseña de la base (Project Settings → Database).
   - `SUPABASE_PROJECT_REF`: el identificador del proyecto (está en la URL del dashboard).
3. Mergear el esqueleto a `main`. El workflow `Migraciones` corre, ve que la base ya tiene la migración inicial y no aplica nada.

De ahí en adelante, las migraciones se aplican solas al mergear a `main`.

**Cada integrante del equipo:**

```bash
nvm install 22 && npm install -g npm@11     # Node >= 22.22 y npm >= 11
git clone https://github.com/RomeroSilvia/Agiles_grupo_6.git && cd Agiles_grupo_6
npm install
cp apps/api/.env.example apps/api/.env      # completar con las claves del proyecto compartido
npm run dev                                 # API en :3000, web en :5173
```

Para verificar que todo anda: `http://localhost:5173` muestra la página inicial con la región "AR", y `http://localhost:5173/api/plataformas` devuelve las plataformas del seed.

**Tip:** este documento sirve también como instrucción para la herramienta de IA de cada uno. Pedirle "creá estos archivos tal cual están en el documento" ahorra copiar a mano.

---

## 5. AGENTS.md y CLAUDE.md

`AGENTS.md` es el archivo más importante de la propuesta: es lo que leen Codex, Cursor y (a través de `CLAUDE.md`) Claude Code antes de escribir código. Si algo de las convenciones no nos convence, este es el lugar para discutirlo.

#### `AGENTS.md`

````markdown
# AGENTS.md — Buscador Unificado de Streaming

Instrucciones para agentes de IA (Claude Code, Codex, Cursor, etc.) y para las personas del equipo. Este archivo es la única fuente de verdad sobre convenciones: si una regla no sirve, se cambia acá mediante un PR, no se ignora.

## Producto

Buscador de películas y series que muestra en qué plataformas de streaming está disponible un título según la región del usuario y redirige a la plataforma. Datos de TMDB (metadata y disponibilidad vía JustWatch) y Streaming Availability API (deep links). Backlog y criterios de aceptación: issues de GitHub y tablero de Trello.

## Stack

- Monorepo con npm workspaces. Node >= 22.22, npm >= 11. JavaScript (ESM), **sin TypeScript**.
- `apps/web`: React 19 + Vite + React Router + Tailwind CSS v4. Estado global con Context.
- `apps/api`: Node + Express 5, patrón model / repository / service / controller / middleware.
- `packages/shared`: esquemas Zod y constantes usados por front y back.
- Datos: **un único proyecto de Supabase compartido por todo el equipo** (Postgres + Auth), accedido solo desde el backend con `@supabase/supabase-js`.
- Tests: Vitest en ambos lados; supertest para endpoints.
- Mails: Resend.

## Comandos

Desde la raíz:

| Comando                                | Qué hace                                         |
| -------------------------------------- | ------------------------------------------------ |
| `npm run dev`                          | Levanta API (:3000) y web (:5173) juntos         |
| `npm run check`                        | Lint + formato + tests. Correr antes de terminar |
| `npm run lint:fix` / `npm run format`  | Corrige lint y formato                           |
| `npm test -w apps/api`                 | Tests de un solo workspace                       |
| `npm run job -w apps/api -- <nombre>`  | Ejecuta un job programado a mano                 |
| `npm run db:new-migration -- <nombre>` | Crea un archivo de migración vacío               |

Instalar dependencias siempre en el workspace correspondiente: `npm install <paquete> -w apps/api`.

## Idioma: técnico en inglés, negocio en español

Es la regla que más se presta a confusión. Aplicarla así:

- **Inglés: todo lo técnico**, lo que existiría en cualquier aplicación. Carpetas, sufijos de archivo, config, middlewares, errores, jobs, integraciones, contextos y providers, layouts, componentes de UI genéricos, cliente HTTP, variables de entorno y el formato de respuesta de la API.
  Ejemplos: `validate.middleware.js` → `validate()`, `ThemeProvider`, `useSession`, `AppError`, `syncAvailability.job.js`, `sendEmail()`, `DEFAULT_REGION`, `{ data }`.
- **Español: todo lo que nombra conceptos del producto**. Entidades de la base, funcionalidades, pantallas del producto y operaciones de negocio.
  Ejemplos: `plataforma.service.js` → `listarPlataformasDisponibles()`, `busquedaSchema`, `PaginaBusqueda`, `TIPOS_TITULO`, `features/busqueda/`.
- **Nombres combinados**: el concepto del negocio en español y el rol técnico en inglés: `plataformaService`, `plataformaRoutes`, `busquedaSchema`, `PLATAFORMA_COLUMNS`.
- **Siempre en español**: comentarios, textos que ve el usuario, mensajes de error, descripciones de tests, commits y PRs.
- **Base de datos**: tablas y columnas en español y snake_case (`titulo`, `watchlist_item`). No se renombran.
- Sin tildes ni ñ en identificadores (`anio`, no `año`).
- Si hay duda sobre si algo es técnico o de negocio: preguntarse si existiría en otra aplicación sin cambios. Si existiría, va en inglés.

## Estructura

```
apps/api/src/
  config/          env.config.js (validado con Zod), supabase.config.js, cookies.config.js
  models/          <entidad>.model.js: columnas, esquema Zod y fromRow()
  repositories/    <entidad>.repository.js: único lugar que consulta Supabase
  services/        <entidad>.service.js: lógica de negocio
  controllers/     <entidad>.controller.js: HTTP ↔ service
  routes/          <entidad>.routes.js + index.js
  middlewares/     <nombre>.middleware.js: validate, requireSession, detectRegion, errorHandler
  integrations/    <servicio>.integration.js: tmdb, streamingAvailability, geoip, resend
  jobs/            <nombre>.job.js: syncAvailability, sendNotifications
  errors/          clases de error
  app.js           arma la app de Express (sin levantarla)
  server.js        punto de entrada
apps/web/src/
  app/             router.js, MainLayout, NotFoundPage
  contexts/        un contexto por dominio: <Nombre>Context.js + <Nombre>Provider.jsx
  features/        una carpeta por funcionalidad del producto: busqueda, watchlist...
  components/ui/   componentes reutilizables (ThemeToggle, Attribution...)
  services/        api.service.js: único punto de acceso a la API
  hooks/           hooks reutilizables entre funcionalidades
packages/shared/src/
  schemas/         <nombre>.schema.js: Zod compartidos (formularios + validación de la API)
  constants/       enums y valores que deben coincidir con la base
supabase/
  migrations/      el esquema de la base. Única forma de cambiarlo
  seed.sql         datos iniciales (plataformas, fuentes de datos)
```

## Backend: reglas de capas

Flujo de un request: `route → middlewares → controller → service → repository / integration`.

- **Model**: columnas a leer (`<ENTIDAD>_COLUMNS`), esquema Zod de la entidad y `fromRow()`. Sin lógica.
- **Repository**: el único que importa `supabaseAdmin`. Devuelve objetos ya convertidos con `fromRow()`. Si Supabase devuelve `error` con código `23505` (restricción única), lanza `ConflictError`; cualquier otro `error`, `DatabaseError`.
- **Service**: lógica de negocio. No conoce `req` ni `res`. Llama a repositories e integrations.
- **Controller**: lee `req.validated`, `req.user`, `req.region`; llama a un service; responde. Sin lógica de negocio.
- **Routes**: endpoint + middlewares + controller. Se montan en `routes/index.js`.
- **Integrations**: una por API externa. Lanzan `ExternalServiceError` si fallan.
- **Jobs**: invocan services, nunca controllers. Se registran en `jobs/index.js`.

Otras reglas:

- Errores disponibles en `errors/`: `ValidationError` (400), `UnauthenticatedError` (401, sin sesión), `ForbiddenError` (403, con sesión pero sin permiso, por ejemplo una función premium), `NotFoundError` (404), `ConflictError` (409, duplicados), `DatabaseError` (500), `ExternalServiceError` (502).
- Si alguien pide un recurso de **otro usuario**, responder 404 y no 403: el 403 confirmaría que el recurso existe.
- Express 5 captura errores de handlers `async`: no usar try/catch para responder errores ni `asyncHandler`. Lanzar un error de `errors/` y dejar que lo maneje `errorHandler`.
- En Express 5 `req.query` es de solo lectura: los datos validados se leen de `req.validated`.
- Importar services y repositories como módulo: `import * as tituloService from '../services/titulo.service.js'`.
- Imports relativos siempre con extensión `.js`.
- Rutas de la API: recursos del negocio en español (`/api/plataformas`, `/api/watchlist`), rutas técnicas en inglés (`/api/health`, `/api/auth/session`).

## Datos y Supabase

- El front **nunca** habla con Supabase. Todo pasa por la API.
- `supabaseAdmin` usa la clave secreta e **ignora RLS**. Toda consulta sobre datos de un usuario debe filtrar por `usuario_id = req.user.id`. Nunca tomar el id de usuario del body o de la query.
- Para signUp, signIn y recuperación de contraseña usar `createAuthClient()`, **uno nuevo por request**.
- Toda tabla nueva lleva `enable row level security` (sin políticas).
- supabase-js no tiene transacciones: si varias escrituras deben ser atómicas, crear una función SQL en una migración y llamarla con `.rpc()`.
- Los valores de `packages/shared/src/constants` deben coincidir con los enums de la base.
- Streaming Availability API tiene 100 requests por día: nunca consultarla por cada búsqueda; cachear en `disponibilidad`.

### La base es compartida por los 5

- El esquema solo se cambia con una migración nueva en `supabase/migrations/`. Nunca desde el dashboard. Nunca editar una migración ya mergeada: crear otra.
- **Nadie corre `supabase db push` a mano.** Las migraciones las aplica el workflow `Migraciones` de GitHub Actions cuando se mergean a `main`. En cada PR, el CI las prueba antes en una base temporal.
- **Migración primero:** si una HU necesita cambiar el esquema, la migración va en un PR chico y aparte (con las constantes de `packages/shared` si cambian). Se mergea, el CI la aplica, y recién ahí se sigue con la HU sobre la base ya actualizada.
- **Toda migración debe ser compatible con el código que ya está en `main` y en las ramas de los demás**, porque se aplica a la base que todos usan en ese momento. Agregar tablas, columnas nullable o con default, e índices: sí. Renombrar o borrar columnas y tablas: en dos PRs (primero se agrega lo nuevo y se migra el código; cuando nadie usa lo viejo, se borra).
- Antes de mergear un PR con migración, actualizar la rama con `main`. Si `main` tiene una migración con timestamp posterior a la tuya y la tuya depende de ella, recrear la tuya con `npm run db:new-migration` para que quede última.
- **Nunca** borrar, truncar ni modificar datos masivamente sin avisar al equipo. Los agentes de IA no deben ejecutar SQL ni scripts que escriban en la base sin confirmación explícita de la persona.
- Los datos de prueba se cargan con usuarios propios y se limpian después. No tocar datos de otros.
- Los tests **nunca** se conectan a Supabase: se mockean los repositories.
- Este proyecto es el de desarrollo. Producción, cuando exista, será un proyecto separado.

## Frontend

- Un contexto por dominio en `contexts/<dominio>/`: `<Nombre>Context.js` (createContext + hook `use<Nombre>`) y `<Nombre>Provider.jsx` (componente). El valor del provider va en `useMemo`.
- Context solo para estado global que cambia poco (sesión, tema, región, plataformas propias). Los resultados de búsqueda y los datos de una pantalla van en hooks de la funcionalidad (`useBusqueda`), no en Context.
- Todas las llamadas a la API pasan por `services/api.service.js` (`request`).
- Estilos solo con clases de Tailwind. Colores y tokens propios en `@theme` de `src/styles.css`; no usar valores sueltos (`bg-[#123456]`).
- Todo componente visual debe verse bien en modo oscuro (`dark:`) y en celular (mobile first: clases base para celular, `md:` / `lg:` para pantallas grandes).
- La atribución a TMDB y JustWatch (`components/ui/Attribution.jsx`) debe ser visible donde se muestre disponibilidad. Es un requisito legal.
- Formularios: validar con los esquemas de `@buscador/shared/schemas`, los mismos que usa la API.
- Componentes en PascalCase, un componente por archivo con el mismo nombre (`PaginaBusqueda.jsx`, `ThemeToggle.jsx`).

## Validación

- Zod en todos lados. Esquemas de entrada de la API que también usa el front: en `packages/shared`. Esquemas solo del backend: en el model o junto a la ruta.
- Validar en la ruta con `validate({ body, query, params })`.

## Convenciones de nombres

- Archivos del backend y del paquete shared: `<nombre>.<capa>.js` (`titulo.service.js`, `validate.middleware.js`, `busqueda.schema.js`).
- Variables y funciones en camelCase; componentes y clases en PascalCase; constantes globales en MAYUSCULAS.
- Funciones de negocio en infinitivo: `buscarTitulos`, `obtenerDisponibilidad`, `agregarAWatchlist`.
- Hooks con prefijo `use` obligatorio: `useBusqueda`, `useSession`.
- Objetos de dominio en camelCase (`posterPath`); el snake_case de la base queda solo dentro de repositories y `fromRow()`.

## Formato de respuestas de la API

- Éxito: `{ "data": ... }`
- Error: `{ "error": { "code": "VALIDATION", "message": "...", "details": [...] } }`
- `code` es estable y en inglés (el front lo usa para decidir); `message` está en español y es apto para mostrar al usuario.

## Tests

- Archivos `*.test.js` / `*.test.jsx` junto al archivo que prueban.
- Importar `describe`, `it`, `expect`, `vi` desde `vitest` (no hay globals).
- Endpoints: supertest sobre `createApp()`, mockeando el repository con `vi.mock`. Los tests nunca llaman a Supabase ni a APIs externas reales.
- Componentes: Testing Library, buscando por rol y texto visible, no por clases CSS.
- Toda HU nueva agrega al menos un test del caso feliz y uno de error.

## Commits y PRs

- Commits y PRs **en español**.
- Formato: `tipo(alcance): descripción`, con el verbo en imperativo: `agrega`, `corrige`, `elimina`.
- Tipos permitidos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
- Alcance opcional: el módulo afectado, con el mismo nombre que en el código (`busqueda`, `watchlist`, `auth`, `api`, `web`, `db`).
- Ejemplos:
  - `feat(busqueda): agrega filtro por tipo y año`
  - `fix(auth): corrige expiración de la cookie de sesión`
  - `test(watchlist): agrega pruebas del servicio de watchlist`
  - `chore(db): agrega migración de índices de disponibilidad`
- Incorrecto: `feat: agregar filtro` (infinitivo), `feat: agregué filtro` (pasado), `feat: add filter` (inglés).
- Un PR por HU o tarea, enlazando el issue con `Closes #N`. Completar el template.

## Seguridad: nunca

- Nunca exponer `SUPABASE_SECRET_KEY` ni ninguna API key fuera de `apps/api`. El front no tiene variables de entorno con secretos.
- Nunca commitear `.env`. Toda variable nueva va en `apps/api/.env.example`.
- Nunca guardar tokens de sesión en `localStorage`: viven en cookies httpOnly que maneja la API.
- Nunca desactivar RLS ni crear políticas que den acceso público a tablas.
- Nunca quitar la atribución a TMDB/JustWatch.

## Antes de dar una tarea por terminada

1. `npm run check` pasa sin errores.
2. Hay tests para lo nuevo.
3. Si cambió el esquema: la migración va en su propio PR, es compatible con el código de `main`, y se actualizaron las constantes de `packages/shared` si hacía falta. Nunca aplicarla a mano.
4. Si hay variables de entorno nuevas: están en `.env.example`.
5. Si hay UI nueva: probada en modo claro y oscuro, en celular y escritorio.
````

#### `CLAUDE.md`

```markdown
@AGENTS.md
```

---

## 6. Configuración de la raíz

`package.json` define los workspaces, los scripts comunes y lint-staged (formatea solo los archivos que se commitean). Las versiones de las dependencias son las últimas disponibles al generar la propuesta; `npm install` las resuelve igual.

#### `package.json`

```json
{
  "name": "buscador-streaming",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "engines": {
    "node": ">=22.22.0",
    "npm": ">=11.0.0"
  },
  "scripts": {
    "dev": "concurrently -n api,web -c blue,magenta \"npm run dev -w apps/api\" \"npm run dev -w apps/web\"",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "check": "npm run lint && npm run format:check && npm run test",
    "db:new-migration": "supabase migration new",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,html,yml,yaml}": ["prettier --write"]
  },
  "devDependencies": {
    "@commitlint/cli": "^21.2.3",
    "@commitlint/config-conventional": "^21.2.3",
    "@eslint/js": "^9.39.5",
    "concurrently": "^10.0.5",
    "eslint": "^9.39.5",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.12.0",
    "husky": "^9.1.7",
    "lint-staged": "^17.6.0",
    "prettier": "^3.9.9",
    "prettier-plugin-tailwindcss": "^0.8.1",
    "supabase": "^2.118.0"
  }
}
```

#### `.nvmrc`

```text
22
```

#### `.npmrc`

```ini
engine-strict=true
```

#### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

#### `.gitattributes`

```text
* text=auto eol=lf
```

#### `.gitignore`

```text
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
*.log
supabase/.temp/
supabase/.branches/
```

#### `.prettierrc.json`

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./apps/web/src/styles.css"
}
```

#### `.prettierignore`

```text
package-lock.json
dist/
coverage/
supabase/
```

#### `eslint.config.js`

```js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'supabase/**'],
  },

  js.configs.recommended,

  // Reglas comunes a todo el monorepo
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // Backend, packages/shared y archivos de configuración: entorno Node
  {
    files: ['apps/api/**/*.js', 'packages/**/*.js', '*.js', 'apps/web/*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend: navegador + React
  {
    files: ['apps/web/src/**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      // React 19 ya no valida propTypes: la validación de datos se hace con Zod.
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Siempre al final: desactiva las reglas de estilo que resuelve Prettier
  prettier,
];
```

#### `commitlint.config.js`

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'refactor', 'docs', 'test']],
    // Las reglas de mayúsculas de config-conventional están pensadas para inglés
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
```

#### `.husky/pre-commit`

```bash
npx lint-staged
```

#### `.husky/commit-msg`

```bash
npx --no -- commitlint --edit "$1"
```

---

## 7. Paquete shared (`packages/shared`)

Lo usan front y back. Si un esquema valida un formulario del front y también el request en la API, vive acá.

#### `packages/shared/package.json`

```json
{
  "name": "@buscador/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./schemas": "./src/schemas/index.js",
    "./constants": "./src/constants/index.js"
  },
  "dependencies": {
    "zod": "^4.6.5"
  }
}
```

#### `packages/shared/src/constants/index.js`

```js
// Valores del negocio: deben coincidir con los enums de la base (supabase/migrations).
export const TIPOS_TITULO = ['pelicula', 'serie'];

export const TIPOS_OFERTA = ['suscripcion', 'gratis', 'con_anuncios', 'alquiler', 'compra'];

export const ESTADOS_NOTIFICACION = ['pendiente', 'enviada', 'fallida'];

// Valores técnicos
export const DEFAULT_REGION = 'AR';

// Código de país ISO 3166-1 alfa-2, igual que el CHECK de perfil.region
export const REGION_PATTERN = /^[A-Z]{2}$/;
```

#### `packages/shared/src/schemas/index.js`

```js
export * from './auth.schema.js';
export * from './busqueda.schema.js';
export * from './region.schema.js';
```

#### `packages/shared/src/schemas/busqueda.schema.js`

```js
import { z } from 'zod';
import { TIPOS_TITULO } from '../constants/index.js';

export const busquedaSchema = z.object({
  q: z.string().trim().min(1, 'Ingresá un título para buscar').max(100),
  tipo: z.enum(TIPOS_TITULO).optional(),
  anio: z.coerce.number().int().min(1888).max(2100).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
});
```

#### `packages/shared/src/schemas/auth.schema.js`

```js
import { z } from 'zod';

const email = z.email('Ingresá un mail válido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede superar los 72 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe tener al menos un carácter especial');

// Registro, cambio y recuperación de contraseña: se validan los criterios de seguridad
export const signUpSchema = z.object({
  email,
  password: passwordSchema,
});

// Inicio de sesión: solo se verifica que venga algo; la contraseña la valida Supabase
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
```

#### `packages/shared/src/schemas/region.schema.js`

```js
import { z } from 'zod';
import { REGION_PATTERN } from '../constants/index.js';

export const regionSchema = z.string().regex(REGION_PATTERN, 'Región inválida');
```

---

## 8. Backend (`apps/api`)

### 8.1. Base: servidor, app, configuración y errores

`config/env.config.js` valida las variables de entorno al arrancar: si falta una clave, el servidor no levanta y dice exactamente cuál. `config/supabase.config.js` tiene los dos clientes (ver la sección "Datos y Supabase" de `AGENTS.md`).

#### `apps/api/package.json`

```json
{
  "name": "@buscador/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "job": "node --env-file=.env src/jobs/run.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "supertest": "^7.3.0",
    "vitest": "^5.0.2"
  },
  "dependencies": {
    "@buscador/shared": "*",
    "@supabase/supabase-js": "^2.117.2",
    "cookie-parser": "^1.4.7",
    "express": "^5.2.1",
    "helmet": "^8.3.0",
    "node-cron": "^4.6.0",
    "resend": "^6.30.0",
    "zod": "^4.6.5"
  }
}
```

#### `apps/api/.env.example`

```ini
# Copiar a apps/api/.env y completar. Nunca commitear el .env.
# Las claves del proyecto compartido de Supabase las pasa quien lo administra.
NODE_ENV=development
PORT=3000

# Supabase (proyecto compartido de desarrollo): Project Settings → API Keys.
# La clave secreta (sb_secret_... o la legacy service_role) SOLO va en el backend.
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# URL pública del front (redirecciones de auth y links en mails)
FRONTEND_URL=http://localhost:5173

# Región que se usa cuando no se puede detectar por IP
DEFAULT_REGION=AR

# Integraciones externas (opcionales hasta que se implemente la HU que las usa)
TMDB_API_TOKEN=
STREAMING_AVAILABILITY_API_KEY=
RESEND_API_KEY=
RESEND_FROM="Buscador Streaming <avisos@tu-dominio.com>"
```

#### `apps/api/vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Valores ficticios para que config/env.config.js valide sin un .env real.
    // Los tests NUNCA llegan a Supabase (la base es compartida): se mockean los repositorios.
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_PUBLISHABLE_KEY: 'clave-publica-de-prueba',
      SUPABASE_SECRET_KEY: 'clave-secreta-de-prueba',
    },
  },
});
```

#### `apps/api/src/server.js`

```js
import { env } from './config/env.config.js';
import { createApp } from './app.js';
import { scheduleJobs } from './jobs/index.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.info(`API escuchando en http://localhost:${env.PORT}`);
});

if (env.NODE_ENV !== 'test') {
  scheduleJobs();
}
```

#### `apps/api/src/app.js`

```js
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { routes } from './routes/index.js';
import { detectRegion } from './middlewares/detectRegion.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';

/** Crea la app sin levantar el servidor, para poder testearla con supertest. */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(detectRegion);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

#### `apps/api/src/config/env.config.js`

```js
import { z } from 'zod';
import { REGION_PATTERN } from '@buscador/shared/constants';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  DEFAULT_REGION: z.string().regex(REGION_PATTERN).default('AR'),
  TMDB_API_TOKEN: z.string().optional(),
  STREAMING_AVAILABILITY_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Variables de entorno inválidas:\n' + z.prettifyError(result.error));
  process.exit(1);
}

export const env = Object.freeze(result.data);
```

#### `apps/api/src/config/supabase.config.js`

```js
import { createClient } from '@supabase/supabase-js';
import { env } from './env.config.js';

const serverOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

/**
 * Cliente con la clave secreta: ignora RLS.
 * Único cliente para acceso a datos y para auth.admin. Compartido por todo el proceso.
 * Como ignora RLS, cada repositorio es responsable de filtrar por usuario.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, serverOptions);

/**
 * Cliente con la clave pública, para operaciones de sesión del usuario
 * (signUp, signInWithPassword, recuperación de contraseña).
 * Crear uno NUEVO por request: esos métodos guardan la sesión en la instancia,
 * y una instancia compartida podría mezclar sesiones de distintos usuarios.
 */
export function createAuthClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, serverOptions);
}
```

#### `apps/api/src/config/cookies.config.js`

```js
import { env } from './env.config.js';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Opciones comunes: el front nunca puede leer los tokens desde JavaScript. */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};
```

#### `apps/api/src/errors/index.js`

```js
export class AppError extends Error {
  /**
   * @param {string} message Mensaje apto para mostrar al usuario (en español)
   * @param {object} [options]
   * @param {number} [options.status] Código HTTP
   * @param {string} [options.code] Código estable para que el front distinga errores
   * @param {unknown} [options.details]
   * @param {unknown} [options.cause] Error original (solo para logs, no se envía al cliente)
   */
  constructor(message, { status = 500, code = 'INTERNAL', details, cause } = {}) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  /** @param {import('zod').ZodError} zodError */
  constructor(zodError) {
    super('Los datos enviados no son válidos', {
      status: 400,
      code: 'VALIDATION',
      details: zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Tenés que iniciar sesión') {
    super(message, { status: 401, code: 'UNAUTHENTICATED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para realizar esta acción') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, { status: 409, code: 'CONFLICT' });
  }
}

export class DatabaseError extends AppError {
  constructor(cause) {
    super('Error al acceder a los datos', { status: 500, code: 'DATABASE', cause });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, cause) {
    super(`El servicio ${service} no está disponible`, {
      status: 502,
      code: 'EXTERNAL_SERVICE',
      cause,
    });
  }
}
```

### 8.2. Middlewares

#### `apps/api/src/middlewares/validate.middleware.js`

```js
import { ValidationError } from '../errors/index.js';

/**
 * Valida partes del request con esquemas Zod.
 * En Express 5 `req.query` es de solo lectura, así que los datos
 * ya parseados (con defaults y coerciones aplicados) quedan en `req.validated`.
 *
 * @example
 * router.get('/', validate({ query: busquedaSchema }), busquedaController.buscar);
 * // en el controller: const { q, pagina } = req.validated.query;
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        return next(new ValidationError(result.error));
      }
      validated[part] = result.data;
    }
    req.validated = validated;
    next();
  };
}
```

#### `apps/api/src/middlewares/requireSession.middleware.js`

```js
import { supabaseAdmin } from '../config/supabase.config.js';
import { ACCESS_TOKEN_COOKIE } from '../config/cookies.config.js';
import { UnauthenticatedError } from '../errors/index.js';

/**
 * Exige un usuario autenticado. Deja `req.user = { id, email }`.
 * TODO (optimización): verificar el JWT localmente con las claves públicas (JWKS)
 * del proyecto en lugar de consultar a Supabase en cada request.
 */
export async function requireSession(req, _res, next) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!token) {
    throw new UnauthenticatedError();
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw new UnauthenticatedError('La sesión expiró, volvé a iniciar sesión');
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
```

#### `apps/api/src/middlewares/detectRegion.middleware.js`

```js
import { env } from '../config/env.config.js';

/**
 * Deja en `req.region` el código de país del usuario.
 * TODO (E2HU1): detectar por IP con integrations/geoip.integration.js y usar la región
 * por defecto solo como respaldo. Considerar `app.set('trust proxy', ...)` en producción.
 */
export function detectRegion(req, _res, next) {
  req.region = env.DEFAULT_REGION;
  next();
}
```

#### `apps/api/src/middlewares/errorHandler.middleware.js`

```js
import { AppError, NotFoundError } from '../errors/index.js';

export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Express reconoce el manejador de errores por tener 4 parámetros: no quitar `_next`.
export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      console.error(error, error.cause);
    }
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
  }

  // JSON mal formado en el body
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El cuerpo del request no es JSON válido' },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado' },
  });
}
```

### 8.3. Ejemplo completo: `GET /api/plataformas`

Este endpoint recorre todas las capas y sirve de modelo para las HU. Para agregar un endpoint nuevo, copiar este patrón.

#### `apps/api/src/models/plataforma.model.js`

```js
import { z } from 'zod';

/** Columnas que se leen de la tabla. Mantener sincronizado con fromRow(). */
export const PLATAFORMA_COLUMNS =
  'id, tmdb_provider_id, nombre, logo_path, url_home, url_busqueda, activa';

export const plataformaSchema = z.object({
  id: z.number().int(),
  tmdbProviderId: z.number().int(),
  nombre: z.string(),
  logoPath: z.string().nullable(),
  urlHome: z.string().nullable(),
  urlBusqueda: z.string().nullable(),
  activa: z.boolean(),
});

/**
 * @typedef {z.infer<typeof plataformaSchema>} Plataforma
 */

/**
 * Convierte una fila de la base (snake_case) al objeto de dominio (camelCase).
 * @returns {Plataforma}
 */
export function fromRow(row) {
  return {
    id: row.id,
    tmdbProviderId: row.tmdb_provider_id,
    nombre: row.nombre,
    logoPath: row.logo_path,
    urlHome: row.url_home,
    urlBusqueda: row.url_busqueda,
    activa: row.activa,
  };
}
```

#### `apps/api/src/repositories/plataforma.repository.js`

```js
import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import { PLATAFORMA_COLUMNS, fromRow } from '../models/plataforma.model.js';

/** @returns {Promise<import('../models/plataforma.model.js').Plataforma[]>} */
export async function listarActivas() {
  const { data, error } = await supabaseAdmin
    .from('plataforma')
    .select(PLATAFORMA_COLUMNS)
    .eq('activa', true)
    .order('nombre');

  if (error) {
    throw new DatabaseError(error);
  }
  return data.map(fromRow);
}
```

#### `apps/api/src/services/plataforma.service.js`

```js
import * as plataformaRepository from '../repositories/plataforma.repository.js';

/**
 * Plataformas que el usuario puede elegir como propias (E4HU4)
 * y que se muestran en los resultados.
 */
export async function listarPlataformasDisponibles() {
  return plataformaRepository.listarActivas();
}
```

#### `apps/api/src/controllers/plataforma.controller.js`

```js
import * as plataformaService from '../services/plataforma.service.js';

export async function listar(_req, res) {
  const plataformas = await plataformaService.listarPlataformasDisponibles();
  res.json({ data: plataformas });
}
```

#### `apps/api/src/routes/plataforma.routes.js`

```js
import { Router } from 'express';
import * as plataformaController from '../controllers/plataforma.controller.js';

export const plataformaRoutes = Router();

plataformaRoutes.get('/', plataformaController.listar);
```

#### `apps/api/src/controllers/region.controller.js`

```js
export function obtener(req, res) {
  res.json({ data: { region: req.region } });
}
```

#### `apps/api/src/routes/region.routes.js`

```js
import { Router } from 'express';
import * as regionController from '../controllers/region.controller.js';

export const regionRoutes = Router();

regionRoutes.get('/', regionController.obtener);
```

#### `apps/api/src/routes/index.js`

```js
import { Router } from 'express';
import { plataformaRoutes } from './plataforma.routes.js';
import { regionRoutes } from './region.routes.js';

export const routes = Router();

routes.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
routes.use('/plataformas', plataformaRoutes);
routes.use('/region', regionRoutes);
```

### 8.4. Integraciones y jobs programados

TMDB y Resend tienen un cliente básico listo. Streaming Availability y geoip quedan como stubs con la HU que los implementa. Los jobs se programan con `node-cron` dentro del proceso de la API y también se pueden correr a mano con `npm run job -w apps/api -- <nombre>`.

#### `apps/api/src/integrations/tmdb.integration.js`

```js
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const TIMEOUT_MS = 8000;

/**
 * Cliente genérico de TMDB. Las funciones específicas (buscar títulos, detalle,
 * proveedores por región) se agregan acá a medida que las HU las necesiten.
 * Requiere atribución visible a TMDB y JustWatch (E6HU3).
 *
 * @param {string} path Ej: '/search/multi'
 * @param {Record<string, string | number | undefined>} [params]
 */
export async function tmdbRequest(path, params = {}) {
  if (!env.TMDB_API_TOKEN) {
    throw new ExternalServiceError('TMDB', new Error('Falta configurar TMDB_API_TOKEN'));
  }

  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.TMDB_API_TOKEN}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError('TMDB', error);
  }

  if (!response.ok) {
    throw new ExternalServiceError('TMDB', new Error(`HTTP ${response.status} en ${path}`));
  }
  return response.json();
}
```

#### `apps/api/src/integrations/resend.integration.js`

```js
import { Resend } from 'resend';
import { env } from '../config/env.config.js';
import { ExternalServiceError } from '../errors/index.js';

let client;

function getClient() {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    throw new ExternalServiceError(
      'Resend',
      new Error('Falta configurar RESEND_API_KEY y RESEND_FROM'),
    );
  }
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

/**
 * @param {{ to: string, subject: string, html: string }} email
 * @returns {Promise<{ id: string }>}
 */
export async function sendEmail({ to, subject, html }) {
  const { data, error } = await getClient().emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new ExternalServiceError('Resend', error);
  }
  return data;
}
```

#### `apps/api/src/integrations/streamingAvailability.integration.js`

```js
/**
 * Streaming Availability API (Movie of the Night, vía RapidAPI).
 * Plan gratuito: 100 requests/día. NO consultar por cada búsqueda:
 * usar solo para enriquecer deep links y guardar el resultado en disponibilidad.deep_link.
 * TODO (E3HU1): implementar.
 */
export async function getDeepLinks() {
  throw new Error('No implementado: ver E3HU1');
}
```

#### `apps/api/src/integrations/geoip.integration.js`

```js
/**
 * Detección de país a partir de la IP del usuario.
 * TODO (E2HU1): implementar. Devolver null si no se puede determinar,
 * para que el middleware use DEFAULT_REGION.
 * @param {string} _ip
 * @returns {Promise<string | null>}
 */
export async function getRegionByIp(_ip) {
  return null;
}
```

#### `apps/api/src/jobs/index.js`

```js
import cron from 'node-cron';
import { syncAvailability } from './syncAvailability.job.js';
import { sendNotifications } from './sendNotifications.job.js';

const TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Jobs disponibles, también ejecutables a mano con `npm run job -w apps/api -- <nombre>`. */
export const jobs = {
  syncAvailability,
  sendNotifications,
};

async function runWithLogging(name) {
  const start = Date.now();
  try {
    await jobs[name]();
    console.info(`[jobs] ${name} terminó en ${Date.now() - start} ms`);
  } catch (error) {
    console.error(`[jobs] ${name} falló`, error);
  }
}

export function scheduleJobs() {
  const options = { timezone: TIMEZONE, noOverlap: true };

  // Todos los días a las 6:00
  cron.schedule('0 6 * * *', () => runWithLogging('syncAvailability'), options);
  // Cada hora: envía pendientes y reintenta fallidas
  cron.schedule('0 * * * *', () => runWithLogging('sendNotifications'), options);
}
```

#### `apps/api/src/jobs/run.js`

```js
import { jobs } from './index.js';

const name = process.argv[2];

if (!name || !(name in jobs)) {
  console.error(`Uso: npm run job -w apps/api -- <${Object.keys(jobs).join(' | ')}>`);
  process.exit(1);
}

await jobs[name]();
```

#### `apps/api/src/jobs/syncAvailability.job.js`

```js
/**
 * TODO (F5HU1): verificación diaria de disponibilidad.
 * 1. Registrar el inicio en la tabla sincronizacion.
 * 2. Para cada título con aviso activo en alguna watchlist, consultar disponibilidad por región.
 * 3. Hacer upsert en disponibilidad y generar las notificaciones pendientes.
 *    Los pasos que deben ser atómicos van en una función SQL llamada con .rpc().
 * 4. Registrar el fin (titulos_procesados, avisos_generados o error).
 * La lógica de negocio va en services/; este job solo la invoca.
 */
export async function syncAvailability() {
  console.warn('[jobs] syncAvailability todavía no está implementado (F5HU1)');
}
```

#### `apps/api/src/jobs/sendNotifications.job.js`

```js
/**
 * TODO (F5HU2): enviar por mail (integrations/resend.integration.js) las notificaciones
 * en estado 'pendiente' o 'fallida' con menos de N intentos.
 * Actualizar estado, intentos, ultimo_error y enviada_en.
 * El mail del usuario se obtiene con supabaseAdmin.auth.admin.getUserById().
 * La lógica de negocio va en services/; este job solo la invoca.
 */
export async function sendNotifications() {
  console.warn('[jobs] sendNotifications todavía no está implementado (F5HU2)');
}
```

### 8.5. Tests

Los tests no tocan Supabase: `vitest.config.js` carga variables ficticias y cada test mockea el repositorio.

#### `apps/api/src/app.test.js`

```js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('app', () => {
  it('GET /api/health responde ok', async () => {
    const response = await request(createApp()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });

  it('GET /api/region devuelve la región detectada', async () => {
    const response = await request(createApp()).get('/api/region');
    expect(response.body.data.region).toMatch(/^[A-Z]{2}$/);
  });

  it('una ruta inexistente responde 404 con formato de error estándar', async () => {
    const response = await request(createApp()).get('/api/no-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
```

#### `apps/api/src/routes/plataforma.routes.test.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import * as plataformaRepository from '../repositories/plataforma.repository.js';
import { DatabaseError } from '../errors/index.js';

vi.mock('../repositories/plataforma.repository.js', () => ({
  listarActivas: vi.fn(),
}));

const netflix = {
  id: 1,
  tmdbProviderId: 8,
  nombre: 'Netflix',
  logoPath: null,
  urlHome: 'https://www.netflix.com',
  urlBusqueda: null,
  activa: true,
};

describe('GET /api/plataformas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devuelve las plataformas activas', async () => {
    plataformaRepository.listarActivas.mockResolvedValue([netflix]);

    const response = await request(createApp()).get('/api/plataformas');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [netflix] });
  });

  it('responde 500 con formato de error estándar si falla la base', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    plataformaRepository.listarActivas.mockRejectedValue(new DatabaseError(new Error('caída')));

    const response = await request(createApp()).get('/api/plataformas');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('DATABASE');
  });
});
```

#### `apps/api/src/middlewares/validate.middleware.test.js`

```js
import { describe, it, expect, vi } from 'vitest';
import { busquedaSchema } from '@buscador/shared/schemas';
import { validate } from './validate.middleware.js';
import { ValidationError } from '../errors/index.js';

describe('validate', () => {
  it('deja los datos parseados en req.validated', () => {
    const req = { query: { q: '  Dune ', pagina: '2' } };
    const next = vi.fn();

    validate({ query: busquedaSchema })(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.validated.query).toEqual({ q: 'Dune', pagina: 2 });
  });

  it('pasa un ValidationError con el detalle por campo', () => {
    const req = { query: { q: '' } };
    const next = vi.fn();

    validate({ query: busquedaSchema })(req, {}, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details[0].field).toBe('q');
  });
});
```

---

## 9. Frontend (`apps/web`)

### 9.1. Base: Vite, estilos, enrutador y cliente de la API

El proxy de Vite hace que `/api` apunte a `localhost:3000`: front y API comparten origen, así que no hay CORS y las cookies de sesión funcionan sin configuración extra. El script en `index.html` aplica el tema antes del primer render para evitar el destello claro/oscuro.

#### `apps/web/package.json`

```json
{
  "name": "@buscador/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "jsdom": "^30.1.1",
    "tailwindcss": "^4.3.3",
    "vite": "^8.3.1",
    "vitest": "^5.0.2"
  },
  "dependencies": {
    "@buscador/shared": "*",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-router": "^8.4.0"
  }
}
```

#### `apps/web/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Front y API comparten origen en desarrollo: sin CORS y sin problemas de cookies.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

#### `apps/web/index.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Buscador Unificado de Streaming</title>
    <script>
      // Aplica el tema antes del primer render para evitar el destello claro/oscuro.
      // Debe usar la misma clave y lógica que contexts/theme/ThemeContext.js
      try {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) {
          document.documentElement.classList.add('dark');
        }
      } catch {
        // sin acceso a localStorage: queda el tema claro
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

#### `apps/web/src/styles.css`

```css
@import 'tailwindcss';

/* Modo oscuro por clase: ThemeProvider agrega/quita .dark en <html> */
@custom-variant dark (&:where(.dark, .dark *));

/*
 * Tokens de diseño. Definir acá colores, tipografías y espaciados propios
 * y usarlos como clases (bg-brand-600, text-brand-50...), nunca valores sueltos.
 */
@theme {
  --color-brand-50: oklch(0.97 0.02 280);
  --color-brand-500: oklch(0.6 0.2 280);
  --color-brand-600: oklch(0.52 0.21 280);
  --color-brand-700: oklch(0.45 0.19 280);
}
```

#### `apps/web/src/main.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ThemeProvider } from './contexts/theme/ThemeProvider.jsx';
import { SessionProvider } from './contexts/session/SessionProvider.jsx';
import { RegionProvider } from './contexts/region/RegionProvider.jsx';
import { router } from './app/router.js';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <RegionProvider>
          <RouterProvider router={router} />
        </RegionProvider>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
);
```

#### `apps/web/src/app/router.js`

```js
import { createBrowserRouter } from 'react-router';
import { MainLayout } from './MainLayout.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';
import { PaginaBusqueda } from '../features/busqueda/PaginaBusqueda.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: PaginaBusqueda },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
```

#### `apps/web/src/app/MainLayout.jsx`

```jsx
import { Link, Outlet } from 'react-router';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Attribution } from '../components/ui/Attribution.jsx';

export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Link to="/" className="font-semibold">
          Buscador Streaming
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <Attribution />
      </footer>
    </div>
  );
}
```

#### `apps/web/src/app/NotFoundPage.jsx`

```jsx
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <Link to="/" className="text-brand-600 underline dark:text-brand-500">
        Volver al inicio
      </Link>
    </section>
  );
}
```

#### `apps/web/src/features/busqueda/PaginaBusqueda.jsx`

```jsx
import { useRegion } from '../../contexts/region/RegionContext.js';

/** TODO (E1F1 / E1HU1 / E1HU2): buscador, filtros y resultados. */
export function PaginaBusqueda() {
  const { region } = useRegion();

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">¿Qué querés ver?</h1>
      <p className="text-gray-600 dark:text-gray-400">Mostrando disponibilidad para: {region}</p>
    </section>
  );
}
```

#### `apps/web/src/services/api.service.js`

```js
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Único punto de acceso del front a la API. Las cookies de sesión viajan solas
 * (mismo origen gracias al proxy de Vite). Devuelve `data` o lanza ApiError.
 *
 * @param {string} path Ej: '/plataformas'
 * @param {{ method?: string, body?: unknown, params?: Record<string, unknown> }} [options]
 */
export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const content = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: content?.error?.code ?? 'UNKNOWN',
      message: content?.error?.message ?? 'No se pudo completar la operación',
      details: content?.error?.details,
    });
  }
  return content?.data;
}
```

### 9.2. Contextos

Cada contexto se separa en dos archivos: `<Nombre>Context.js` (el contexto y su hook) y `<Nombre>Provider.jsx` (el componente). Esa separación es la que pide la regla de ESLint de Vite para que el recargado en caliente funcione bien.

#### `apps/web/src/contexts/theme/ThemeContext.js`

```js
import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'theme';

/** @typedef {'light' | 'dark'} Theme */

export const ThemeContext = createContext(null);

/** @returns {Theme} */
export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // sin acceso a localStorage
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** @returns {{ theme: Theme, toggleTheme: () => void }} */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  }
  return context;
}
```

#### `apps/web/src/contexts/theme/ThemeProvider.jsx`

```jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { THEME_STORAGE_KEY, ThemeContext, getInitialTheme } from './ThemeContext.js';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // sin acceso a localStorage: el tema no se recuerda, pero funciona
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

#### `apps/web/src/contexts/session/SessionContext.js`

```js
import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

/**
 * @returns {{
 *   user: { id: string, email: string } | null,
 *   loading: boolean,
 *   reloadSession: () => Promise<void>,
 * }}
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }
  return context;
}
```

#### `apps/web/src/contexts/session/SessionProvider.jsx`

```jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../../services/api.service.js';
import { SessionContext } from './SessionContext.js';

function fetchCurrentUser() {
  return request('/auth/session').catch(() => null);
}

/**
 * Mantiene el usuario autenticado. Los tokens viven en cookies httpOnly:
 * el front solo pregunta a la API quién es el usuario actual.
 * TODO (E4HU2): implementar GET /api/auth/session en el backend y agregar
 * signIn / signOut acá. Hasta entonces responde 404 y no hay sesión.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((currentUser) => {
      if (!cancelled) {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Para después de iniciar o cerrar sesión
  const reloadSession = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const value = useMemo(() => ({ user, loading, reloadSession }), [user, loading, reloadSession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
```

#### `apps/web/src/contexts/region/RegionContext.js`

```js
import { createContext, useContext } from 'react';

export const RegionContext = createContext(null);

/** @returns {{ region: string, loading: boolean }} */
export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion debe usarse dentro de <RegionProvider>');
  }
  return context;
}
```

#### `apps/web/src/contexts/region/RegionProvider.jsx`

```jsx
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REGION } from '@buscador/shared/constants';
import { request } from '../../services/api.service.js';
import { RegionContext } from './RegionContext.js';

/** Región detectada por la API (E2HU1). Mientras carga, usa la región por defecto. */
export function RegionProvider({ children }) {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    request('/region')
      .then((data) => {
        if (!cancelled) {
          setRegion(data.region);
        }
      })
      .catch(() => {
        // si falla, queda la región por defecto
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ region, loading }), [region, loading]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}
```

### 9.3. Componentes

#### `apps/web/src/components/ui/ThemeToggle.jsx`

```jsx
import { useTheme } from '../../contexts/theme/ThemeContext.js';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {isDark ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );
}
```

#### `apps/web/src/components/ui/Attribution.jsx`

```jsx
/**
 * Atribución obligatoria por los términos de uso de TMDB y JustWatch (E6HU3).
 * No quitar: su ausencia puede derivar en la revocación del acceso a la API.
 */
export function Attribution() {
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Datos de títulos provistos por{' '}
      <a href="https://www.themoviedb.org" className="underline" target="_blank" rel="noreferrer">
        TMDB
      </a>
      . Datos de disponibilidad provistos por{' '}
      <a href="https://www.justwatch.com" className="underline" target="_blank" rel="noreferrer">
        JustWatch
      </a>
      . Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
    </p>
  );
}
```

### 9.4. Tests

#### `apps/web/src/test/setup.js`

```js
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
```

#### `apps/web/src/contexts/theme/ThemeProvider.test.jsx`

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from './ThemeProvider.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  it('arranca en modo claro si no hay preferencia guardada', () => {
    renderWithTheme();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Activar modo oscuro' })).toBeInTheDocument();
  });

  it('alterna a modo oscuro y lo recuerda', () => {
    renderWithTheme();

    fireEvent.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('respeta la preferencia guardada', () => {
    localStorage.setItem('theme', 'dark');
    renderWithTheme();
    expect(document.documentElement).toHaveClass('dark');
  });
});
```

---

## 10. Base de datos (`supabase/`)

Regla principal: **el esquema solo se cambia con una migración nueva**. Nunca desde el dashboard y nunca editando una migración ya mergeada. Para crear una: `npm run db:new-migration -- nombre_descriptivo` y escribir el SQL. Nadie la aplica a mano: el CI la prueba en el PR y la aplica al mergear a `main`.

#### `supabase/migrations/20260927000000_initial_schema.sql`

```sql
-- =====================================================================
-- Esquema inicial - Buscador Unificado de Streaming
-- Basado en db-inicial.txt, con estas correcciones:
--   * Enums explícitos (antes figuraban como USER-DEFINED).
--   * region como char(2) con CHECK (character sin largo equivale a char(1)).
--   * UNIQUE (tmdb_id, tipo) en titulo: necesario para el upsert de la sincronización.
--   * UNIQUE (usuario_id, titulo_id) en watchlist_item y columna aviso_activo.
--   * ON DELETE CASCADE desde auth.users hacia los datos del usuario (E4HU7).
--   * Trigger que crea el perfil al registrarse un usuario (mail o Google).
--   * RLS habilitado en todas las tablas: la API REST de Supabase queda
--     bloqueada; el backend usa la clave secreta, que ignora RLS.
-- =====================================================================

-- ---------- Tipos ----------

create type public.tipo_titulo as enum ('pelicula', 'serie');

create type public.tipo_oferta as enum ('suscripcion', 'gratis', 'con_anuncios', 'alquiler', 'compra');

create type public.estado_notificacion as enum ('pendiente', 'enviada', 'fallida');

-- ---------- Catálogos ----------

create table public.fuente_datos (
  id smallint generated always as identity primary key,
  nombre varchar not null unique,
  url varchar not null,
  texto_atribucion varchar not null,
  logo_url varchar
);

create table public.plataforma (
  id integer generated always as identity primary key,
  tmdb_provider_id integer not null unique,
  nombre varchar not null,
  logo_path varchar,
  url_home varchar,
  url_busqueda varchar,
  activa boolean not null default true
);

create table public.titulo (
  id bigint generated always as identity primary key,
  tmdb_id integer not null,
  tipo public.tipo_titulo not null,
  nombre varchar not null,
  anio smallint,
  sinopsis text,
  poster_path varchar,
  puntuacion numeric check (puntuacion between 0 and 10),
  actualizado_en timestamptz not null default now(),
  constraint titulo_tmdb_id_tipo_key unique (tmdb_id, tipo)
);

create table public.disponibilidad (
  titulo_id bigint not null references public.titulo (id) on delete cascade,
  plataforma_id integer not null references public.plataforma (id),
  region char(2) not null check (region ~ '^[A-Z]{2}$'),
  tipo_oferta public.tipo_oferta not null,
  deep_link varchar,
  fuente_id smallint not null references public.fuente_datos (id),
  detectada_en timestamptz not null default now(),
  verificada_en timestamptz not null default now(),
  vigente boolean not null default true,
  primary key (titulo_id, plataforma_id, region, tipo_oferta)
);

create index disponibilidad_plataforma_region_idx
  on public.disponibilidad (plataforma_id, region)
  where vigente;

-- ---------- Datos de usuario ----------

create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  region char(2) check (region ~ '^[A-Z]{2}$'),
  creado_en timestamptz not null default now()
);

create table public.usuario_plataforma (
  usuario_id uuid not null references public.perfil (id) on delete cascade,
  plataforma_id integer not null references public.plataforma (id),
  agregada_en timestamptz not null default now(),
  primary key (usuario_id, plataforma_id)
);

create table public.watchlist_item (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfil (id) on delete cascade,
  titulo_id bigint not null references public.titulo (id),
  aviso_activo boolean not null default false,
  agregado_en timestamptz not null default now(),
  constraint watchlist_item_usuario_titulo_key unique (usuario_id, titulo_id)
);

-- La sincronización busca qué títulos tienen avisos activos
create index watchlist_item_aviso_activo_idx
  on public.watchlist_item (titulo_id)
  where aviso_activo;

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
  enviada_en timestamptz
);

-- La tarea de envío procesa pendientes y fallidas
create index notificacion_por_enviar_idx
  on public.notificacion (creada_en)
  where estado <> 'enviada';

-- ---------- Registro de procesos ----------

create table public.sincronizacion (
  id bigint generated always as identity primary key,
  iniciada_en timestamptz not null default now(),
  finalizada_en timestamptz,
  titulos_procesados integer not null default 0,
  avisos_generados integer not null default 0,
  error text
);

-- ---------- Perfil automático al registrarse ----------

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

-- ---------- RLS: sin políticas = sin acceso por la API REST ----------

alter table public.fuente_datos enable row level security;
alter table public.plataforma enable row level security;
alter table public.titulo enable row level security;
alter table public.disponibilidad enable row level security;
alter table public.perfil enable row level security;
alter table public.usuario_plataforma enable row level security;
alter table public.watchlist_item enable row level security;
alter table public.notificacion enable row level security;
alter table public.sincronizacion enable row level security;
```

#### `supabase/seed.sql`

```sql
-- Datos iniciales. Idempotente: se puede correr más de una vez.

insert into public.fuente_datos (nombre, url, texto_atribucion) values
  ('TMDB', 'https://www.themoviedb.org',
   'Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.'),
  ('JustWatch', 'https://www.justwatch.com',
   'Datos de disponibilidad provistos por JustWatch.'),
  ('Streaming Availability', 'https://www.movieofthenight.com/about/api',
   'Enlaces provistos por Streaming Availability API (Movie of the Night).')
on conflict (nombre) do nothing;

-- tmdb_provider_id: verificar contra GET /watch/providers/movie?watch_region=AR
-- url_busqueda queda en NULL hasta completar el relevamiento de deep links por plataforma.
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
```

---

## 11. CI, template de PR y README

`ci.yml` corre en cada PR: valida los mensajes de commit (por si alguien usó `--no-verify`), lint, formato, tests y build, y prueba las migraciones en una base temporal. Si algo falla, el PR no debería mergearse. `migraciones.yml` aplica las migraciones a la base compartida al mergear a `main`.

Los dos workflows no se pudieron ejecutar al armar esta propuesta (necesitan GitHub Actions, Docker y los secretos). Conviene mirar con atención la primera ejecución de cada uno.

#### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verificar:
    name: Lint, formato, tests y build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      # Node 22 trae npm 10 y el proyecto exige npm >= 11
      - name: Actualizar npm
        run: npm install -g npm@11

      - run: npm ci

      # Los hooks locales se pueden saltear con --no-verify; el CI no
      - name: Validar mensajes de commit
        if: github.event_name == 'pull_request'
        run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose

      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build

  migraciones:
    name: Migraciones en una base temporal
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Actualizar npm
        run: npm install -g npm@11

      - run: npm ci

      # Levanta un Postgres de Supabase descartable (los runners de GitHub tienen Docker)
      # y aplica todas las migraciones y el seed desde cero. Si una migración tiene un
      # error, el PR falla acá y no llega nunca a la base compartida.
      - name: Levantar base temporal
        run: npx supabase db start

      - name: Aplicar migraciones y seed desde cero
        run: npx supabase db reset
```

#### `.github/workflows/migraciones.yml`

```yaml
name: Migraciones

# Aplica las migraciones a la base compartida. Es el ÚNICO camino por el que
# cambia el esquema: nadie corre `supabase db push` a mano.
on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'
      - 'supabase/seed.sql'
  workflow_dispatch:

# Nunca dos ejecuciones en paralelo sobre la misma base
concurrency:
  group: migraciones
  cancel-in-progress: false

jobs:
  aplicar:
    name: Aplicar migraciones a la base compartida
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Actualizar npm
        run: npm install -g npm@11

      - run: npm ci

      - name: Vincular el proyecto de Supabase
        run: npx supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"

      - name: Ver qué se va a aplicar
        run: npx supabase db push --dry-run --include-all --password "$SUPABASE_DB_PASSWORD"

      # --include-all: si dos PRs con migraciones se mergean en distinto orden que
      # sus timestamps, aplica igual la que quedó "atrás".
      - name: Aplicar
        run: npx supabase db push --include-all --include-seed --password "$SUPABASE_DB_PASSWORD"
```

#### `.github/pull_request_template.md`

```markdown
## Historia de usuario

Closes #

## Qué cambia

<!-- Resumen en 2 o 3 líneas -->

## Cómo probarlo

1.

## Checklist (DoD)

- [ ] Cumple los criterios de aceptación de la HU
- [ ] `npm run check` pasa localmente
- [ ] Agregué o actualicé tests
- [ ] Si cambié el esquema: la migración está en su propio PR, es compatible con el código de `main` y no la apliqué a mano
- [ ] Si agregué variables de entorno, actualicé `apps/api/.env.example`
- [ ] Si hay cambios visuales, adjunto capturas en modo claro y oscuro, en celular y en escritorio
```

#### `README.md`

````markdown
# Buscador Unificado de Streaming

Encontrá en qué plataforma está una película o serie en tu región y andá directo a verla.

## Requisitos

- Node >= 22.22 y npm >= 11 (`nvm install 22 && npm install -g npm@11`)
- Las claves del proyecto compartido de Supabase (pedirlas a quien administra el proyecto)

## Puesta en marcha

```bash
npm install
cp apps/api/.env.example apps/api/.env   # completar con las claves del proyecto compartido
npm run dev                                # API en :3000, web en :5173
```

La base ya tiene las migraciones aplicadas. Nadie aplica migraciones a mano: lo hace el CI al mergear a `main` (ver AGENTS.md).

Las convenciones del proyecto están en [AGENTS.md](./AGENTS.md).
````
