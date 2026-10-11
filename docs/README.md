# QHPA: documentación integral del repositorio

Este directorio concentra el estado técnico, funcional, operativo y logístico de **Que Hay Pa Hacer (QHPA)**. Su objetivo es permitir que producto, desarrollo, diseño y operaciones compartan una misma fuente de verdad para terminar el MVP y llevarlo a producción con criterios verificables.

## Estado del documento

- Fecha de corte: **2026-10-10**.
- Repositorio: `git@github.com:Crixpsitos/QueHayPaHacer.git`.
- Rama observada: `develop`.
- Commit base observado: `3b2521c` (`feat: update creator profiles and event workflows`).
- El árbol de trabajo contiene cambios locales todavía no integrados. Las cifras y estados de validación representan el workspace al momento del corte, no necesariamente lo desplegado.
- No se incluyen valores de secretos ni credenciales. Solo se documentan nombres de variables y mecanismos de configuración.

## Cómo interpretar la evidencia

Cada documento distingue, cuando aplica:

- **Confirmado:** existe evidencia directa en código, configuración, Git o ejecución local.
- **Observado:** ocurrió durante una validación de este workspace y puede depender del entorno.
- **Inferido:** conclusión razonable que todavía necesita confirmación humana u operacional.
- **Pendiente de decisión:** no existe una definición única en código o producto.

## Mapa documental

1. [Producto y decisiones](./01-producto-y-decisiones.md): propósito, público, alcance, modelo de usuario, planes, moderación y decisiones que no deben revertirse.
2. [Stack, tamaño y repositorio](./02-stack-tamano-y-repositorio.md): tecnologías efectivas, métricas, dependencias, Git y estructura física.
3. [Arquitectura y datos](./03-arquitectura-y-datos.md): capas, flujo de dependencias, Firebase, entidades, colecciones y caché.
4. [Frontend, diseño y experiencia](./04-frontend-diseno-y-ux.md): sistema visual, navegación, responsive, medios e inconsistencias UX.
5. [Infraestructura, despliegue y operación](./05-infraestructura-despliegue-y-operacion.md): ambientes, App Hosting, secretos, Storage, Redis, scripts, observabilidad y runbooks.
6. [Calidad, seguridad y deuda](./06-calidad-seguridad-y-deuda.md): validaciones actuales, testing, fallos conocidos, riesgos y deuda priorizada.
7. [Plan para terminar](./07-plan-de-cierre-y-release.md): P0/P1/P2, secuencia recomendada, Definition of Done y criterios de salida.
8. [Administración y logística](./08-administracion-y-logistica.md): ownership pendiente, gestión de ambientes, costos, accesos, soporte y proceso de entrega.
9. [Inventario de superficies](./09-inventario-rutas-apis-y-scripts.md): páginas, APIs, acciones, jobs manuales y comandos operativos.
10. [Handoff y contexto reciente](./10-handoff-y-contexto-reciente.md): decisiones de esta conversación, cambios locales, validaciones y continuidad inmediata.
11. [Prompt maestro para Claude](./11-prompt-maestro-claude.md): instrucciones listas para delegar la estabilización y cierre del MVP.
12. [PWA y Google Play](./12-pwa-y-google-play.md): manifest, service worker (caché y cold start), Digital Asset Links y empaquetado Android con Bubblewrap.
14. [Marco legal y cumplimiento](./14-legal-y-cumplimiento.md): rol de intermediario, normas colombianas relevantes, mecanismos implementados y pendientes.

## Fuente de verdad vigente

En caso de contradicción, usar este orden:

1. Entidades y políticas de dominio actuales.
2. Acciones, repositorios y configuración ejecutable.
3. Documentos nuevos listados arriba.
4. Documentos históricos y notas de migración.

El modelo vigente de cuenta es:

```text
participation: consumer | creator
plan: basic | premium
creatorVerified: boolean
```

Participación, plan y verificación son dimensiones independientes. No deben reintroducirse `professional`, `business`, `organizer`, `government`, `digitalCreator` ni categorías empresariales como identidad del usuario.

## Documentos históricos o parciales existentes

- [`COLLABORATORS.md`](./COLLABORATORS.md) conserva el diseño original de colaboradores basado en `accountType: personal | professional`. Esa regla está obsoleta respecto al modelo actual; sirve como historia de la feature, no como contrato vigente.
- [`sites-ui-migration.md`](./sites-ui-migration.md) registra la migración visual inicial de Sitios. Incluye dependencias, tokens y checklist que deben contrastarse con el código actual.
- [`javascript-snippets.md`](./javascript-snippets.md) y [`typescript-snippets.md`](./typescript-snippets.md) son ayudas de editor, no documentación de arquitectura ni producto.
- El `README.md` raíz sigue siendo el boilerplate de `create-next-app` y no describe instalación, arquitectura ni despliegue reales.
- `DESING.md` en la raíz contiene la guía visual original. El nombre está mal escrito y parte de sus reglas contradice estilos actuales; el análisis vigente está resumido en [Frontend, diseño y experiencia](./04-frontend-diseno-y-ux.md).

## Regla de mantenimiento

Actualizar esta documentación en el mismo PR cuando cambie cualquiera de estos contratos:

- modelo de usuario o permisos;
- features de Básico/Premium;
- estados de eventos, sitios o moderación;
- rutas públicas/privadas;
- colecciones o estructura Firestore;
- variables de entorno y secretos;
- pipeline de despliegue;
- criterios de release o bloqueos P0.

No registrar secretos, tokens, claves privadas, JSON de cuentas de servicio ni datos personales reales.