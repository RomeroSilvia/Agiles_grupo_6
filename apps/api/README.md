# apps/api

Backend: Express 5 con capas modelo / repositorio / servicio / controlador / middleware.

Las convenciones están en [AGENTS.md](../../AGENTS.md).

## Jobs

La API registra la sincronización de disponibilidad todos los días a las 03:00, hora de
Argentina. Para ejecutarla manualmente desde la raíz, usar npm run job -w apps/api -- syncAvailability.

El job requiere STREAMING_AVAILABILITY_API_KEY, consulta como máximo 100 combinaciones de
título y región por día UTC y guarda los snapshots en disponibilidad. Si hay más combinaciones,
las reparte entre ejecuciones para respetar el límite del proveedor. Las búsquedas interactivas
siguen consultando TMDB y no llaman a Streaming Availability.
