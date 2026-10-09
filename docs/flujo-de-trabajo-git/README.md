# Flujo de trabajo con Git

Cómo llevar un cambio desde una rama hasta `main`. Para el formato de los mensajes, ver la [guía de commits](../guia-de-commits/).

## Ramas

- **`main`** es la única rama permanente. Siempre tiene que andar: el CI la verifica en cada push y, si un merge trae migraciones, el workflow `Migraciones` las aplica a la base compartida.
- Nadie pushea directo a `main`. Todo entra por pull request.
- Cada HU o tarea se trabaja en su propia rama, que sale de `main` y vuelve a `main`.

### Nombre de la rama

Formato: `tipo/descripcion-corta`.

- `tipo` es uno de los tipos de commit: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
- La descripción va en minúsculas, separada con guiones, sin tildes ni ñ y sin espacios. Tres a cinco palabras alcanzan.

| Correcto                       |
| ------------------------------ |
| `feat/deteccion-region-por-ip` |
| `feat/filtro-tipo-anio`        |
| `fix/cookie-sesion-vencida`    |
| `chore/migracion-watchlist`    |

## Paso a paso

### 1. Partir de `main` actualizado

```bash
git switch main
git pull
git switch -c feat/filtro-tipo-anio
```

### 2. Trabajar y commitear

Commits chicos, cada uno con un solo propósito. El hook `pre-commit` formatea con prettier lo que está en stage y `commit-msg` rechaza los mensajes que no cumplen la [guía de commits](../guia-de-commits/).

```bash
git add apps/api/src/routes/busqueda.routes.js
git commit -m "feat(busqueda): agrega filtro por tipo y año"
```

### 3. Verificar antes de subir

```bash
npm run check   # lint + formato + tests
npm run build   # si tocaste apps/web o packages/shared
```

El CI corre lo mismo. Si falla en tu máquina, va a fallar en el PR.

### 4. Subir la rama

```bash
git push -u origin feat/filtro-tipo-anio
```

### 5. Abrir el pull request

- Base: `main`.
- Completar el [template](../../.github/pull_request_template.md): HU, qué cambia, cómo probarlo y el checklist.
- Enlazar el issue con `Closes #N` para que se cierre solo al mergear.
- Si hay cambios visuales, adjuntar capturas en modo claro y oscuro, en celular y en escritorio. Las capturas van en el PR, no se commitean al repo.
- Un PR por HU o tarea. Si el PR crece demasiado, conviene partirlo.

### 6. Revisión

- Pedir revisión a al menos una persona del equipo.
- Quien revisa prueba el cambio siguiendo "Cómo probarlo" y deja comentarios concretos. Si algo bloquea el merge, marca **Request changes**; si son sugerencias, **Comment**.
- Quien abrió el PR responde cada comentario: lo corrige con un commit nuevo (por ejemplo `fix(busqueda): corrige los puntos de la revisión`) o explica por qué no.
- Cuando todo está resuelto, quien revisó aprueba.

### 7. Mantener la rama al día

Si `main` avanzó mientras trabajabas, traé esos cambios a tu rama y resolvé los conflictos en tu máquina:

```bash
git switch main
git pull
git switch feat/filtro-tipo-anio
git merge main
npm run check
git push
```

El commit `Merge branch 'main' into ...` no lo valida commitlint, así que no hace falta cambiarle el mensaje.

### 8. Integrar

Se mergea solo si se cumplen las tres condiciones:

1. El CI está en verde.
2. Hay al menos una aprobación y no quedan pedidos de cambio abiertos.
3. La rama está al día con `main`.

Quien abrió el PR lo mergea con **Create a merge commit** y después borra la rama (el botón **Delete branch** de GitHub y `git branch -d feat/filtro-tipo-anio` en tu máquina).

## Qué corre el CI en cada PR

| Paso                       | Qué revisa                                                                  |
| -------------------------- | --------------------------------------------------------------------------- |
| Validar mensajes de commit | Todos los commits del PR con commitlint, aunque se hayan salteado los hooks |
| `npm run lint`             | ESLint                                                                      |
| `npm run format:check`     | Formato con prettier, incluidos los `.md`                                   |
| `npm test`                 | Tests de todos los workspaces                                               |
| `npm run build`            | Que la web compile                                                          |
| Migraciones                | Aplica todas las migraciones y el seed desde cero en una base temporal      |

## Cambios en la base de datos

Si la HU necesita cambiar el esquema:

1. Crear la migración con `npm run db:new-migration -- <nombre>` en una rama aparte, por ejemplo `chore/migracion-aviso-watchlist`.
2. Abrir un PR chico solo con la migración (y las constantes de `packages/shared` si cambian).
3. Al mergearlo, el workflow `Migraciones` la aplica a la base compartida. Nadie corre `supabase db push` a mano.
4. Recién entonces seguir con la HU en otra rama.

Las reglas completas (compatibilidad con `main`, renombrar en dos pasos, orden de los timestamps) están en [AGENTS.md](../../AGENTS.md#la-base-es-compartida-por-los-5).

## Qué no hacer

- Pushear directo a `main`.
- Saltear los hooks con `--no-verify`. El CI valida los commits igual y el PR va a fallar.
- Hacer `git push --force` sobre una rama en la que trabaja otra persona. En tu propia rama, solo con `--force-with-lease`.
- Mergear con el CI en rojo o con pedidos de cambio sin resolver.
- Commitear `.env`, capturas de pantalla o archivos generados (`dist/`, `coverage/`).
