# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Las convenciones, el stack y las reglas de capas están en `AGENTS.md` (importado arriba) y mandan sobre este archivo. Acá va solo lo que complementa.

## Comandos que no están en AGENTS.md

- Un solo archivo de test: `npm test -w apps/api -- src/routes/busqueda.routes.test.js` (igual con `apps/web`). Agregar `-t "<descripción>"` para un solo caso.
- `npm run check` no compila. El CI además corre `npm run build` y valida los mensajes de commit con commitlint; correr `npm run build` si se tocó el front o `packages/shared`.
- `npm run job -w apps/api` todavía no existe: no hay carpeta `jobs/` ni script `job` en `apps/api/package.json`.
- Hooks de husky: `pre-commit` corre prettier sobre lo staged (lint-staged) y `commit-msg` corre commitlint (tipos `feat|fix|chore|refactor|docs|test`, encabezado de hasta 100 caracteres).

## Cómo encaja todo

- **Front ↔ API**: Vite hace proxy de `/api` a `http://localhost:3000`, así las cookies de sesión son del mismo origen. `request()` de `apps/web/src/services/api.service.js` devuelve `data` o lanza `ApiError` con `status`, `code` y `message` (`code: 'NETWORK'` si no hubo respuesta). Las pantallas deciden según `error.code`.
- **Sesión**: `loadSession` deja `req.user` (`{ id, email }` o `null`) sin cortar el request y, si el access token venció, lo renueva con el refresh token y reescribe las cookies. Para exigir sesión, montar `requireSession` después de `loadSession` en la ruta.
- **Región**: `detectRegion` se monta solo en las rutas que la necesitan (`/api/region` y la búsqueda en plataformas propias), después de `loadSession`. `regionService.obtenerRegion` detecta la región por IP con `geoip.integration.js`, haya sesión o no; con sesión, la guarda en el perfil si cambió (los avisos de la watchlist usan `perfil.region`). Si no puede detectarla, usa la del perfil si hay sesión y, si no, `env.DEFAULT_REGION`. Deja `req.region` y `req.regionSource`.
- **Providers del front**: `Theme → Session → Region → PlataformasPropias → Router`, en ese orden en `main.jsx`. Un provider nuevo se agrega también en `apps/web/src/test/renderRoute.jsx`.
- **Rutas del front**: los paths salen de `RUTAS` en `apps/web/src/app/rutas.js`. Las pantallas que exigen sesión van como hijas del `SoloConSesion` de `app/router.js`, como `/mis-plataformas` y `/perfil`.
- **Header**: el avatar (`app/MenuUsuario.jsx`, armado con `DropdownMenu` y `DropdownMenuItem` de `components/ui/`) es el único lugar con «Cerrar sesión». Los links de la nav y del menú hamburguesa salen de `ENLACES` en `MainLayout.jsx`. En los tests, la sesión iniciada se reconoce por el botón «Menú de la cuenta de {mail}».
- **Plataformas propias**: el listado editable es `features/plataformas/ListaPlataformas.jsx` y lo usan `/mis-plataformas` y el perfil. No duplicarlo: el estado vive en `PlataformasPropiasProvider` y los cambios se ven en todas las pantallas.
- **Perfil**: no tiene endpoint propio. El mail sale de `useSession()` y la región de `useRegion()`. Las acciones de cuenta están en `ACCIONES_CUENTA` de `features/perfil/perfil.constants.js` y llevan a cada sección de `/perfil/cuenta` (`rutaSeccionCuenta` de `app/rutas.js`).
- **Cuenta (#50)**: los endpoints están en `auth.routes.js` y la lógica en `cuenta.service.js`. Los tokens de los enlaces los genera y verifica Supabase (`generateLink` / `verifyOtp`); los mails los arma `email.service.js` con las plantillas de `emails/`. Los enlaces llevan el token en el fragmento (`#token=`) y la web lo lee con `useLinkToken`. Eliminar la cuenta es un borrado físico: las tablas del usuario se borran en cascada desde `auth.users`. En el proyecto de Supabase, «Email OTP Expiration» tiene que coincidir con `MINUTOS_VENCIMIENTO_ENLACE` y «Secure email change» tiene que estar apagado.

## Marca y assets del front

- El nombre de la app sale de `APP_NAME` en `apps/web/src/config/app.config.js`; no escribir "Streamly" a mano (las mayúsculas van con la clase `uppercase`). La única excepción es el `<title>` de `apps/web/index.html`, que es HTML estático.
- Los íconos se importan solo desde `components/ui/icons.jsx`, que adapta los de `lucide-react` (decorativos, `size-5` por defecto). Para sumar uno, agregar ahí un `createIcon(...)`; no importar `lucide-react` directo.
- Los botones de acción usan `components/ui/Button.jsx` con `variant`, `size` y `fullWidth`; los que son solo un ícono, `IconButton.jsx`; y los que se ven como enlace, `TextButton.jsx`. No repetir clases de botón en `features/`. Para cambiar ancho o padding, usar esas props y no clases en `className`, porque dos clases de Tailwind que se contradicen no se pisan.
- El logo es `components/ui/Logo.jsx` (ícono `src/assets/logo-s.svg` + nombre). Para enlazarlo al inicio usar `components/ui/LogoInicio.jsx` y pasarle el anillo de foco por `className`.
- `apps/web/public/` es para archivos que se sirven tal cual, como `favicon.ico` (tamaños de 16, 32 y 48 px). Las imágenes que importa el código van en `src/assets/` y las del README, en `docs/`. Antes de subirlas, achicarlas y comprimirlas.

## Helpers de test existentes

- API: `apps/api/src/test/queryBuilderMock.js` (`mockearConsulta`, `SIN_DATOS`, `FALLO`) simula el query builder de supabase-js para los tests de repositories; `apps/api/src/test/fixtures.js` tiene datos de ejemplo. Los tests de rutas usan `createApp()` con supertest y mockean repositories o integrations.
- Web: `renderRoute(path)` de `apps/web/src/test/renderRoute.jsx` renderiza la app completa en una ruta con todos los providers; `fetch` se mockea en cada test con `vi.stubGlobal('fetch', ...)`.

## Flujo de trabajo

- Las guías del equipo están en `docs/`: [flujo de trabajo con git](docs/flujo-de-trabajo-git/README.md) (ramas, PRs, revisión, CI y migraciones) y [guía de commits](docs/guia-de-commits/README.md).
- Cada PR lo revisa una sola persona. Esa persona aprueba y mergea apenas el CI está en verde y la rama está al día con `main`. La rama no se borra.

## Entorno local

- `apps/api/.env` se arma copiando `apps/api/.env.example`; `TMDB_API_KEY` es necesaria para la búsqueda y el detalle. La API la carga sola con `--env-file-if-exists`.
- El repo se trabaja en Windows: usar rutas con `/` en los comandos y no depender de herramientas que solo existen en Unix dentro de los scripts de npm.
