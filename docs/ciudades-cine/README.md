# Directorio de ciudades de cine

El endpoint público `GET /api/cartelera/ciudades` publica ciudades argentinas con ubicación verificada y distingue la cobertura de horarios confirmada de la pendiente. No se debe inferir una ciudad a partir de `AR`, de la región de streaming ni de la ubicación del navegador.

## Estado actual

El directorio se mantiene en `apps/api/src/config/ciudadesCine.config.js` y contiene La Plata, CABA, Córdoba y Mar del Plata. CABA y Córdoba tienen cobertura Cinemark verificada con ocho sucursales en total; La Plata y Mar del Plata permiten consultar SerpApi con cobertura `sin_verificar`. Ver [estado y evidencia](../cine.md). Una configuración deshabilitada o inválida devuelve `502 EXTERNAL_SERVICE`; una lista vacía `200` solo corresponde cuando fue revisada y no tiene ciudades publicables.

## Requisitos para publicar una ciudad

- Asignar una vez un ID opaco `ar:<UUID>`; no derivarlo del nombre ni cambiarlo al renombrar la ciudad.
- Verificar municipio y provincia para desambiguar nombres homónimos, una zona horaria IANA y el alcance geográfico que usará cada proveedor.
- Registrar por separado la ubicación canónica de SerpApi y los pares `{ id, slug }` de complejos de Butaca que correspondan a esa ciudad. No usar slugs de barrios o complejos como IDs de ciudad.
- Guardar evidencia y fecha de consulta por fuente. La referencia pública `fuente` debe coincidir con esa evidencia.
- Marcar `disponible` solo cuando haya evidencia de horarios y un mapeo de proveedor. `sin_verificar` permite consultar una ubicación geográfica revisada sin prometer horarios. Usar `sin_cobertura` para una ciudad conocida cuya cobertura no pueda ofrecerse; no implica que no haya funciones.
- Mantener en backend los identificadores y mapeos de proveedores. El contrato público solo entrega el ID propio, el nombre, la provincia, la zona horaria, la cobertura y la referencia de procedencia.

No agregar credenciales de proveedores al frontend ni probar cobertura con fixtures como si fueran datos productivos.

## Consumo

La selección se guarda en `sessionStorage` como `streamly.ciudadCine`. Al restaurarla se valida contra el directorio actual y solo se conserva si la ciudad sigue disponible. El país `AR` no preselecciona una ciudad. Los consumidores de funciones deben esperar una ciudad seleccionada y usar su ID opaco; no enviar coordenadas ni IDs de proveedor como parámetros libres.
