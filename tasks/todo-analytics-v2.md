# Tareas: `analytics-v2`

Plan: `tasks/plan-analytics-v2.md`. Spec: `SPEC-analytics-v2.md`. Cada tarea: un commit, `pnpm test` + `pnpm typecheck` verdes antes de marcar. Rutas explícitas en `git add` (nunca `-A`).
Comandos: `pnpm test`, `pnpm typecheck`, `pnpm build`. Tamaño: S ≤ 2 archivos, M 3–5.

## Fase 0 — Línea base

- [x] **T0 Línea base (S)** — `scripts/analytics-baseline.ts` (solo lectura).
  - Aceptación: imprime y guarda JSON fechado en `~/.cache/qhpa-qa/baselines/` con, por `events` y `sites`: total y promedio de views/likes/shares/registrations/clicks, y cuántos eventos tienen `views == 0`.
  - Verifica: corre contra develop; **pedir permiso al usuario para correrlo contra prod** (lectura).
  - Archivos: `scripts/analytics-baseline.ts`.

## Fase 1 — `measure`

- [x] **T1 Tipos y clasificador de origen (S)** — dominio puro.
  - Aceptación: `EVENT_TRACK_TYPES` + `isEventTrackType`; `trafficSource({utm_source, ref, qr})` devuelve una de la lista cerrada; `instagram.com`, `l.facebook.com`, `utm_source=ig`, `qr=<código>` → `link:<código>`; desconocido → `other`; vacío → `direct`.
  - Verifica: `pnpm test` (tests nuevos primero, ver fallar, luego implementar).
  - Archivos: `domain/entities/analytics/trackTypes.ts`, `trafficSource.ts`, `trafficSource.test.ts`.
- [x] **T2 Servicio y repositorio de conteo de eventos (M)** — escritura.
  - Aceptación: `recordTrack(eventId, type, day, src, sessionId?)` hace un batch: incremento en `events/{id}` (`analytics.views` o `analytics.clicks`) + `events/{id}/stats/{día}` con `bySource.<src>`; evento inexistente se ignora sin lectura (NOT_FOUND, como sitios); `sessionId` suma también a la sesión.
  - Verifica: test del repositorio con doble de Firestore; `pnpm typecheck`.
  - Archivos: `application/dto/events/EventTrackDto.ts`, `application/services/events/EventInteractionsService.ts`, repo de eventos + interfaz, test.
- [x] **T3 Ruta `POST /api/events/[id]/track` con guardas (M)**
  - Aceptación: `isSameOriginBeacon`, cuerpo ≤ 1 KB, valibot, `createIpLimiter`, `createGlobalLimiter(120)`, `Set` en memoria de `SHA-256(IP+UA+sal diaria)` con vencimiento 24 h; todo lo rechazado → 204 con **0** escrituras; `type` inválido → 400.
  - Verifica: tests de la ruta (sin same-origin → 204 y repo no llamado; repetido → 1 sola escritura); `pnpm test`.
  - Archivos: `app/api/events/[id]/track/route.ts`, `app/api/_lib/dailyDedupe.ts` (+ test).
- [x] **T4 Hook de cliente y vista (M)** — `useTrackEvent`.
  - Aceptación: envía `view` con `sendBeacon` tras ≥ 2 s visible y en idle, solo en rutas públicas, una vez por navegador y día (`localStorage`); calcula `src` con `trafficSource`; se usa en detalle de evento, multi-fecha y sesión; se **retira** la rama de vista de `/api/events/[id]/viewer` y `recordEventView`.
  - Verifica: tests del hook puro (clave diaria, no repite); Playwright o guion: 3 recargas = 1 petición de `view`.
  - Archivos: `app/lib/analytics/useTrackEvent.ts` (+ test), `EventDetailClient.tsx`, `MultiDateEventDetailClient.tsx`, `viewer/route.ts`, borrar `_recordEventView.ts` si queda sin usos.
- [x] **T5 Acciones de eventos (M)** — whatsapp, cómo llegar, web, reserva, compartir, registro externo.
  - Aceptación: cada botón dispara `track(type)`; el clic de registro externo cuenta en `stats/{hoy}.register_external` además del contador actual.
  - Verifica: tests de mapeo botón→tipo; guion manual de clics en develop.
  - Archivos: `presentation/events/components/*` (los botones), `record-external-registration-click.action.ts`.
- [x] **T6 Sitios: origen en el conteo (S)**
  - Aceptación: `recordTrack` de sitios acepta `src` y escribe `bySource` en el doc diario; sin romper la API ni los tests actuales.
  - Verifica: `pnpm test` (tests de sitios existentes + uno nuevo).
  - Archivos: `SitesFirebaseRepository.ts`, `SiteTrackDto.ts`, `SiteTracker.tsx`.
- [x] **T7 Borrador de texto de privacidad (S)** — documento, sin tocar la ruta legal.
  - Aceptación: borrador en `docs/30-analytics-v2.md` describiendo qué se cuenta (sin datos personales) para revisión del usuario; **no** se cambia `/privacidad` sin su aprobación.
  - Archivos: `docs/30-analytics-v2.md`.

### Checkpoint A (cierra `measure`)
- [x] `pnpm test` y `pnpm typecheck` verdes; `pnpm build` ok.
- [x] Subido a **develop** (avisar antes de empujar); guion de prueba entregado al usuario; el beacon escribe en develop.
- [x] Baseline de develop vs. después; revisión `code-reviewer` + `security-auditor` corregida.
- [x] **Decisión del usuario** (ya en prod 2026-11-09; guion probado por el usuario: 3 recargas = 1 `view`, cada clic en mapa = 1 `track`) para subir a prod (orden explícita).

## Fase 2 — `short-links`

- [x] **T8 Salida rastreada (M)** — `/r/e/[id]?to=…` y `/r/s/[id]?to=…`.
  - Aceptación: lee el destino del documento, 307, cuenta con `after()`; `to` inválido o destino vacío → 404 sin escritura; ningún valor del query llega a `Location`.
  - Verifica: tests de no-redirección-abierta (`?to=https://malo.com` ignorado); `pnpm test`.
  - Archivos: `app/r/e/[id]/route.ts`, `app/r/s/[id]/route.ts`, `app/r/_lib/resolveTarget.ts` (+ test).
- [x] **T9 Botones apuntan a `/r/…` (M)**
  - Aceptación: registro externo, entradas, reserva y redes de eventos y sitios usan la ruta rastreada; el `href` real sigue funcionando sin JS.
  - Verifica: guion de clics en develop; los contadores suben.
  - Archivos: botones de evento y sitio (`presentation/events/…`, `presentation/sites/components/detail/*`).
- [x] **T10 Enlaces de campaña — dominio y ruta `/r/<código>` (M)**
  - Aceptación: `links/{código}` con `create()` y código base62 de 7 caracteres; solo http(s) y hosts públicos; `/r/<código>` → 307 a la ficha con `utm_source` y `qr`; inexistente → 404; stats diarias `links/{código}/stats/{día}`.
  - Verifica: tests de creación (colisión, URL inválida) y de la ruta.
  - Archivos: `domain/entities/links/*`, servicio, repo, `app/r/[code]/route.ts`.
- [x] **T10b Compartir marcado por canal (S)** — los botones WhatsApp/Facebook/X agregan `utm_source=<canal>&utm_medium=share` (`shareUrl`); "copiar enlace" queda limpio; `x` entra a la lista cerrada de orígenes.
  - Archivos: `domain/entities/analytics/shareUrl.ts` (+ test), `trafficSource.ts`, `SocialShareBar.tsx`.
- [x] **T11 "Mis enlaces" en el estudio (M)**
  - Aceptación: el dueño crea un enlace sobre **su** evento/sitio con etiqueta, lo copia y ve clics; no puede crear sobre ajenos (403).
  - Verifica: test de autorización; guion: crear → abrir → ver "1 clic" en ≤ 1 min.
  - Archivos: acción de crear, página `app/(studio)/studio/links/*`, componente de lista.

### Checkpoint B
- [ ] Tests/typecheck/build verdes; guion en develop; `security-auditor` revisó redirecciones.
- [ ] Prod solo con orden explícita.

## Fase 3 — `intent` (puede ir en paralelo con Fase 2)

- [ ] **T12 Guardar: nombre, ícono y contadores privados (M)**
  - Aceptación: "Guardar" (marcador, `aria-pressed`) reemplaza el corazón en tarjetas, detalle y sitios; ningún contador de guardados visible al público (incluido `PublicProfileTabs`); lista del perfil se llama "Guardados"; datos intactos.
  - Verifica: guion visual con los favoritos existentes; `pnpm test`.
  - Archivos: `CardLikeButton.tsx`, `EventDetailClient.tsx`, `SiteCard.tsx`, `PublicProfileTabs.tsx`, textos del perfil.
- [ ] **T13 Voy a ir — dominio y datos (M)**
  - Aceptación: `going` por persona y evento/sesión, idempotente; `analytics.going` (+ agregado de sesiones); si ya está inscrito no cuenta dos intenciones (test de dominio).
  - Verifica: tests; `pnpm typecheck`. **Preguntar** por reglas/índices.
  - Archivos: `EventInteractionsService.ts`, repo, acción `going-event.action.ts`, test.
- [ ] **T14 Voy a ir — interfaz (M)**
  - Aceptación: botón en evento y en cada sesión; "N personas van" solo desde 10; accesible (44 px, foco).
  - Verifica: guion en develop.
  - Archivos: `EventDetailClient.tsx`, `MultiDateEventDetailClient.tsx`, componente del botón.

### Checkpoint C
- [ ] Guion entregado; prod solo con orden explícita.

## Fase 4 — `funnel-report`

- [ ] **T15 Agregación y veredicto (M)** — funciones puras.
  - Aceptación: `buildFunnel(statsDocs)` suma vistas/interés/acción y orígenes; `verdict({views, rate, peers})` → "Pocos datos" si < 30 vistas, comparación solo con ≥ 5 pares; incluye acción sugerida.
  - Verifica: tests (12 vistas → "Pocos datos"; sumas coinciden).
  - Archivos: `domain/entities/analytics/funnel.ts`, `verdict.ts` + tests.
- [ ] **T16 Informe del organizador para eventos (M)**
  - Aceptación: pestaña "Estadísticas" 7/30 días con embudo, origen y veredicto; lee ≤ 30 docs con `"use cache"` + tag; solo el dueño o equipo.
  - Verifica: test de autorización; guion; carga < 2 s.
  - Archivos: `app/(studio)/studio/events/[id]/…`, componente de informe, fetcher cacheado.
- [ ] **T17 Informe para sitios y enlaces (M)**
  - Aceptación: mismo informe para "Mis sitios" y rendimiento por enlace de campaña en "Mis enlaces".
  - Archivos: vistas de sitios y de enlaces; reutiliza T15–T16.
- [ ] **T18 Vista de QHPA `/studio/analitica` (M)**
  - Aceptación: solo `QHPA_ADMIN_UIDS` (no-admin → 403); tops y peores, orígenes, enlaces; benchmark por categoría con caché.
  - Verifica: test de 403; guion.
  - Archivos: `app/(studio)/studio/analitica/page.tsx`, componentes, fetcher.

### Checkpoint D
- [ ] Prod solo con orden explícita. **Aquí se entrega la tabla antes/después parcial** (T0 vs datos de `measure`).

## Fase 5 — `ranking-v2`

- [ ] **T19 Fórmula suavizada (S)** — `(acciones + k·p0)/(vistas + k)`, `k = 20`.
  - Aceptación: poca muestra no supera a mucha muestra con tasa razonable; conserva promoción, urgencia y decaimiento.
  - Verifica: tests de la fórmula.
  - Archivos: `domain/entities/analytics/score.ts` + test.
- [ ] **T20 Modo sombra (M)** — guardar `analytics.scoreV2` sin cambiar el orden visible.
  - Aceptación: sitios en la app; eventos en `../functions` (repo aparte); el orden de las listas **no cambia** (test).
  - Verifica: test de que las consultas siguen ordenando por `analytics.score`; **pedir orden explícita** para desplegar functions.
  - Archivos: `siteRanking.ts`, `../functions/src/utils/calculateTrendingScore.ts`.
- [ ] **T21 Comparación (S)** — tras ≥ 14 días de datos: `scripts/compare-score-v2.ts` imprime top 10 actual vs v2 y por qué cambian.
  - Verifica: entregar el informe al usuario.
- [ ] **T22 Cambio visible (S)** — solo con aprobación del informe de T21: las consultas ordenan por `scoreV2`; reversible con un commit.
- [ ] **T23 Atajos "Hoy" y "Este fin de semana" (S)** — chips en Explorar hacia lo que ya existe (`findTodayEvents`, `/que-hay-hoy-ibague`); primero verificar qué hay para no duplicar.

### Checkpoint E (cierre)
- [ ] Todos los criterios de éxito de la spec cumplidos y medidos.
- [ ] Tabla **antes / después** final + conciliación GA4 vs Firestore entregada al usuario.
- [ ] Memoria del proyecto actualizada.
