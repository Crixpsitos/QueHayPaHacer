# Spec: media-pipeline-race — medios de evento nunca se quedan "procesando"

## Objective
Quien crea o edita un evento sube fotos y videos. Hoy algunos ítems quedan en "procesando" para siempre, sin error ni correo. Meta: todo ítem termina en `ready` o `error` visible, y si no, el usuario puede reintentar.

**Causa raíz (confirmada en código y logs de prod, 2026-11-04):** carrera de orden. `Step2Media.saveMediaFiles` sube el archivo a Storage, **después** agrega el item al form y **después** `saveDraftEvent()` lo escribe en Firestore. El CF `onObjectFinalizedOptimizeImages` termina en ~0,4 s, busca `data.path === filePath`, no lo encuentra, hace `logger.warn("No media item found…skipping")` y retorna sin lanzar, así que `retry:true` no actúa. El item se guarda después en `processing` y nadie lo actualiza. Mismo patrón en `onObjectFinalized.optimizeVideos.ts` (líneas ~125-130). Agravante: `saveDraftEvent` reescribe todo el arreglo `media` desde el estado local y puede pisar un `ready` ya escrito.

Dato clave: `generateUploadUrl` (server action) devuelve `path` y `publicUrl` ANTES del PUT, así que el cliente puede persistir el item antes de subir.

Usuarios: creadores de eventos (incluida la cuenta admin). Éxito = 0 ítems atascados en pruebas de 6 archivos simultáneos y alerta si ocurre en prod.

## Acceptance criteria
1. Subir 6 imágenes a la vez a un evento nuevo: las 6 llegan a `ready`, sin intervención.
2. Subir 1 video + 5 imágenes: ídem (videos pueden tardar más).
3. El item existe en Firestore con `status:"processing"` **antes** de que el PUT a Storage empiece.
4. Si el CF no encuentra el item y el objeto tiene < 5 min, lanza error (reintento automático). Pasados 5 min, loguea `error` (no solo warn) y retorna.
5. Un guardado del form con copia local vieja NO revierte un item que ya está `ready`/`error` en Firestore.
6. UI "Reintentar" (versión recomendada, server-side, no depende del `File` local): un item en `processing` o `error` por más de 3 min muestra el botón. Llama a una server action `retryEventMedia(eventId, mediaId)` que (a) verifica sesión y que el usuario es dueño/admin del evento, (b) comprueba que el original `deoptimized-*` sigue en Storage, (c) si ya existe el `optimized_*` marca el item `ready` leyendo su metadata, y si no, reescribe el original en el bucket (nueva generación) para que el CF vuelva a dispararse, ya con el item persistido, (d) si el original no existe, marca `error` con el mensaje "vuelve a subir este archivo". Idempotente: pulsar dos veces no duplica trabajo.
7. Alerta de Cloud Logging cuando aparece `No media item found` pasada la ventana de 5 min.
8. Tras volver atrás en el wizard o recargar, los items reflejan el estado real de Firestore.

## Tech stack
App: Next.js 16.4 (Cache Components), React, react-hook-form, TS, pnpm. Functions: Firebase Functions v2 (`onObjectFinalized`, Node 22, `sharp`, `firebase-admin`). Leer `node_modules/next/dist/docs/` antes de tocar código de la app (AGENTS.md).

## Commands
App (`QueHayPaHacer-copilot`):
- `pnpm typecheck`
- `pnpm test` (`tsx --test "**/*.test.ts" "**/*.test.tsx"`)
- `pnpm lint`
- `pnpm build`
Functions (`../functions`):
- `npm run build` · `npm run lint` · `npm test` (**ampliar el glob** para incluir los tests nuevos de `modules/events/**`)
- Deploy: `firebase deploy --only functions:onObjectFinalizedOptimizeImages,functions:<video>` con orden explícita del usuario.
Logs: `gcloud logging read 'resource.labels.service_name="onobjectfinalizedoptimizeimages" …' --project=quehaypahacer-prod`.

## Project structure (archivos previstos)
- `presentation/events/components/steps/Step2Media.tsx` — reordenar `saveMediaFiles` (persistir, luego subir).
- `presentation/events/lib/upload/uploadToGoogleStorage.ts` — separar en `prepareUpload` (URL firmada + path) y `putToStorage`; mantener la función actual como composición para otros callers.
- `presentation/events/components/Dropzone/MediaDropzone.tsx` — botón "Reintentar" y umbral de tiempo.
- `presentation/events/components/form/FormRemoteDataSyncer.tsx` — que el remoto `ready/error` gane sobre el local viejo.
- Posible server action `retryEventMedia` en `app/actions/events/`.
- Functions: `src/triggers/storage/onObjectFinalized.optimizeImages.ts`, `…optimizeVideos.ts`, helper compartido `src/modules/events/helpers/patchEventMedia.ts` (nuevo, evita duplicar la transacción) + su test.

## Code style
TypeScript estricto, comentarios en español solo cuando el porqué no es obvio, sin abstracciones sin necesidad. Ejemplo del patrón del CF:

```ts
// ponytail: ventana de 5 min; si el doc nunca recibe el item, no reintentar por días
const RETRY_WINDOW_MS = 5 * 60 * 1000;
if (targetIndex === -1) {
  const ageMs = Date.now() - new Date(event.time).getTime();
  if (ageMs < RETRY_WINDOW_MS) throw new Error(`media item not persisted yet: ${filePath}`);
  logger.error(`No media item found for path: ${filePath}`);
  return;
}
```

## Testing strategy
- **Functions (unit):** helper `patchEventMedia` con Firestore falso: item presente → `ready`; ausente y objeto joven → lanza; ausente y viejo → no lanza y loguea error. Test que falla sin el fix.
- **App (unit):** función pura que decide "reintentable" (processing > 3 min) y merge remoto/local (remoto `ready` gana).
- **Integración manual obligatoria:** subir 6 archivos en develop, verificar con `gcloud logging read` que no aparece `No media item found`. Los MCP de navegador estuvieron caídos el 2026-11-05; si siguen caídos, la prueba la hace el usuario con mi guion.
- **Producción:** verificar solo con `gcloud logging` tras el deploy, sin crear eventos falsos sin permiso.

## Boundaries
- Always: reproducir/verificar con logs antes de afirmar; `pnpm typecheck` + `pnpm test` + `pnpm build` antes de subir; trabajar en `develop`; un commit por slice con `Co-Authored-By`.
- Ask first: desplegar functions a prod, cambiar la forma del documento `events.media`, tocar reglas de Firestore/Storage, añadir dependencias, crear índices.
- Never: desplegar a prod sin orden; dejar clave de servicio en el repo; borrar medios de usuarios reales; ampliar a sitios/sesiones sin pedirlo.

## Success criteria
Los 8 criterios de aceptación pasan; `grep "No media item found"` en logs de develop = 0 tras 3 pruebas de 6 archivos; los tests nuevos fallan sin el fix y pasan con él.

## Open questions
Resueltas el 2026-11-05: triggers = `onObjectFinalizedOptimizeImages` (galería + portada) y `onObjectFinalizedOptimizeVideos`; "Reintentar" = versión server-side recomendada (criterio 6); sesiones tienen la misma carrera → `SPEC-session-media-race.md`.

Abiertas (se resuelven con un spike al inicio del plan):
1. ¿Reescribir un objeto sobre sí mismo en GCS (`file.copy` al mismo nombre) crea una nueva generación y dispara `onObjectFinalized`? Si no, alternativa: copiar a un nombre temporal y renombrar, o llamar a la compresión desde la server action. Probar en develop antes de elegir.
2. `mainImage` usa `update()` directo (no busca item): si el doc aún no existe lanza y reintenta. Confirmar que no tiene el mismo síntoma antes de excluirlo del arreglo.
