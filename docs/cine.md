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

## Ciudades (#74)

Se reutilizan el directorio C2, endpoint público estricto y Context que ya estaban
en esta rama. El selector se conecta a las dos vistas de cartelera y conserva el
ID en sessionStorage; no modifica país de streaming ni perfil. Cada mapeo exige
evidencia de su propio proveedor. La procedencia S1 comparte esquema con cartelera.

El 14/11/2026 se hicieron consultas SerpApi acotadas con Resident Evil (TMDB
1423191), tomado de Now Playing AR, en Buenos Aires/CABA, La Plata y Córdoba.
Respondieron HTTP 200/Success sin `showtimes`. Ver
[muestras sanitizadas](evidencia/serpapi-2026-11-14.json), con fecha y parámetros;
se excluyeron claves, URLs de búsqueda autenticadas y contenido ajeno a horarios.
Hubo cuatro búsquedas en total: se repitió Córdoba para corregir la codificación
del nombre en el shell. No se automatizan comprobaciones que gasten cupo.

No se habilitaron ciudades: una respuesta sin estructura no demuestra ausencia
de exhibición ni cobertura. El directorio revisado está configurado y vacío;
responde 200 con «No hay información de ciudades disponible». Si se elimina la
configuración o es inválida devuelve 502. Los IDs y mapeos de futuras entradas
deben asignarse una vez y acompañarse de evidencia de cine/municipio/provincia y
zona IANA; las muestras no se convierten en ciudades productivas. La habilitación
real de #74/#75 sigue pendiente de evidencia representativa.
