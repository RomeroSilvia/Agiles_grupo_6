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

## Funciones (#75)

Única ruta: `GET /api/cartelera/peliculas/:tmdbId/funciones?ciudadId=ar:<UUID>`.
Es pública y estricta; no acepta fecha, cine, país ni URLs. El detalle de películas
ofrece una consulta explícita; los cambios de ciudad después de consultar cancelan
la solicitud previa y vuelven a consultar. Las series no muestran esta sección.
La ciudad se valida antes de cualquier integración; TMDB confirma que la obra existe.

F1 entrega todos los registros normalizados, sin páginas, entre hoy local y los
próximos siete días inclusive. Se excluyen funciones pasadas aun al leer caché.
Los IDs son SHA-256 de lugares estables revisados y de los hechos de la función;
no dependen de índices, URL ni descarga. Se conservan fuentes de coincidencias y
los descartes quedan en diagnósticos internos sin contenido de upstream ni claves.
Las observaciones sin correspondencia verificable de película/cine se descartan
con advertencias. Nunca se adjudica un horario al TMDB ID solo por la consulta.

Los registros revisados se agregan a `LUGARES_CINE` y
`CORRESPONDENCIAS_PELICULAS_CINE` en `funcionesCine.config.js`:

- Lugar: `{clave, ciudadId, nombre, direccion, evidencia, fuentes:[{fuenteId,
registroId, nombre, direccion}]}`. `clave` es permanente entre fuentes; las
  direcciones y el municipio deben estar comprobados. Sin ID nativo se exige
  nombre y dirección completa coincidentes, nunca solo nombre.
- Película: `{fuenteId, registroId, nombre, tmdbId, evidencia}`. El ID del proveedor
  requiere revisión independiente; el título debe coincidir. Si no hay ID,
  únicamente se admite una correspondencia de nombre revisada e inequívoca.
  Google sin título/identidad comprobable queda incompleto, aunque tenga horarios.

SerpApi conserva la estructura documentada por días/establecimientos; la variante
por películas sin identificación de cine se declara incompleta. No extrae horarios
de snippets. Días relativos y fechas sin año se resuelven únicamente en la ventana
de ocho fechas y deben concordar con el día de semana. Google no se usa como sitio
oficial ni enlace de compra.

Butaca usa un adaptador ESM anónimo basado en el código revisado (commit
`595f908f3092e423b27839c650e2eae248e2b256`), con [licencia MIT](licenses/butaca.txt).
Solo permite GET a cines, películas y horarios del BFF de Cinemark, header
`country: AR`, y corresponde películas por `corporateId`, nunca `movie.id`.
El `Z` del `sessionDateTime` bruto representa componentes locales según ese contrato;
se contrasta con `sessionDisplayDate` civil y se emite un offset IANA coherente.
No consulta asientos, inventario ni órdenes. No requiere API key. Sigue desactivado:
`BUTACA_ENABLED=true` requiere además `BUTACA_VERIFICADO=true` en configuración,
con permiso/viabilidad y mapeos previamente revisados. La licencia del código no
prueba permiso sobre los datos subyacentes. No se hicieron lecturas reales a ese
BFF para eludir este requisito.

La normalización no mezcla horarios/versiones incompatibles: Butaca tiene prioridad
en coincidencias revisadas de Cinemark; discrepancias y candidatos secundarios
ambiguos generan advertencias, preservando procedencia. Dos salas simultáneas
con datos distintos siguen siendo funciones distintas.

Cachés por proceso/película/ciudad/día/versión: SerpApi una hora, Butaca quince
minutos, 100 entradas por proveedor y promesas compartidas. Máximo dos consultas
de proveedores concurrentes, cinco solicitudes por minuto y cliente, 1.000
funciones por respuesta (truncamiento explícito). Presupuesto SerpApi conservador
por proceso: 250/mes UTC y 50/hora; 429/cupo externo detiene nuevas consultas hasta
el siguiente mes, sin reintento automático. La cuenta externa es la autoridad;
con reinicios o varias instancias esto no equivale a una cuota distribuida.
No hay precarga, cron, renovación de pago ni persistencia en Supabase.

Sin fuentes habilitables o si todas fallan: 502. Una fuente parcial o caída con
otra respuesta útil conserva resultados e informa `incompleta`, incluso ante
cuota agotada. `sin_funciones` solo corresponde a una respuesta estructurada vacía;
no significa «no se exhibe». `sin_cobertura` identifica una ciudad conocida cuyo
directorio lo indique. Las muestras reales actuales no habilitan datos productivos.

Referencias: [Showtimes](https://serpapi.com/showtimes-results),
[parámetros SerpApi](https://serpapi.com/search-api), [términos](https://serpapi.com/legal),
[Butaca CONTRACT](https://github.com/crafter-station/butaca/blob/595f908f3092e423b27839c650e2eae248e2b256/CONTRACT.md),
[términos Cinemark](https://www.cinemark.com.ar/terminos-condiciones).
Antes de habilitar, revisar derechos de contenido/redistribución y las condiciones
vigentes del plan de la cuenta. No se garantiza exhaustividad, SLA ni checkout.
