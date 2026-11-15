# Directorio de ciudades de cine

El endpoint público `GET /api/cartelera/ciudades` publica ciudades argentinas con ubicación verificada y distingue la cobertura de horarios confirmada de la pendiente. No se debe inferir una ciudad a partir de `AR`, de la región de streaming ni de la ubicación del navegador.

## Estado actual

El directorio publica 17 localidades con cobertura Cinemark comprobada (24
complejos). La Plata y Mar del Plata conservan sus IDs internos sin cobertura.
Ver [estado y evidencia](../cine.md). Una configuración propia inválida responde
`500 INTERNAL`; una lista vacía 200 corresponde a un directorio válido sin
ciudades publicables.

## Requisitos para publicar una ciudad

- Asignar una vez un ID opaco `ar:<UUID>`; no derivarlo del nombre ni cambiarlo al renombrar la ciudad.
- Verificar municipio y provincia para desambiguar nombres homónimos, una zona horaria IANA y el alcance geográfico que usará cada proveedor.
- Registrar los pares `{ id, slug }` de complejos de Butaca que correspondan a esa ciudad. No usar slugs de barrios o complejos como IDs de ciudad.
- Guardar la evidencia descriptiva en docs y su referencia de procedencia en el directorio, sin duplicarla por ciudad.
- Marcar `disponible` solo cuando haya evidencia de horarios y un mapeo de proveedor. `sin_verificar` permite consultar una ubicación geográfica revisada sin prometer horarios. Usar `sin_cobertura` para una ciudad conocida cuya cobertura no pueda ofrecerse; no implica que no haya funciones.
- Mantener en backend los identificadores y mapeos de proveedores. El contrato público solo entrega el ID propio, el nombre, la provincia, la zona horaria, la cobertura y la referencia de procedencia.

No agregar credenciales de proveedores al frontend ni probar cobertura con fixtures como si fueran datos productivos.

## Consumo

La selección se guarda en `sessionStorage` como `streamly.ciudadCine`. Al restaurarla se valida contra el directorio actual y solo se conserva si la ciudad sigue disponible. El país `AR` no preselecciona una ciudad. Los consumidores de funciones deben esperar una ciudad seleccionada y usar su ID opaco; no enviar coordenadas ni IDs de proveedor como parámetros libres.
