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
npm run dev
npm run check
```

Para habilitar la búsqueda, copiar `apps/api/.env.example` como `apps/api/.env` y completar
`TMDB_API_KEY`. El servidor carga ese archivo automáticamente en desarrollo.

## Búsqueda

La API expone `GET /api/busqueda` con estos parámetros:

- `q`: título obligatorio.
- `tipo`: `pelicula` o `serie`.
- `anio`: año entre 1888 y 2100.
- `pagina`: página de resultados, opcional; por defecto es `1`.

La respuesta contiene resultados resumidos con título, tipo, año, póster y puntuación.

## Detalle de títulos

La API expone `GET /api/titulos/:tipo/:tmdbId` para consultar el detalle de una película o
serie. `tipo` puede ser `pelicula` o `serie`, y `tmdbId` es el identificador numérico de TMDB.
La respuesta contiene `{ data: ... }` con nombre, sinopsis, póster, año y puntuación. Si TMDB no
encuentra el título, la API responde `404` con el código `NOT_FOUND`.

La pantalla de detalle también muestra la disponibilidad de TMDB/JustWatch para la región del usuario.
La API expone `GET /api/region`, que consulta la IP desde el backend y devuelve
`{ data: { region, source } }`. Para usuarios autenticados reutiliza `perfil.region`; si aún está
vacío, guarda el país detectado. El servicio de país usado es `https://api.country.is` y no
requiere una clave nueva. Si no se puede detectar, devuelve `DEFAULT_REGION` con
`source: "default"` y la pantalla lo indica. En desarrollo local, la IP suele ser local y se
aplica ese respaldo. Si la API corre detrás de un proxy, configurar `TRUST_PROXY` en
`apps/api/.env` con la IP o subred del proxy de confianza.

`GET /api/titulos/:tipo/:tmdbId/disponibilidad?region=BR` consulta la disponibilidad del país
indicado por el contexto de región. La página de detalle ofrece el enlace de TMDB cuando
está disponible. Los deep links directos a las plataformas y la watchlist todavía no están implementados.

Los tokens visuales basados en el Figma están definidos en
`apps/web/src/styles.css` y contemplan los modos claro y oscuro.

Las convenciones del proyecto están en [AGENTS.md](./AGENTS.md).
