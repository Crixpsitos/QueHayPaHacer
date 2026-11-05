# Tareas: `media-pipeline-race` (módulo 1) — ver tasks/plan.md

Repos: app = `QueHayPaHacer-copilot` (`develop`) · functions = `../functions` (`fix/optimizer-and-premium-expiry`).

## Fase 0 — Riesgo
- [x] **T0 Spike (S, sin tocar código del repo):** probar en develop si reescribir un objeto sobre sí mismo dispara `onObjectFinalized`; y leer en develop si un guardado con `processing` pisa un `ready` (confirmar dirección B).
  - Acceptance: decisión escrita en plan.md (cómo reintentar + si B es real).
  - Verify: script temporal en scratchpad + `gcloud logging read` mostrando el trigger (o su ausencia).
  - Files: ninguno del repo.

## Fase 1 — Cerrar la carrera
- [x] **T1 Merge en servidor (M) — dirección B:** `mergeMediaStatus` puro + uso dentro de una transacción del repositorio (`EventsFirebaseRepository`) llamada desde `updateEventAction`, para `media` y `mainImage` (confirmado por T0).
  - Acceptance: item local `processing` + guardado `ready|error` (mismo id) → queda el guardado; ítems nuevos y borrados se respetan; sin guardado previo no cambia nada.
  - Verify: test que falla sin el fix (`pnpm test`), `pnpm typecheck`.
  - Files: `app/actions/events/lib/mergeMediaStatus.ts` (+ `.test.ts`), `app/actions/events/update-event.action.ts`, `infraestructure/firebase/repositories/events/EventsFirebaseRepository.ts` (+ interfaz).
  - Deps: ninguna.
- [x] **T2 CF: reintento si falta el item (M) — dirección A:** helper `patchEventMedia` con ventana de 5 min; usado por `onObjectFinalizedOptimizeImages` y `…Videos`; ampliar glob de `npm test`.
  - Acceptance: item ausente + objeto < 5 min → lanza; ausente y viejo → `logger.error` sin lanzar; presente → parchea; imagen y video comparten helper.
  - Verify: `npm run build && npm test` en functions (test falla sin el fix); `npm run lint`.
  - Files: `functions/src/modules/events/helpers/patchEventMedia.ts` (+ test), `onObjectFinalized.optimizeImages.ts`, `onObjectFinalized.optimizeVideos.ts`, `functions/package.json`.
  - Deps: ninguna.
- [x] **T3 Galería: persistir antes de subir (M):** separar `uploadToGoogleStorage` en `prepareUpload` + `putToStorage` (la actual los compone); `saveMediaFiles` pasa a preparar → items `processing` → `saveDraftEvent()` → PUT; si el PUT falla, item `error` + toast.
  - Acceptance: el item existe en Firestore antes del PUT; fallo de PUT deja `error` borrable; otros llamadores de `uploadToGoogleStorage` siguen igual.
  - Verify: test del orquestador con dependencias falsas (orden: prepare → persist → put); `pnpm typecheck && pnpm test`.
  - Files: `presentation/events/lib/upload/uploadToGoogleStorage.ts`, `presentation/events/lib/upload/uploadMediaPersistFirst.ts` (+ test), `presentation/events/components/steps/Step2Media.tsx`.
  - Deps: ninguna.
- [x] **T4 Portada: persistir antes de subir (S):** mismo orden en `saveMainImage` reusando T3.
  - Acceptance: `mainImage` `processing` con `path` guardado antes del PUT.
  - Verify: test del orquestador; `pnpm typecheck && pnpm test`.
  - Files: `Step2Media.tsx` (+ test existente del orquestador).
  - Deps: T3.

### Checkpoint A (tras T1-T4)
- [ ] `pnpm typecheck && pnpm test && pnpm build` y `npm run build && npm test` (functions) en verde
- [ ] Revisión con `agent-skills:review` (diff completo)
- [ ] **Preguntar al usuario** antes de desplegar functions a develop; prueba manual: 6 archivos, 0 `No media item found` en logs
- [ ] Revisión humana antes de seguir

## Fase 2 — Recuperación
- [x] **T6 Server action `retryEventMedia` (M):** reescribe el original con `rewriteTo` (confirmado en T0). Auth, dueño/admin (reusar helper existente), original existe?, ya hay `optimized_*` → `ready`, si no reescribir original, si no existe original → `error` con mensaje; idempotente.
  - Acceptance: criterio 6 del spec; no actúa si el item ya es `ready`; no permite tocar eventos ajenos.
  - Verify: test de la decisión (función pura `decideRetry`), test de autorización; `pnpm typecheck && pnpm test`.
  - Files: `app/actions/events/retry-event-media.action.ts`, `app/actions/events/lib/decideRetry.ts` (+ test).
  - Deps: T0, T1.
- [x] **T7 UI "Reintentar" (S):** botón tras 3 min en `processing`/`error`; estado de carga; refresco desde Firestore.
  - Acceptance: aparece solo pasado el umbral; al pulsar llama a T6 y muestra resultado; accesible (aria, foco).
  - Verify: test de `isRetryable(item, now)`; `pnpm typecheck && pnpm test`; revisión visual a 390 px.
  - Files: `MediaDropzone.tsx`, `presentation/events/lib/media/isRetryable.ts` (+ test), `FormRemoteDataSyncer.tsx` (si hace falta refrescar).
  - Deps: T6.
- [ ] **T8 Alerta de logs (S) — preguntar antes:** métrica/alerta en Cloud Logging para `No media item found` pasada la ventana (severity ERROR del nuevo log).
  - Acceptance: política creada en prod con canal existente; documentada en `docs/`.
  - Verify: `gcloud alpha monitoring policies list` muestra la política; prueba con log sintético si el usuario lo autoriza.
  - Files: `docs/` (comando/definición). Sin código de app.
  - Deps: T2.

### Checkpoint final
- [ ] Todos los criterios de aceptación del spec (1-8)
- [ ] `pnpm typecheck && pnpm test && pnpm build` y functions verdes
- [ ] 3 pruebas manuales de 6 archivos en develop sin ítems atascados
- [ ] `agent-skills:review` + `security-and-hardening` sobre T6 (server action con auth)
- [ ] Orden explícita del usuario antes de desplegar a prod (`agent-skills:ship`)


---
# Módulo `image-quality` (SPEC-image-quality.md) — añadido 2026-11-05
Medición previa (SSIM, fotos de Multicentro, escritorio 1920): cadena actual 0,913/0,870 → 1920 px + q90 guardado + `/_next/image` q90: 0,986/0,966. Subir a 2400 px no aporta. Casi toda la mejora viene de pasar `/_next/image` de q75 a q90.
- [x] **Q1 functions:** `encodeWebp.ts` (`EVENT_IMAGE_OPTIONS` 1920 px / q90 / effort 5) + `compressImage` lo usa; solo los triggers de eventos pasan las opciones (sesiones, sitios y perfil conservan las suyas). Tests 24/24. Commit 02a5004 (repo functions).
- [x] **Q2 app:** `images.qualities: [75, 90]` en `next.config.ts` y `quality={90}` en `EventHero` y `EventMedia` (diapositivas). Verificado en dev: `q=90` → 200 y archivo mayor; `q=80` → 400.
- [ ] **Q3 despliegue:** functions a develop → subir una foto de Multicentro a un evento de develop → comparar a ojo con la anterior (usuario) → luego prod con orden explícita.
  - Pendiente decidir: ¿extender 1920/q90 a sitios y sesiones? (hoy NO).


---
# Módulo `session-media-race` (SPEC-session-media-race.md) — 2026-11-05
- [x] **S1 functions:** `patchEventMedia` acepta `docPath`; los triggers de sesiones (galería imagen/video) lo usan (reintento 5 min, sin marcar error mientras reintenta) y la portada guarda `mainImage.originalPath`. Se eliminan `patchSessionMediaByPath`/`markSessionMediaError`. Tests 26/26. Commit 1d9cf4d (functions).
- [x] **S2 app:** `SessionForm` sube galería y portada con persistir-primero (+ rollback si falla el guardado, aviso si falla la subida, revisa `{success:false}`); `EventSessionFirebaseRepository.update` fusiona con `mergeMediaStatus` en transacción. Guardia de regresión en `sessionPersistFirst.test.ts`. Tests 361/361, build OK.
- [ ] **S3 "Reintentar" en sesiones:** `retryEventMedia` solo cubre eventos; extender a `events/{e}/sessions/{s}` (spec criterio 4). Pendiente.
- [ ] **S4 despliegue:** functions de sesiones (`optimizeSessionImages`, `optimizeSessionVideos`) y app; probar en develop con 6 archivos en una sesión; prod con orden.
