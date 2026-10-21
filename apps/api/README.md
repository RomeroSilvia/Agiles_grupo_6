# apps/api

Backend: Express 5 con capas modelo / repositorio / servicio / controlador / middleware.

Las convenciones están en [AGENTS.md](../../AGENTS.md).

## Jobs

La API registra la sincronización de disponibilidad todos los días a las 03:00, hora de
Argentina, solo cuando `NODE_CRON_RUN=true`. Por defecto queda deshabilitada. En el despliegue,
habilitarla en una sola instancia dedicada. Para ejecutarla manualmente desde la raíz, usar
`npm run job -w apps/api -- syncAvailability`.

El job requiere `STREAMING_AVAILABILITY_API_KEY`, consulta como máximo 100 combinaciones de
título y región por día UTC y guarda los snapshots en disponibilidad. Si hay más
combinaciones, las reparte entre ejecuciones para respetar el límite del proveedor.
Las búsquedas del catálogo consultan TMDB; el detalle puede consultar Streaming Availability
cuando necesita obtener un deep link. Las consultas del job y del detalle comparten el cupo
diario de 100 requests y reservan cada llamada antes de contactar al proveedor. Los deep links
guardados en la base o en caché no consumen requests adicionales.
