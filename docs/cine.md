# Cine en Argentina

## Próximos estrenos (#73)

`GET /api/cartelera/estrenos` consulta Upcoming AR y Discover Movie de TMDB,
verifica fechas regionales AR de tipo 2/3 y ordena por fecha e ID antes de paginar
de a 20. Predeterminado: mañana en Buenos Aires y 90 días inclusivos. El año
pertenece a la obra original, incluso en reestrenos. La ventana publicada por
Upcoming se valida; no confirma por sí sola un anuncio argentino.

Presupuesto por adquisición: 10 páginas entre ambas operaciones y 200 películas
únicas; excederlo o fallar una página produce 502, sin publicar totales parciales.
La caché por período dura una hora (40 períodos); las fechas por película reutilizan
la caché TMDB existente y su limitador de 8 solicitudes concurrentes.

No se confirmó una fuente TMDB de anuncios argentinos sin fecha. El contrato y la
UI admiten «Fecha pendiente de confirmación», pero no se generan esos registros
en producción sin evidencia. La aceptación con datos reales del escenario 2 de
#73 sigue pendiente. No se sustituye por fechas mundiales ni por otra fuente.

Fuentes: [Upcoming](https://developer.themoviedb.org/reference/movie-upcoming-list),
[Discover Movie](https://developer.themoviedb.org/reference/discover-movie),
[Release Dates](https://developer.themoviedb.org/reference/movie-release-dates).
Se conservan las atribuciones TMDB/JustWatch. No hay garantía de exhaustividad ni
frecuencia de actualización del catálogo.
