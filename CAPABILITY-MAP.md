# Capability Map: Pipeline de medios de eventos

Fecha: 2026-11-05 · Estado: **aprobado por el usuario** (módulo 3 añadido el mismo día a petición suya)

| Module id | Responsabilidad | Repos | Depende de |
|---|---|---|---|
| `media-pipeline-race` | Ningún medio de evento queda en "procesando": persistir antes de subir, reintento del CF, "Reintentar" recomendado (server-side) y alerta | app + functions | — |
| `session-media-race` | Mismo arreglo para medios de sesiones multi-fecha (reusa el helper y el patrón del módulo 1) | app + functions | `media-pipeline-race` |
| `image-quality` | Imágenes de eventos (galería + portada) sin pérdida visible y con buen caché | functions + app (`next.config.ts`) | — |

Build order: `media-pipeline-race` → `session-media-race`, `image-quality` (estos dos son independientes entre sí; orden sugerido: image-quality primero porque es el más visible, luego sesiones)

Specs:
- `SPEC-media-pipeline-race.md`
- `SPEC-session-media-race.md`
- `SPEC-image-quality.md`

Repos: app = `QueHayPaHacer-copilot` (rama `develop`). functions = `../functions` (rama `fix/optimizer-and-premium-expiry`).
Triggers (confirmados en `functions/src/index.ts`): eventos `onObjectFinalizedOptimizeImages` (galería + portada) y `onObjectFinalizedOptimizeVideos`; sesiones `optimizeSessionImages` y `optimizeSessionVideos`; sitios `optimizeMediaImages` / `optimizeMediaVideos`.
Fuera de alcance: sitios (su `patchMediaByPath` también salta en silencio si falta el item, pero su flujo de subida es otro; revisar solo si el usuario reporta síntoma), perfil.
