# Directorio de ciudades de cine

El endpoint público `GET /api/cartelera/ciudades` publica solo ciudades argentinas cuya cobertura esté respaldada por evidencia. No se debe inferir una ciudad a partir de `AR`, de la región de streaming ni de la ubicación del navegador.

## Estado actual

El directorio se mantiene en `apps/api/src/config/ciudadesCine.config.js`. Está deshabilitado y vacío mientras no haya cobertura verificada. En ese estado, la API responde `502 EXTERNAL_SERVICE`; no debe sustituirse por una respuesta vacía ni por datos de ejemplo. Una lista vacía `200` solo corresponde cuando la configuración fue revisada y no tiene ciudades publicables.

## Requisitos para publicar una ciudad

- Asignar una vez un ID opaco `ar:<UUID>`; no derivarlo del nombre ni cambiarlo al renombrar la ciudad.
- Verificar municipio y provincia para desambiguar nombres homónimos, una zona horaria IANA y el alcance geográfico que usará cada proveedor.
- Registrar por separado la ubicación canónica de SerpApi y los pares `{ id, slug }` de complejos de Butaca que correspondan a esa ciudad. No usar slugs de barrios o complejos como IDs de ciudad.
- Guardar evidencia y fecha de consulta por fuente. La referencia pública `fuente` debe coincidir con esa evidencia.
- Marcar `disponible` solo cuando haya evidencia y un mapeo de proveedor. Usar `sin_cobertura` para una ciudad conocida cuya cobertura no pueda ofrecerse; no implica que no haya funciones.
- Mantener en backend los identificadores y mapeos de proveedores. El contrato público solo entrega el ID propio, el nombre, la provincia, la zona horaria, la cobertura y la referencia de procedencia.

SerpApi y Butaca requieren verificación representativa y evidencia vigente antes de habilitar ciudades. No agregar credenciales de proveedores al frontend ni probar cobertura con fixtures como si fueran datos productivos.

## Consumo

La selección se guarda en `sessionStorage` como `streamly.ciudadCine`. Al restaurarla se valida contra el directorio actual y solo se conserva si la ciudad sigue disponible. El país `AR` no preselecciona una ciudad. Los consumidores de funciones deben esperar una ciudad seleccionada y usar su ID opaco; no enviar coordenadas ni IDs de proveedor como parámetros libres.
