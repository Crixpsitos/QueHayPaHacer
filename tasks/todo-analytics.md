# Tareas: `social-visits` (GA4) — ver tasks/plan-analytics.md

Comandos: `pnpm typecheck` (hace typegen) · `pnpm test` · `pnpm lint` (hay 8 `any` previos, no tocar) · `pnpm build`.
Convención: un commit por tarea; marcar [x] al terminar; no desplegar sin orden explícita.

## Fase 0 — Verificar
- [ ] **T0 Spike (S)** — Leer los tipos del SDK `firebase/analytics` 12.19 (`setConsent`, `setUserProperties`, `isSupported`, opción `send_page_view`) y probar en develop que con consentimiento `denied` el primer ping sale sin cookies. Confirmar measurementId de develop y que el de prod = el que dio el usuario (el usuario lo mira en consola o autoriza leer el secreto).
  - **Avance 2026-11-05 15:25 (leído con permiso del usuario, solo el secreto `firebaseMeasurementId` de develop):** develop = `G-9WQ0EDSYJ0`, prod = `G-H2HVSKEBNZ` (dado por el usuario; NO leído de Secret Manager) → propiedades distintas, no se mezclan datos. SDK `@firebase/analytics` 0.10.25 expone `setConsent(settings)` (global, sin instancia), `initializeAnalytics(app, {config:{send_page_view:false}})`, `setUserProperties`, `setAnalyticsCollectionEnabled`, `isSupported()`. Falta: (a) confirmar que el backend de develop recibe `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` en runtime (el yaml no lo declara; se verá en el HTML/JS desplegado en T3), (b) probar en runtime que `setConsent` denegado ANTES de `initializeAnalytics` produce pings sin cookies y que `granted` después los habilita.
  - Acceptance: nota en el plan con el comportamiento real y la decisión (Consent Mode vs plan B).
  - Verify: evento visible en GA4 Tiempo real/DebugView desde develop.
  - Files: ninguno de producción (script/nota).

## Fase 1 — Núcleo
- [x] **T1 Helpers puros (S)** — `app/lib/analytics/events.ts`: `isTrackablePath(pathname)`, tipos de eventos y `sanitizeParams()` con lista permitida (rechaza `uid`, `email`, textos libres, longitudes > 100).
  - Acceptance: rutas privadas → false; `/eventos/abc`, `/donde-ir/x`, `/`, landings → true; params con `uid`/`email` se eliminan.
  - Verify: `pnpm test` (rojo primero, luego verde).
  - Files: `app/lib/analytics/events.ts`, `events.test.ts`.
- [x] **T2 Cliente de analytics (M)** — `app/lib/analytics/client.ts`: init diferido (import dinámico, `isSupported()`), `track()`, `setLoginState()`, `setConsent()`; no-op si SSR, sin ID, bloqueado o sin soporte; todo en try/catch.
  - Acceptance: sin `measurementId` no lanza ni importa el SDK; con fake de analytics llama a `logEvent` con params saneados.
  - Verify: `pnpm test` con SDK simulado; `pnpm typecheck`.
  - Files: `client.ts`, `client.test.ts` (dependencia: T0, T1).
- [x] **T3 Proveedor + page_view + login_state (M)** — `app/components/analytics/AnalyticsProvider.tsx` (client, sin UI) montado en `app/layout.tsx` bajo `<Suspense fallback={null}>`: `page_view` por ruta/UTM (solo públicas), `login_state` desde `useAuth()`.
  - Acceptance: navegar entre 3 páginas públicas = 3 `page_view`; entrar a `/studio` = 0; con sesión `login_state=logged_in`, sin sesión `anon`.
  - Verify: `pnpm typecheck && pnpm test && pnpm build`; manual en develop con DebugView.
  - Files: `AnalyticsProvider.tsx`, `app/layout.tsx` (dependencia: T2).

### RESULTADO T0–T3 (verificado local 2026-11-05 15:40, Playwright + `window.dataLayer`; script en ~/.cache/qhpa-qa/ga-probe.mjs)
- OK: `consent default` (todo `denied`) sale ANTES de `config`; `send_page_view:false`; `login_state:"anon"`; `page_view` con `page_location` limpio (UTM sí, `token` no) y `page_path`; 0 cookies. El entorno usa el ID de develop `G-9WQ0EDSYJ0`.
- NO verificado: que Google RECIBA los datos. Este equipo no alcanza `googletagmanager.com` (ni con curl): `ERR_CONNECTION_REFUSED`. Falta verlo en develop desplegado (Tiempo real de GA4). Requiere orden del usuario para subir a develop.
- **DECISIÓN DEL USUARIO PENDIENTE:** aun con consentimiento `denied`, el SDK de Firebase crea en IndexedDB `firebase-installations-database` (ID de instalación, no es cookie) y envía `firebase_id`. Opciones: (1) iniciar Analytics SOLO tras aceptar (más estricto con Ley 1581; sin aceptación no se cuenta nada, ni anónimo); (2) iniciar siempre y declararlo en la política como identificador técnico (cuenta mejor el tráfico, la política debe decirlo). Por defecto el código hace (2) y T4b lo redacta; cambiar a (1) es una línea.

### Checkpoint 1 — tras T0–T3
- [ ] Tests/typecheck/build verdes; visita anónima a una ficha aparece en Tiempo real (develop) con su fuente (`?utm_source=facebook` incluido); 0 escrituras Firestore nuevas.
- [ ] Revisión del usuario antes de seguir.

## Fase 2 — Consentimiento (UI)
- [x] **T4 Aviso de consentimiento (M)** — banner accesible (aceptar y rechazar con el mismo peso visual, teclado, foco, `role="dialog"` no bloqueante, 320–1440 px), recuerda la decisión en `localStorage` (con try/catch) y enlace "Preferencias de cookies" en el pie para cambiarla. Textos claros en español; enlace a la política (ver pregunta 2). Seguir ui-design/frontend-design con la identidad actual (ver DESING.md); sin "dark patterns". Convive con `InstallBanner` (no apilarse en móvil).
  - Acceptance: primera visita muestra el aviso; aceptar → `granted`; rechazar → sigue `denied`; recargar no reaparece; el pie permite cambiar.
  - Verify: tests de la lógica de estado; revisión con `web-design-guidelines`; prueba manual a 390 px y escritorio.
  - Files: `ConsentBanner.tsx`, `consent.ts`(+test), pie de página, `layout.tsx` (dependencia: T2).

- [ ] **T4b Política de privacidad (S)** — `app/(home)/privacidad/page.tsx` sección "Cookies": hoy afirma que no hay cookies de seguimiento de terceros; con GA4 deja de ser cierto. Redactar: qué mide Google Analytics (visitas, origen, eventos de uso), solo con tu aceptación, sin datos personales, cómo cambiar la decisión; actualizar la lista de proveedores. Revisar dónde se compara `LEGAL_VERSION` (`app/lib/legal/version.ts`) antes de subirla: si fuerza a re-aceptar a todos, preguntar. El usuario aprueba el texto legal.
  - Acceptance: la política describe GA4 y coincide con lo que hace el aviso; sin contradicciones.
  - Verify: lectura del usuario; `pnpm build`.
  - Files: `privacidad/page.tsx`, posible `version.ts` (dependencia: T4).

### Checkpoint 2 — tras T4 y T4b
- [ ] Aviso aprobado por el usuario (copy y diseño) en develop.

## Fase 3 — Eventos de producto
- [x] **T5a Ver ficha y clics (M)** — `view_item` (tipo evento/sitio, id, categoría) en detalle de evento y de sitio; `click_whatsapp` (`BookingButton`), `click_como_llegar` (`SiteDetailContainer`).
  - Acceptance: cada acción emite 1 evento con params permitidos; sin uid/email.
  - Verify: tests de los helpers de eventos; manual con DebugView.
  - Files (≤5): `BookingButton.tsx`, `SiteDetailContainer.tsx`, detalle de evento, helper de `view_item`.
- [x] **T5b Compartir, like, inscripción, búsqueda (M)** — `share` (`SocialShareBar`, `FeaturedEventCard`, `ShareProfileButton`, con `method`), `like` (`EventDetailActions`), `register_event`, `search`/filtros (solo categoría/tipo, nunca el texto libre).
  - Acceptance: igual que T5a; el texto de búsqueda NO se envía.
  - Verify: tests + manual.
  - Files (≤5): los componentes de arriba (dependencia: T5a).

### Checkpoint 3 — tras T5
- [ ] Tabla "evento → dónde se dispara" revisada por el usuario; todo verde; reportes de GA4 muestran los eventos.

## Fase 4 — Protección de abuso de lo que ya escribe (spec, sección obligatoria)
- [x] **T6a Endurecer `/api/sites/[id]/track` (M)** — tope GLOBAL por instancia además del de IP (descarta con 204 sin tocar Firestore), exigir `Sec-Fetch-Site: same-origin`, `Content-Type` JSON y cuerpo ≤ 1 KB, y en el cliente (`app/lib/siteTrack.ts`) una sola vista por sitio/navegador/día (`localStorage`, con try/catch) y solo con pestaña visible.
  - Acceptance: 1000 POST seguidos = 0 escrituras tras el tope; recargar la ficha el mismo día = 0 beacons nuevos; peticiones cross-site → 403/204 sin escribir.
  - Verify: test del limitador global y de validación; manual contando escrituras en develop.
  - Files: `app/api/_lib/ipRateLimit.ts`, `app/api/sites/[id]/track/route.ts`, `app/lib/siteTrack.ts`, tests.
- [x] **T6b (AUTORIZADO) Lecturas de `recordEventView`** — evitar `get()` por cada vista de usuario con sesión: `create()` en vez de get+set y no llamar si el cliente ya marcó "visto". Toca `analytics.views` (ranking): confirmar con el usuario y comprobar si `analytics.score` depende de las vistas ANTES.
- [ ] **T6c (AUTORIZADO, pero SIN subir costos; confirmar el valor con el usuario antes de aplicar)** — `maxInstances` es solo un techo; NO tocar `minInstances` (sigue 0). Fijar `maxInstances` en `apphosting.production.yaml` y alerta de solicitudes/presupuesto; runbook.

## Fase 5 — Documentación y revisión
- [x] **T7 Guía del dueño (S)** — `docs/` (y runbook): cómo registrar la dimensión personalizada `login_state`, reportes útiles (canal, red social, páginas, eventos), plantilla de enlaces con UTM por red (Facebook, Instagram, TikTok, WhatsApp, QR), límites de GA4 (subestima).
- [ ] **T8 Revisión (M)** — `agent-skills:code-reviewer` y `security-auditor` con el diff (sin darles mis conclusiones), `web-performance-auditor`/Lighthouse antes y después (LCP/TBT no deben empeorar), `pnpm typecheck && test && lint && build`. Corregir hallazgos.

## Fase 6 — Ship
- [ ] **T9 Producción (S) — solo con orden explícita** — merge `--no-ff` a `main` desde worktree temporal, push, rollout de App Hosting por REST, verificar con el ID real (`G-H2HVSKEBNZ` vía secreto) en Tiempo real de GA4, plan de reversa (`git revert -m 1`). Sin tocar functions.
- [ ] Actualizar memoria (`remaining-tasks-2026-11-05.md`): punto 7 hecho/pendiente.

### Checkpoint final
- [ ] Criterios de la spec: UTM→fuente correcta en GA4; rutas privadas = 0 envíos; 0 escrituras Firestore por visita; ningún parámetro personal; typecheck/test/lint/build verdes.
