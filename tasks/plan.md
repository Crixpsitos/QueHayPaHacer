# Plan de implementación: `media-pipeline-race` (módulo 1)

Spec: `SPEC-media-pipeline-race.md` · Mapa: `CAPABILITY-MAP.md` · Fecha: 2026-11-05
Tareas en `tasks/todo.md` (markdown). Módulos 2 y 3 (`image-quality`, `session-media-race`) se planean después.

## Resumen
Eliminar los medios de evento que quedan en "procesando". Tres capas: (1) el cliente persiste el item antes de subir el archivo, (2) el servidor no deja que un guardado con copia vieja pise un `ready`/`error`, (3) el CF reintenta si el item aún no existe. Más botón "Reintentar" (server-side) y alerta.

## Hallazgos del plan (leídos en código, sin ejecutar nada)
- `EventClientWrapper.handleDraftSubmit` manda **todo** el form (`media` + `mainImage`) a `updateEventAction(id, draftData)` en cada guardado. Es un reemplazo completo.
- Por tanto hay DOS direcciones de carrera:
  - **A (confirmada en logs):** CF corre antes de que el item exista → `No media item found … skipping`.
  - **B (por código, sin confirmar en datos):** CF escribe `ready`, y un `saveDraftEvent()` posterior con estado local `processing` lo pisa. Aplica a galería **y a la portada** (`mainImage.status`), que el CF actualiza con `update()` directo.
- `generateUploadUrl` devuelve `path` antes del PUT → el cliente puede persistir primero.
- `updateEventAction` es el único punto de escritura de borradores → el arreglo B va ahí una vez, no en cada llamador.

## Decisiones de arquitectura
1. **Fix B en el servidor** (`updateEventAction`): función pura `mergeMediaStatus(incoming, stored)`; si el item local viene `processing` y el guardado es `ready|error` (mismo `id`), gana el guardado. Misma regla para `mainImage`. Un solo lugar, cubre todos los llamadores.
2. **Fix A en dos capas:** orden en el cliente (raíz) + reintento en el CF (red de seguridad, ventana 5 min).
3. **Helper compartido en functions** `patchEventMedia.ts` con la transacción y la regla de ventana; lo reusan imágenes y videos (y luego sesiones, módulo 3).
4. **Orquestación testable:** el flujo "preparar → persistir → subir" se extrae a una función con dependencias inyectadas para poder probar el ORDEN sin navegador.
5. **Reintentar server-side** (spec criterio 6), diseño final tras el spike T0.

## Grafo de dependencias
```
T0 spike ──────────────► T6 retryEventMedia ──► T7 UI Reintentar
T1 merge servidor (B) ─┐
T2 CF helper+reintento ─┼─► Checkpoint A ──► T8 alerta ──► Checkpoint final
T3 galería persist-first┤                    (depende T2)
T4 portada persist-first┘ (T3 antes de T4: reusa prepare/put)
```
T1, T2 y T3 son independientes entre sí (paralelizables). T0 va primero por ser el de mayor riesgo/incertidumbre.

## Fases
- **Fase 0 — Riesgo:** T0.
- **Fase 1 — Cerrar la carrera:** T1, T2, T3, T4 → Checkpoint A.
- **Fase 2 — Recuperación:** T6, T7, T8 → Checkpoint final.
(T5 reservado: la medición manual va en los checkpoints, no es tarea de código.)

## Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Reescribir un objeto sobre sí mismo en GCS no dispara `finalize` | Alto (rompe T6) | Spike T0 antes de diseñar T6; alternativas: copia a temporal+renombrar, o comprimir desde la action |
| Persistir antes de subir deja items huérfanos si el PUT falla | Medio | Si el PUT falla, marcar el item `error` y avisar; botón borrar siempre disponible |
| Cambiar `updateEventAction` afecta publicar/editar de todos los eventos | Alto | Función pura con tests; solo toca items con mismo `id` y estado `processing` local; typecheck+build |
| Desplegar functions a develop/prod | Medio | Solo con orden explícita; verificación por logs |
| Los MCP de navegador pueden seguir caídos | Bajo | Prueba manual guiada al usuario en develop |
| La alerta de logs necesita permisos en GCP prod | Bajo | Preguntar antes de crearla (T8) |

## Preguntas abiertas
- T0 puede cambiar el diseño de T6 (ver riesgos).
- ¿Hay un helper existente de "dueño o admin del evento" para T6? Buscar `sessionOwnership.ts` / `teamPolicy.ts` (están en `app/actions/events/lib`) antes de escribir uno nuevo.

## Resultado del spike T0 (2026-11-05)
1. **Reintento posible.** Reescribir un objeto sobre sí mismo con la API REST `objects.rewriteTo` (mismo bucket y nombre) crea una generación nueva y **sí dispara** `onObjectFinalized` otra vez (probado en develop: dos ejecuciones del CF, 17:39:29 y 17:40:22). `gcloud storage cp` lo rechaza ("Source URL matches destination URL"), así que T6 usa la API de `@google-cloud/storage`/REST, no el CLI. Objetos de prueba borrados.
2. **Dirección B confirmada por código.** `EventsFirebaseRepository.updateEvent` hace `set(event, {merge:true})` con el form completo: el arreglo `media` se reemplaza entero y `mainImage` (mapa anidado) sobrescribe `status`, y hasta resucita `temporaryUrl` que el CF borró con `FieldValue.delete()`.
3. **Cambio al diseño de T1:** `updateEventAction` ya lee `existingEvent` al inicio, pero entre esa lectura y el `set` el CF puede escribir (ventana pequeña, no cero). Por eso T1 hace el merge dentro de una **transacción** en el repositorio (leer → `mergeMediaStatus` → escribir), no solo con `existingEvent`.
