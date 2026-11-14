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

La implementación inicial dejó el directorio vacío: una respuesta sin estructura
no demuestra ausencia de exhibición ni cobertura. A pedido de la persona responsable,
el alcance inicial se ajustó para permitir consultas en La Plata, CABA, Córdoba y
Mar del Plata, conservando explícitamente la cobertura `sin_verificar`.

Las cuatro ubicaciones se verificaron mediante la API pública de Locations de
SerpApi, escogiendo registros urbanos AR vigentes (`target_type=City`), no provincias
ni registros obsoletos. Ver [evidencia geográfica](evidencia/ciudades-serpapi-2026-11-14.json).
Esta verificación no confirma horarios. CABA usa el registro urbano de Buenos Aires,
con coordenadas de la ciudad; Córdoba usa el registro vigente de Córdoba capital.
Las consultas del directorio no requieren API key ni búsquedas Google.

`sin_verificar` permite selección, restauración y consulta explícita con un aviso
visible; toda respuesta de funciones conserva `incompleta` hasta verificar cobertura.
`sin_cobertura` continúa deshabilitada. `disponible` se reserva para cobertura
comprobada. Los UUID públicos asignados son permanentes y no dependen del proveedor.
No hay que editar `.env` para ver las ciudades: reiniciar la API y recargar la web
si estaban abiertas. Los nombres canónicos del proveedor permanecen solo en backend.

La verificación posterior habilitó cobertura Cinemark en CABA (seis sucursales)
y Córdoba (Nuevo Centro y Patio Olmos). Los IDs, slugs y direcciones están en
`cinesCinemark.config.js`; se contrastaron con el directorio oficial, no con el
campo `city` del BFF, que llama «Interior» a Córdoba y mezcla regiones en CABA.
La Plata y Mar del Plata siguen sin fuente de horarios confirmada: no figuran en
ese directorio. Un directorio eliminado o inválido devuelve 502; uno configurado
sin entradas devuelve una lista vacía.

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

Cinemark también permite correspondencias automáticas durante la consulta. TMDB
entrega título localizado, original y alias AR, año y duración en el mismo request
de detalle (`append_to_response=alternative_titles`). Se exige coincidencia exacta
de un título normalizado, el mismo año de estreno y duración con diferencia máxima
de un minuto, con un único `corporateId` compatible. La evidencia resultante dura
lo que dura la caché de funciones. No se adjudican sesiones solo por el título.
Títulos traducidos sin alias AR, reestrenos y duraciones incompatibles necesitan
una correspondencia revisada; si no existe, el resultado informa incompletitud.

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
No consulta asientos, inventario ni órdenes. No requiere API key. Las lecturas
anónimas de directorio, películas y horarios se comprobaron el 14/11/2026 y el
adaptador está habilitado por defecto (`BUTACA_ENABLED=true`, configurable a
`false`). `BUTACA_VERIFICADO` registra esa verificación operativa. El BFF no es
una API contractual con SLA; la licencia MIT corresponde al código adaptado.
Ver [evidencia de Cinemark](evidencia/cinemark-2026-11-14.json).

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
directorio lo indique. Una advertencia de SerpApi no elimina funciones válidas
devueltas por Cinemark.

Referencias: [Showtimes](https://serpapi.com/showtimes-results),
[parámetros SerpApi](https://serpapi.com/search-api), [términos](https://serpapi.com/legal),
[Butaca CONTRACT](https://github.com/crafter-station/butaca/blob/595f908f3092e423b27839c650e2eae248e2b256/CONTRACT.md),
[términos Cinemark](https://www.cinemark.com.ar/terminos-condiciones).
No se garantiza exhaustividad, SLA ni checkout.

## Filtros (#76)

Fecha y cine se aplican localmente con AND sobre todo F1, sin nuevas rutas ni
solicitudes. Las opciones vienen del conjunto sin filtrar y usan `fechaLocal` e
ID canónico, no el nombre del cine ni la fecha UTC del navegador. Los homónimos
muestran dirección. Limpiar recupera el conjunto recibido; cambiar película o
ciudad reinicia ambos filtros. Actualizaciones que retiran opciones las limpian
y anuncian el cambio; durante la carga se ocultan controles y resultados viejos.

El vacío de filtros no reemplaza los estados de adquisición; las advertencias
de cobertura, horizonte y truncamiento permanecen visibles. Filtrar no garantiza
exhaustividad fuera de los datos recibidos. Paginar F1 en el futuro requiere
revisar este contrato antes de conservar filtrado local.

## Sitios de cines (#77)

La política de confianza vive únicamente en `enlaceCine.schema.js`, compartida por
normalización backend y acción web. Reutiliza `httpUrlSchema` sin cambiar su
semántica genérica. `ExternalLink` mantiene `target=_blank` y
`rel="noopener noreferrer"`, nombre accesible, foco y aviso de apertura externa.

Se comparan hosts normalizados exactos y URLs completas contra destinos revisados,
con asociación de fuente/cine/función. Se rechazan credenciales, controles,
protocolos ajenos a HTTPS, IPs, hosts locales o engañosos, puertos no estándar,
endpoints genéricos de redirección, parámetros de URL y claves/tokens. HTTP solo
se permite para un destino individual configurado expresamente con evidencia;
ninguno de los destinos actuales usa esa excepción. No hay seguimiento de
redirects, requests de comprobación ni endpoint público de redirección.

Destino habilitado: únicamente `https://www.cinemark.com.ar/`, como sitio general
para establecimientos correspondientes a Butaca/Cinemark. Se comprobó la home
oficial el 14/11/2026; la correspondencia del establecimiento sigue requiriendo
el mapeo revisado de #75. No se habilitan comodines ni intermediarios. El path y
query se conservan únicamente cuando coinciden con un destino completo revisado.

No hay ninguna URL de compra real habilitada. Una futura compra requiere URL
explícita revisada para el cine, función y TMDB ID exactos y fuente coincidente;
no se construye a partir de IDs. Los tests con destinos ficticios demuestran ese
contrato condicional, sin acreditar una capacidad productiva. Butaca proporciona
sitios generales, no un checkout verificado de sesión: `urlCompra=null`. Si falta
compra válida, se ofrece el sitio general autorizado con esa aclaración. Sin ambos
se muestra «Enlace no disponible», conservando horario y procedencia. Una URL
rechazada se transforma en null, con diagnóstico sanitizado, sin descartar la función.

Evidencia: [sitio oficial](https://www.cinemark.com.ar/) y
[enlaces de Butaca](https://github.com/crafter-station/butaca/blob/595f908f3092e423b27839c650e2eae248e2b256/src/links.ts).
La validación local no certifica disponibilidad ni redirecciones futuras del servidor.

## Verificación local del 14/11/2026

Se ejecutaron `npm run check` y `npm run build`. Las pruebas automatizadas usan
fixtures y mocks, sin Supabase ni APIs externas reales. Las comprobaciones manuales
incluyeron TMDB, SerpApi y lecturas anónimas Cinemark; no hubo migraciones ni
escrituras de datos.

El endpoint completo de funciones se probó con Godzilla Minus Zero (TMDB 1381071)
y fuentes reales: HTTP 200 con 149 funciones futuras en seis cines de CABA y 37 en
dos de Córdoba, dentro del horizonte local. La identidad se resolvió automáticamente
por título, año 2026 y duración 135 minutos. Estas dos consultas SerpApi adicionales
no devolvieron estructura de horarios: F1 conserva los horarios Cinemark y advierte
que esa otra fuente está incompleta. Son conteos de la adquisición del 14/11/2026,
no valores permanentes ni funciones inventadas para los tests.

Para reproducir en desarrollo: reiniciar `npm run dev`, abrir el detalle de
Godzilla Minus Zero, elegir CABA o Córdoba y pulsar «Consultar funciones».
Los filtros de fecha y cine usan esa respuesta sin consumir consultas adicionales.

Se revisaron cartelera/estrenos y detalle con funciones en Chrome headless mediante
Playwright, a 390 y 1280 px, en claro y oscuro, con zona del navegador
`Pacific/Auckland`. Las cuatro combinaciones conservaron fechas locales, navegación,
atribuciones, foco de controles, seguridad de enlaces y advertencias. No hubo
errores JavaScript ni desbordamiento horizontal; cambiar/limpiar filtros mantuvo
una sola consulta de funciones por prueba. Los datos del navegador fueron fixtures,
sin afirmar cobertura productiva ni compra real.

Tras habilitar Cinemark se repitió la revisión del detalle a 390/1280 px, en claro
y oscuro, con las respuestas F1 reales de Godzilla Minus Zero capturadas arriba
(las otras pantallas conservaron mocks). Se mostraron las 149/37 funciones, cambio
de ciudad y filtros sin consultas adicionales por filtro, sin errores JavaScript
ni desbordamiento horizontal y con horarios locales conservados en Auckland.

Pendientes externos: fuente verificable de anuncios AR sin fecha (#73), fuente
de horarios para La Plata y Mar del Plata y correspondencias de títulos que no
superan la vinculación automática (#74/#75), y enlaces de compra de una función
comprobables (#77). No se consideran resueltos mediante mocks; las ciudades
consultables se distinguen de cobertura confirmada.
