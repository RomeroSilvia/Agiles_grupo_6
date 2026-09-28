# AGENTS.md — STREAMLY

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
