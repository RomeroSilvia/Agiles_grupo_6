# Cooltura: eventos en La Plata

La sección pública `/cooltura`, accesible desde la navegación, presenta
«Desconectá la pantalla y conectá Cooltura.». Permite explorar publicaciones
presenciales de La Plata, consultar categorías o períodos (hoy, mañana y este
fin de semana), cargar más páginas y abrir cada publicación en AllEvents.
Elegir categoría restablece el período y viceversa. No requiere sesión y no
modifica la región de streaming ni la ciudad seleccionada para los cines.

## Fuente y configuración

La clave entregada corresponde a **API.SH**, que proporciona datos de AllEvents:
`GET https://api.api.sh/allevents/v1/events?city=la-plata` con `x-api-key`.
La variable privada `ALLEVENTS_API_KEY` vive únicamente en `apps/api/.env`;
`.env.example` documenta la variable sin incluir su valor. Sin clave, el resto
de la aplicación funciona y los eventos devuelven un error 502 con reintento.

Referencias del proveedor: [consulta por ciudad](https://api.sh/docs/allevents-events)
y [autenticación, respuestas y caché](https://api.sh/docs).
La ubicación se contrastó con [AllEvents La Plata, Argentina](https://allevents.in/la-plata).
API.SH es el intermediario de datos; no se utiliza la API oficial de afiliados
de AllEvents ni se envía la clave a otro proveedor.

## Contrato y límites

`GET /api/eventos` acepta `categoria`, `fecha` y `pagina`, validados con Zod
compartido. La ciudad está fijada en el backend. Las categorías admitidas se
declaran en `eventos.constants.js`; los períodos son `todas`, `hoy`, `manana` y
`fin_de_semana`. No se combinan categorías específicas con períodos específicos,
siguiendo las restricciones de la fuente. Parámetros desconocidos se rechazan.

La respuesta `{ data }` incluye los eventos normalizados, la página siguiente,
la fuente y su fecha de adquisición. Se sigue `next_page`, sin deducir totales
desde `count`. Hay hasta 20 páginas consultables; alcanzar ese límite conserva
resultados y avisa que la lista puede estar incompleta. Los IDs repetidos se
unifican. Una respuesta inválida de proveedor es un 502; publicaciones inválidas
individuales se descartan con un aviso de incompletitud.

Las lecturas tienen caché de una hora por categoría/período/página, promesas
compartidas, 100 entradas y dos solicitudes externas concurrentes. Se admiten
diez solicitudes por minuto y cliente, y hasta 200 lecturas externas por día UTC
y proceso, sin reintentos ni precarga automáticos. Reiniciar o usar varias
instancias reinicia/multiplica ese presupuesto: no es una cuota distribuida.
La caché propia de API.SH puede conservar información anterior; no se fuerza
`fresh=1`. No se agregan cron, dependencias, tablas ni escrituras en Supabase.

Se excluyen publicaciones identificadas como virtuales, canceladas, de otras
localidades/países y aquellas cuya fecha final informada ya pasó en La Plata.
Los enlaces de evento requieren HTTPS y el host exacto `allevents.in`, dentro
de `/la-plata/`, sin credenciales, query ni fragmentos. Las imágenes se limitan
a los CDN de AllEvents. El frontend valida nuevamente la respuesta y ofrece
una imagen de reemplazo si la descarga falla. Los enlaces abren otra pestaña
con `noopener noreferrer` y aviso accesible; no se crean enlaces de compra.

Las fechas ISO con offset se muestran en la zona de La Plata. Las fechas civiles
no se desplazan por la zona del navegador. Cuando el listado solo entrega
`date_label`, se conserva y se traducen las abreviaturas de días/meses sin
inferir año, zona ni instante. Si faltan datos se indica que están a confirmar.
Los precios textuales son los publicados por la fuente; `Free` se muestra como
«Gratis». La publicación externa es la referencia para confirmar los detalles.

## Verificación del 14/11/2026

Se comprobó la autenticación y luego el endpoint completo con datos reales:
HTTP 200, 39 eventos, `siguientePagina=null`, sin descartes por datos inválidos.
Estas dos comprobaciones consumieron dos créditos en total según las respuestas
del proveedor. Los conteos describen esa adquisición, sin garantizar cobertura
exhaustiva ni disponibilidad futura de entradas.

Se revisó la pantalla con Chrome headless a 390 y 1280 px, en claro y oscuro,
con zona del navegador `Pacific/Auckland`. El listado inicial usó una captura
de la respuesta real de la API; los cambios de filtros usaron respuestas
controladas para comprobar reinicio, vacío y restauración sin gastar créditos.
Las cuatro combinaciones mostraron 39 tarjetas, enlaces externos seguros y
filtros funcionales, sin errores JavaScript ni desbordamiento horizontal.
Las pruebas automatizadas usan fixtures y mocks, sin servicios externos reales.
