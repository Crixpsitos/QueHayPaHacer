# Spec: session-media-race — medios de sesiones multi-fecha

Depende de `media-pipeline-race` (reusa su helper de parche con reintento y el patrón de subida en dos pasos). Se construye después de él.

## Objective
Las sesiones de eventos multi-fecha tienen el mismo bug de carrera que los eventos. Confirmado en código: `SessionForm.tsx` sube con `uploadToGoogleStorage(file, "sessions", …)` (líneas ~280 y ~329) y solo después llama a `saveDraftSessionAction`; `optimizeSessionImages/Videos` (functions) usan `patchSessionMediaByPath`, que si el doc no existe o el item no está solo hace `logger.warn("… skipping")` y retorna. Resultado esperado igual: items de sesión en `processing` para siempre.

## Acceptance criteria
1. Subir 6 archivos a una sesión nueva: todos llegan a `ready`.
2. El item de sesión existe en Firestore (`events/{eventId}/sessions/{sessionId}`) en `processing` **antes** del PUT a Storage.
3. `patchSessionMediaByPath` lanza (reintento) si falta el item y el objeto tiene < 5 min; pasado ese tiempo loguea `error`. Misma ventana que el módulo 1 (constante compartida).
4. "Reintentar" en `SessionForm` con la misma server action generalizada (`retryEventMedia` acepta sesión) y mismos umbrales.
5. La alerta de logs del módulo 1 cubre también `No session media`.
6. Comportamiento de portada compartida (`isSharedCover`, `coverSource`) no cambia: tests existentes siguen pasando.

## Tech stack / Commands
Igual que `SPEC-media-pipeline-race.md`. Functions: `npm run build && npm test`. App: `pnpm typecheck && pnpm test && pnpm build`.

## Project structure
- `presentation/events/components/session/SessionForm.tsx` — persistir antes de subir (3 puntos de subida: portada, galería, videos).
- `presentation/events/lib/upload/uploadToGoogleStorage.ts` — reusa `prepareUpload`/`putToStorage` del módulo 1.
- `../functions/src/triggers/storage/onObjectFinalized.optimizeSessions.ts` — reemplazar `patchSessionMediaByPath` por el helper compartido (extraer a `src/modules/events/helpers/` si el módulo 1 aún no lo hizo genérico).
- Test nuevo del helper con ruta de sesión.

## Code style / Testing
Como el módulo 1: helper puro testeado con Firestore falso (item ausente joven → lanza, ausente viejo → no lanza). Verificación manual en develop con 6 archivos y `gcloud logging read` sin `No session media`.

## Boundaries
- Always: reusar el helper del módulo 1, no duplicar la transacción; `pnpm typecheck/test/build`; trabajar en `develop`.
- Ask first: desplegar functions a prod, cambiar forma de `sessions.media`, tocar `coverSource`/portada compartida.
- Never: desplegar a prod sin orden; romper el caso de portada compartida; ampliar a sitios.

## Success criteria
Criterios 1-6 pasan; 0 `No session media` en logs de develop tras 3 pruebas de 6 archivos.

## Open questions
1. Las sesiones usan una subcolección: confirmar que el `eventId` del path (`public/events/{eventId}/…` o `public/sessions/…`) permite al CF ubicar el doc sin ambigüedad (leer `parsePath` de `optimizeSessions` en el plan).
