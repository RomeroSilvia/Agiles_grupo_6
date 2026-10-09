# Guía de commits

Cómo escribir los mensajes de commit de STREAMLY. Las reglas no son una sugerencia: las controla commitlint en tu máquina y en el CI.

## De dónde salen las reglas

1. `.husky/commit-msg` corre `npx --no -- commitlint --edit "$1"` cada vez que hacés un commit.
2. commitlint lee [`commitlint.config.js`](../../commitlint.config.js), que extiende `@commitlint/config-conventional` y le cambia tres reglas: los tipos permitidos, el largo del encabezado y las mayúsculas de la descripción.
3. El CI vuelve a validar todos los commits del PR, así que saltear el hook con `--no-verify` no sirve: el PR falla igual.

Si la convención cambia, se modifican `commitlint.config.js` y la sección "Commits y PRs" de [AGENTS.md](../../AGENTS.md) en el mismo PR.

## Formato

```
tipo(alcance): descripción

Cuerpo opcional: qué cambia y por qué.

Pie opcional: Closes #12
```

- **Encabezado** (obligatorio): `tipo`, `alcance` opcional entre paréntesis, dos puntos, un espacio y la descripción.
- **Cuerpo** (opcional): después de una línea en blanco. Explica el porqué cuando el encabezado no alcanza.
- **Pie** (opcional): después de otra línea en blanco. Referencias a issues o `BREAKING CHANGE:`.

## Tipos permitidos

Solo estos seis. Cualquier otro hace fallar el commit.

| Tipo       | Cuándo usarlo                                                        | Ejemplo                                                     |
| ---------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `feat`     | Funcionalidad nueva para el usuario o un endpoint nuevo              | `feat(detalle): agrega pantalla de detalle`                 |
| `fix`      | Corrige un error                                                     | `fix(auth): corrige expiración de la cookie de sesión`      |
| `refactor` | Cambia el código sin cambiar el comportamiento                       | `refactor(api): unifica la consulta de ofertas de TMDB`     |
| `test`     | Agrega o corrige tests, sin tocar el código que prueban              | `test(watchlist): agrega pruebas del servicio de watchlist` |
| `docs`     | Solo documentación: README, `docs/`, AGENTS.md                       | `docs: agrega guía de commits`                              |
| `chore`    | Mantenimiento: dependencias, configuración, CI, scripts, migraciones | `chore(db): agrega migración de índices de disponibilidad`  |

`@commitlint/config-conventional` trae además `style`, `perf`, `ci`, `build` y `revert`, pero este proyecto **no** los permite. Los cambios de CI o de build van como `chore`, y las mejoras de rendimiento como `refactor` o `fix`.

## Alcance

Opcional. Es el módulo afectado, con el mismo nombre que tiene en el código y en minúsculas: `busqueda`, `detalle`, `titulos`, `plataformas`, `watchlist`, `auth`, `region`, `api`, `web`, `db`, `docs`.

- Si el cambio es de una funcionalidad, usar la funcionalidad: `feat(busqueda): ...`.
- Si es transversal a un lado del monorepo, usar `api` o `web`.
- Si toca muchas cosas sin un módulo claro, se omite: `docs: actualiza el readme`.

## Descripción

- **En español.**
- **Verbo en presente, tercera persona**, como en AGENTS.md: `agrega`, `corrige`, `elimina`, `separa`, `unifica`. Se lee como "este commit _agrega_...".
- **Empieza en minúscula.** commitlint no lo controla (la regla `subject-case` está desactivada porque la de config-conventional está pensada para inglés), pero es la convención del equipo.
- **Concreta:** que se entienda qué cambia sin abrir el diff. `corrige el filtro` no dice nada; `corrige el filtro por año en series` sí.

## Reglas que controla commitlint

| Regla                    | Qué exige                                        | Nivel |
| ------------------------ | ------------------------------------------------ | ----- |
| `type-enum`              | Tipo dentro de los seis permitidos               | Error |
| `type-case`              | Tipo en minúsculas                               | Error |
| `type-empty`             | Que haya tipo                                    | Error |
| `subject-empty`          | Que haya descripción                             | Error |
| `subject-full-stop`      | Descripción sin punto final                      | Error |
| `header-max-length`      | Encabezado de hasta 100 caracteres               | Error |
| `header-trim`            | Encabezado sin espacios al principio ni al final | Error |
| `body-max-line-length`   | Cada línea del cuerpo de hasta 100 caracteres    | Error |
| `footer-max-line-length` | Cada línea del pie de hasta 100 caracteres       | Error |
| `body-leading-blank`     | Línea en blanco entre el encabezado y el cuerpo  | Aviso |
| `footer-leading-blank`   | Línea en blanco antes del pie                    | Aviso |

Un **error** frena el commit. Un **aviso** lo deja pasar, pero igual hay que corregirlo.

commitlint **ignora** los mensajes que genera Git: `Merge pull request ...`, `Merge branch 'main' into ...`, `Revert "..."`, y los que empiezan con `fixup!`, `squash!` o `amend!`.

## Ejemplos

### Correctos

```
feat(busqueda): agrega filtro por plataformas propias en la búsqueda
```

```
fix(web): reintenta cargar las plataformas propias si falló la carga
```

```
refactor(busqueda): separa la página de búsqueda en formulario y resultados
```

Con cuerpo y pie:

```
fix(api): excluye plataformas inactivas de las propias

Las plataformas desactivadas seguían apareciendo en la selección del usuario
porque la consulta no filtraba por la columna activa.

Closes #36
```

### Incorrectos

| Mensaje                                             | Problema                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `feat: agregar filtro`                              | Verbo en infinitivo. Va `agrega`                                        |
| `feat: agregué filtro`                              | Verbo en pasado                                                         |
| `feat: add filter`                                  | En inglés                                                               |
| `feature(busqueda): agrega filtro`                  | `feature` no es un tipo permitido. **Lo rechaza commitlint**            |
| `ci: agrega job de build`                           | `ci` no está permitido; va `chore`. **Lo rechaza commitlint**           |
| `Feat(busqueda): agrega filtro`                     | Tipo con mayúscula. **Lo rechaza commitlint**                           |
| `fix(auth): corrige la cookie.`                     | Punto final. **Lo rechaza commitlint**                                  |
| `agrega filtro por tipo`                            | Sin tipo. **Lo rechaza commitlint**                                     |
| `fix(busqueda):corrige el filtro`                   | Falta el espacio después de los dos puntos. **Lo rechaza commitlint**   |
| `feat(web): Agrega pantalla de detalle`             | Descripción con mayúscula inicial                                       |
| `fix: arreglos varios`                              | No dice qué cambia                                                      |
| `fix(api): excluye plataformas inactivas - Agrega…` | El cuerpo quedó pegado al encabezado; va después de una línea en blanco |

El último caso pasa cuando se escribe todo en una línea o se usa un solo `-m`. Para un mensaje con cuerpo, usar un `-m` por párrafo (`git commit -m "fix(api): ..." -m "Cuerpo..."`) o escribirlo en el editor con `git commit` sin `-m`.

## Cuando el hook rechaza el commit

El commit no se crea y commitlint muestra qué reglas fallaron:

```
⧗   input: feature(busqueda): agrega filtro
✖   type must be one of [feat, fix, chore, refactor, docs, test] [type-enum]
```

Corregí el mensaje y volvé a commitear: lo que estaba en stage sigue ahí.

Si el commit ya existe y el CI lo rechaza:

- **Es el último y no lo pusheaste:** `git commit --amend -m "mensaje corregido"`.
- **Ya lo pusheaste o es uno anterior:** avisá en el PR antes de reescribir la historia. Si nadie más trabaja en la rama, se puede corregir con un rebase interactivo y `git push --force-with-lease`.

Para probar un mensaje sin commitear:

```bash
echo "feat(busqueda): agrega filtro por tipo" | npx commitlint
```

## Otros hooks

`.husky/pre-commit` corre `npx lint-staged`, que pasa prettier sobre los archivos en stage (`.js`, `.jsx`, `.json`, `.md`, `.css`, `.html`, `.yml`). Si prettier cambia algo, esos cambios entran en el mismo commit.
