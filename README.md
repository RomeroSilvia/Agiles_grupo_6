# STREAMLY

Proyecto desarrollado para la cursada 2026 de Metodologías Ágiles, UTN-FRLP.

## Integrantes - Grupo N° 6

- Sofia Lara Goszko
- Silvia Romero
- Pablo Rella
- Joaquin Montes
- Pedro Fiuza

## ¿Qué es?

Un buscador unificado que permite encontrar cualquier película o serie y saber, en un solo lugar, en qué plataforma de streaming está disponible según la región geográfica del usuario, con redireccionamiento directo a esa plataforma para empezar a ver el contenido.

## ¿Para quién?

Consumidores habituales de streaming que tienen 2 o más suscripciones activas (Netflix, Disney+, HBO Max, Prime Video, etc.) y que experimentan fricción real al decidir qué ver: saltan entre apps, no recuerdan en cuál tienen un título, o se topan con bloqueos regionales inesperados.

## Requisitos

- Node >= 22.23.2 y npm >= 11

## Puesta en marcha

```bash
npm install
npm run dev     # API en :3000 y web en :5173
npm run check   # lint + formato + tests
```

Copiar `apps/api/.env.example` como `apps/api/.env` y completar las claves de Supabase (las pasa quien administra el proyecto) y `TMDB_API_KEY`.

## Estructura

Monorepo con npm workspaces, en JavaScript (sin TypeScript).

```
apps/
  api/        Express 5: routes → controllers → services → repositories / integrations
  web/        React 19 + Vite + Tailwind CSS v4, organizado por funcionalidad (features/)
packages/
  shared/     Esquemas Zod y constantes que usan la API y la web
supabase/
  migrations/ Esquema de la base
```

- Los datos viven en Supabase y solo la API accede a ellos; la web habla únicamente con la API.
- Catálogo y disponibilidad: TMDB (con datos de JustWatch).
- Las convenciones del proyecto (capas, nombres, idioma, commits) están en [AGENTS.md](./AGENTS.md).

## Endpoints

Todas las rutas empiezan con `/api`. Las respuestas exitosas tienen la forma `{ "data": ... }` y los errores `{ "error": { "code", "message" } }`.

La pantalla de detalle también muestra la disponibilidad de TMDB/JustWatch para la región del usuario.
La API expone `GET /api/region`, que consulta la IP desde el backend y devuelve
`{ data: { region, source } }`. Para usuarios autenticados reutiliza `perfil.region`; si aún está
vacío, guarda el país detectado. El servicio de país usado es `https://api.country.is` y no
requiere una clave nueva. Si no se puede detectar, devuelve `DEFAULT_REGION` con
`source: "default"` y la pantalla lo indica. En desarrollo local, la IP suele ser local y se
aplica ese respaldo. Si la API corre detrás de un proxy, configurar `TRUST_PROXY` en
`apps/api/.env` con las IPs o subredes CIDR de los proxies de confianza, separadas por comas.
Debe configurarse antes de registrar usuarios: la primera región detectada se guarda en el perfil.
Las IPs privadas o reservadas no se envían al servicio de país. `true` y `1` no son valores
válidos para `TRUST_PROXY`.

`GET /api/titulos/:tipo/:tmdbId/disponibilidad?region=BR` consulta la disponibilidad del país
indicado por el contexto de región y devuelve `{ region, ofertas, enlaceTmdb }`. Cada oferta agrupa
las plataformas activas por modalidad (`suscripcion`, `gratis` o `con_anuncios`); `enlaceTmdb` es
`null` cuando TMDB no informa un enlace para esa región. La ficha muestra las modalidades y el
enlace de TMDB cuando está disponible. Las tarjetas llevan al sitio de cada plataforma; los deep
links directos al título y la watchlist todavía no están implementados.

| Método | Ruta                                    | Sesión | Descripción                                                                  |
| ------ | --------------------------------------- | :----: | ---------------------------------------------------------------------------- |
| GET    | `/health`                               |        | Estado de la API                                                             |
| POST   | `/auth/sign-up`                         |        | Registro con mail y contraseña                                               |
| POST   | `/auth/sign-in`                         |        | Inicio de sesión (la sesión viaja en cookies httpOnly)                       |
| POST   | `/auth/sign-out`                        |        | Cierre de sesión                                                             |
| GET    | `/auth/session`                         |        | Usuario de la sesión actual, o `null`                                        |
| GET    | `/region`                               |        | Región detectada del usuario                                                 |
| GET    | `/busqueda`                             |        | Busca películas y series. Query: `q` (obligatorio), `tipo`, `anio`, `pagina` |
| GET    | `/busqueda/propias`                     |   si   | Misma búsqueda, solo con lo disponible en las plataformas del usuario        |
| GET    | `/titulos/:tipo/:tmdbId`                |        | Detalle de una película o serie (`tipo`: `pelicula` o `serie`)               |
| GET    | `/titulos/:tipo/:tmdbId/disponibilidad` |        | Plataformas activas por modalidad y enlace de TMDB para la región indicada   |
| GET    | `/plataformas`                          |        | Catálogo de plataformas activas                                              |
| GET    | `/plataformas/propias`                  |   si   | Ids de las plataformas que eligió el usuario                                 |
| PUT    | `/plataformas/propias/:plataformaId`    |   si   | Agrega una plataforma propia                                                 |
| DELETE | `/plataformas/propias/:plataformaId`    |   si   | Quita una plataforma propia                                                  |

Los endpoints con sesión responden `401` (`UNAUTHENTICATED`) si no hay un usuario logueado.
