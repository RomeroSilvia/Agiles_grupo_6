# Documentación de STREAMLY

Guías para trabajar en el repositorio. Las convenciones de código (capas, nombres, idioma, base de datos) están en [AGENTS.md](../AGENTS.md), que es la fuente de verdad del proyecto, acá se explica cómo aplicarlas en el día a día.

## Guías

| Guía                                                | Para qué sirve                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Flujo de trabajo con Git](./flujo-de-trabajo-git/) | Cómo nombrar ramas, abrir pull requests, pedir revisión e integrar a `main`        |
| [Guía de commits](./guia-de-commits/)               | Cómo escribir los mensajes de commit para que los acepten el hook de husky y el CI |

## Otros recursos

- [README del proyecto](../README.md): puesta en marcha, estructura y endpoints de la API.
- [Template de pull request](../.github/pull_request_template.md): lo que hay que completar en cada PR.

## Cómo sumar documentación

- Una carpeta por tema, con un `README.md` adentro. Si el tema crece, se suman más archivos en la misma carpeta.
- Nombres de carpetas y archivos en minúsculas, con guiones y sin tildes ni ñ: `flujo-de-trabajo-git/`, no `Flujo_De_Trabajo/`.
- Cada carpeta nueva se agrega a la tabla de arriba.
- Si un documento deja de usarse, se borra: queda en el historial de git.
- No se suben capturas, exportaciones ni archivos sueltos. Las capturas de una HU van en su pull request.
