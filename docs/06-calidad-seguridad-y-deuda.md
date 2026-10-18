# Calidad, seguridad y deuda

## 1. Estado de validación observado

### Baseline previo a P0 (**2026-10-10**)

Instalación limpia `pnpm install --frozen-lockfile`, Node 22.17.0, pnpm 12.6.0, Next 16.3.5:

| Validación | Resultado |
|---|---|
| Tests TypeScript | 50/50 aprobados. |
| ESLint global | 159 problemas: 66 errores y 93 warnings. |
| Typecheck (`tsc --noEmit`) | 14 errores: TS2345 `Bucket` de Storage 7.22 vs 8.2 en `FirebaseStorageService`; TS2307 `framer-motion` (8 archivos) y `dompurify` (3 archivos), dependencias fantasma no declaradas (funcionaban con hoisting de npm, fallan con pnpm estricto); TS2304 `LayoutProps`/`RouteContext` porque los tipos de rutas requieren `next typegen` antes. |
| Build | Falla. Tras corregir typecheck fallaba por import fantasma `@google-cloud/firestore` y por fuente `Outfit` de `next/font` con array de pesos. |

### Después de P0 (**2026-10-10**)

| Validación | Resultado |
|---|---|
| `pnpm typecheck` (`next typegen && tsc --noEmit --pretty false`) | PASS. |
| `pnpm test` (`tsx --test`) | 58/58 PASS (16 archivos). |
| ESLint en archivos tocados | 0 errores nuevos; los hallazgos restantes en archivos de `presentation` tocados son preexistentes. |
| ESLint global | 53 errores / 88 warnings (baseline 66/93). |
| `pnpm build` | **PASS** (2026-10-10, tras reabrir la cuenta de facturación de develop): 44 páginas generadas, sin errores ni warnings. |

Riesgo registrado por el build: `VerifiedCreatorsSection` → `UserService.getVerifiedCreators` → `UserFirebaseRepository.findAll` lee la colección `users` completa (costo/performance).

## 2. Cobertura de tests

Hay 16 archivos y 58 casos. Cubren principalmente:

- política de moderación;
- username;
- geolocalización;
- validación de sesiones;
- utilidades temporales;
- mapper de sesiones;
- colaboración básica;
- interacciones semanales;
- membresía;
- timeline de perfil;
- selección de imágenes del perfil;
- guard de sesión en Server Actions (`_session.test.ts`);
- `safeRedirect`, `openStatus` de sitios, CSV de Studio, `bogotaMonthStart` y mapper de perfil.

No se midió cobertura porcentual. No debe inventarse un porcentaje.

Faltan suites para:

- auth email/Google y refresh de sesión;
- Server Actions críticas;
- repositorios de eventos/sitios/perfil;
- formulario completo de evento/sesión/sitio;
- publicación y moderación de extremo a extremo;
- pagos externos/registro;
- uploads;
- Studio real;
- componentes UI;
- accesibilidad;
- E2E Playwright versionado;
- regresión visual.

## 3. P0: bloqueos antes de release

Estado al **2026-10-10**. Todo el trabajo está local y sin commit.

### P0-1. Build roto por Storage — CERRADO (código)

Causa: dependencia directa `@google-cloud/storage@7.22` mientras `firebase-admin@14.4` usa 8.2. Su único uso era `TransferManager` en `uploadMany`, código muerto (no está en `IStorageService`, cero llamadores) y además con bug: `uploadManyFiles` usaba prefijo + ruta temporal local completa como destino, mientras el método devolvía prefijo + basename → URLs a objetos inexistentes.

Corrección:

- eliminados `uploadMany`, `TransferManager` y la lógica de archivos temporales; eliminada la dependencia directa. Upload, URLs firmadas y delete sin cambios;
- imports fantasma: `framer-motion` → `motion/react` (`motion` ya era dependencia); `dompurify` → `isomorphic-dompurify` (ya declarado, antes sin uso);
- declarado `@google-cloud/firestore@^9.2.0` (misma versión que `firebase-admin`, deduplicada);
- `Outfit` ahora variable (sin array de pesos) en `app/layout.tsx`; sin eso el build fallaba con "next/font/google queries have exactly one entry";
- scripts `typecheck` y `test`, devDep `tsx`, `allowBuilds` de `esbuild` en `pnpm-workspace.yaml`.

`pnpm build` completo: PASS (2026-10-10). La causa del bloqueo era la cuenta de facturación de develop cerrada, no el código.

### P0-2. Endpoint administrativo mutante sin autenticación — CERRADO

- Eliminados `GET /api/admin/seed-badges` y `app/actions/admin/seed-badges.action.ts` (también invocable como Server Action pública). Reemplazo: `scripts/seed-badges.ts` (dry-run por defecto, `--apply` para escribir, idempotente).
- Eliminado `app/api/revalidation/events/route.ts` (handler vacío, sin llamadores).

La auditoría encontró IDOR **crítico** en Server Actions que confiaban en el `uid` enviado por el cliente (las Server Actions son endpoints POST públicos):

| Acción | Riesgo |
|---|---|
| `changePasswordAction` | Toma de cuenta: fijar la contraseña de cualquier usuario por `uid`. |
| `deleteAccountAction` | Borrar cualquier cuenta. |
| `updateProfileAction`, `updateProfileVisibilityAction`, `updateAvatarAction`, `updateBannerAction` | Modificar perfil ajeno. |
| `confirmAttendanceAction`, `removeParticipantAction` (Studio) | Sin verificación de propiedad del evento. |
| `generateUploadUrl` | URLs firmadas de escritura para cualquiera. |
| `updateTagAction` | Invalidaba cualquier tag. |
| `recordEventViewAction` | Confiaba en `userId` del cliente. |
| `googleAuthAction` | Usaba `googleUser.uid` del cliente separado del `idToken` verificado. |

Corrección:

- nuevo `app/actions/_session.ts` con `getSessionUid()` (`getTokens` desde cookie), `getPremiumSessionUid()`, `isStudioEventOwner(eventId)`, `isStudioSiteOwner(siteId)` y `canViewProfile(uid)`; todas las acciones listadas verifican (matriz en `docs/09`);
- `generateUploadUrl` exige sesión y valida entidad/mime/`fileName`; `updateTagAction` con allowlist `featured-events`;
- registro de vistas separado: interno `app/actions/events/_recordEventView.ts` (para server components dentro de `after()`, donde `cookies()` no está permitido) y acción pública que deriva el uid de la sesión;
- `googleAuthAction` verifica `verifyIdToken(idToken).uid === googleUser.uid`;
- test de regresión `app/actions/_session.test.ts`: chequeo estático de que todo archivo `"use server"` que mencione `uid`/`userId` usa un guard de sesión (allowlist: `check-username-availability`, `register`).

`/api/profile/{badges,events,sites}?uid=` exigen `canViewProfile` (perfil público o propio); `/api/profile/stats` y `/api/profile/likes` se eliminaron. No existe rol/claim admin; no se inventó.

### P0-3. Reglas Firebase no versionadas — PARCIAL

Evidencia: todo acceso a datos del servidor usa Admin SDK (salta reglas). El SDK cliente solo hace `onSnapshot` de lectura sobre `events/{id}` (`EventForm`), `events/{id}/sessions/{sid}` (`SessionForm`) y `sites/{id}` (estado del optimizador), vía `subscribeWhenAuthed`, por el autor mientras edita. El cliente nunca usa el SDK de Storage (uploads por URLs firmadas V4).

Versionado como **propuesta**:

- `firebase/firestore.rules`: lectura solo del autor en esas tres rutas; deny para todo lo demás;
- `firebase/storage.rules`: deny total al SDK cliente;
- `firebase/firestore.indexes.json`: export real de solo lectura de develop (`quehaypahacer-db`), 4 índices sobre `events`, `registrations`, `sites`, `users` (incluye búsqueda de texto tokenizada).

Las reglas **no** están cableadas en `firebase.json` ni desplegadas: primero hay que hacer diff contra las reglas activas en consola.

Hallazgo: Prod (`quehaypahacer-prod/quehaypahacer-db`) tiene 0 índices. Firestore Enterprise (modo nativo) ejecuta consultas sin índice vía table scan (más lento/costoso); la búsqueda por texto sí requiere el índice tokenizado → **bloqueo de release para búsqueda**, riesgo de costo para el resto.

Pendiente: tests de reglas con emulador (requiere `@firebase/rules-unit-testing` + emulador), diff y despliegue de reglas, despliegue de índices a prod.

### P0-4. Studio mezcla datos reales y mock — CERRADO

- Eliminados `MOCK_STUDIO_OVERVIEW` y el fallback en `app/(studio)/studio/page.tsx` (`getRegistrationsTimeline` está implementado; el fallback solo se activaba en error, mostrando datos falsos). Corregido también el error de lint JSX-en-try/catch ahí.
- Eliminados `presentation/studio/lib/studioEventsMock.ts` y `presentation/sites/lib/mock-data.ts` (sin consumidores).
- Eliminado el campo falso `trend` (calculado `(clicks % 40) - 15`) de la entidad `Studio`, view model y repositorio (nunca se renderizaba).
- Eliminado `console.log` de depuración del uid en `getRegistrationsTimeline`; actualizados comentarios "STUBS/MOCK".

Restante sin implementar: `getFormResponses` (`[]`) y `getAudienceSummary` (`null`); ninguna UI los consume.

### P0-5. Cache Redis sin invalidación y cuota excedida — CERRADO

Eliminados `cache-handler.js` y `cacheHandlers` de `next.config.ts` (con comentario). Motivo: el handler no implementaba invalidación por tags (`updateTags`/`refreshTags` no-op, `getExpiration` 0), así que `updateTag`/`revalidateTag` nunca invalidaban Redis; conectaba al importar sin fallback; `REDIS_URL` no estaba en los YAML de App Hosting; incidente de cuota **2026-09-26**.

Ahora se usa el handler en memoria por defecto de Next, por instancia. Techo: no hay invalidación entre instancias; otras instancias sirven datos viejos hasta expirar (Cloud Run `minInstances: 0`). Eliminadas dependencias `redis` y `@upstash/redis` (sin uso). Redis no se vació ni se tocó.

Reintroducir un handler compartido solo con invalidación real de tags + `refreshTags` + fallback.

### P0-6. Pipeline de calidad inexistente — PARCIAL

`.github/workflows/ci.yml` en PR y push a `main`/`develop`:

- lockfile único (falla si existe `package-lock.json` o `yarn.lock`);
- grep de secretos commiteados (`.env*`, `*AccountService*.json`, `serviceAccount*.json`, bloques `PRIVATE KEY`);
- `pnpm install --frozen-lockfile`, `typecheck`, `test`;
- `lint` con `continue-on-error` hasta P1 cero errores ESLint;
- Sin `build` en CI: App Hosting compila en cada rollout. CI no requiere secretos.
- sin deploy.

`package.json`: `packageManager: pnpm@12.6.0`, `engines.node >=22` (Storage 8 requiere Node >= 22).

Abierto:

- el check de lockfile falla hoy porque `package-lock.json` sigue versionado (y ya desactualizado frente a `package.json`); su borrado espera acuerdo del owner;
- secrets/vars de CI deben configurarse en GitHub por el owner.

## 4. P1: seguridad

### Autenticación y autorización

- `proxy.ts` protege algunas rutas.
- Studio tiene `StudioGate` y plan Premium.
- APIs bajo `/api` quedan fuera del matcher general y deben autenticarse individualmente.
- Ownership y permisos se validan de manera distribuida en acciones/repositorios.

Riesgo: una ruta nueva puede olvidar el check. Se necesita helper central y matriz de permisos, no necesariamente una reescritura del proxy.

### Rate limiting

No se encontró implementación de rate limit/throttle. Debe cubrir:

- login/registro;
- contacto;
- búsqueda/geocoding proxy si se agrega;
- likes/views/shares;
- uploads/signed URLs;
- moderación;
- APIs administrativas.

### Webhook de moderación

Fortalezas:

- secret obligatorio;
- comparación timing-safe;
- validación Valibot;
- errores 401/400/404/500.

Faltan idempotencia, replay protection, auditoría y retry operativo.

### Eliminación de cuenta

Auth, Firestore y Storage no comparten transacción global. Hay riesgo de datos huérfanos si una fase falla. Se requiere saga/job reconciliador y política de retención.

### PII y logs

Existen logs de `uid`, inputs y debugging. Debe prohibirse registrar:

- email/teléfono completos;
- tokens/secrets;
- service account;
- respuestas de formularios;
- signed URLs;
- contenido privado.

## 5. P1: calidad y mantenibilidad

### ESLint

Errores globales incluyen:

- hooks y setState en effects;
- acceso a variables antes de declaración;
- memoización incompatible con React Compiler;
- `any`;
- variables sin usar;
- accesibilidad.

Debe crearse baseline y reducirse a cero errores antes de exigir “no nuevos errores”.

### Componentes y repositorios grandes

Los archivos grandes concentran riesgos. La estrategia debe ser:

1. tests de caracterización;
2. extraer responsabilidades observables;
3. mantener contratos;
4. medir antes/después.

### Logging de depuración

Hay mensajes como `probandooooo`, dumps de memoria/pipelines y emojis. Deben eliminarse o migrarse a logger con niveles.

### Endpoint de revalidación incompleto

Resuelto el **2026-10-10**: `app/api/revalidation/events/route.ts` eliminado (handler vacío, sin llamadores). Ver P0-2.

### Error boundaries

Desde el **2026-10-10** existen `app/error.tsx`, `app/global-error.tsx` y `app/(studio)/studio/{loading,error}.tsx`. Faltan boundaries en otras rutas críticas (eventos, sitios, perfil).

## 6. P1: performance y datos

- `minInstances: 0` implica cold starts aceptables solo si producto los tolera.
- MapLibre, TipTap y Recharts pueden aumentar bundle; no hay análisis versionado.
- Perfil ya evita N+1 al resolver eventos/autores por lotes, pero Studio requiere auditoría de consultas.
- Compatibilidad de esquemas aumenta ramas y coste.
- Cache distribuido puede impedir consistencia read-your-own-writes.
- No hay prueba de carga para Home, Explorar, detalle y Studio.

## 7. P1: SEO y accesibilidad

### SEO

- `app/sitemap.ts` solo incluye home, `/eventos`, `/donde-ir` y landings; faltan URLs de detalle de evento/sitio;
- sin JSON-LD `Event` en el detalle de evento (solo en cards/colecciones; sitios tienen `SiteJsonLd`);
- la descripción del evento se renderiza en cliente (`EventDetailClient`, `useEffect` + DOMPurify): no está en el HTML SSR;
- canonical y previews requieren auditoría;
- perfiles privados no deben indexarse.

### Accesibilidad

- no hay axe automatizado;
- tablas y drawers tienen warnings conocidos;
- falta QA de teclado/lector de pantalla;
- alt text no es obligatorio de forma uniforme.

## 8. P2: deuda arquitectónica/documental

- typo `infraestructure`;
- mezcla inglés/español en naming;
- dos lockfiles;
- documentos históricos contradictorios;
- `DESING.md` mal nombrado;
- DTOs duplicados;
- adaptadores cliente inconsistentes;
- componentes con hex directos;
- dark classes en producto light-only;
- `next-themes` sin decisión de uso;
- compatibilidad de datos sin fecha de retirada;
- sin ADRs.

## 8.1 Deuda conocida abierta (auditoría **2026-10-10**, verificada en código)

Seguridad/contratos:

- **Colaboradores vía save del evento**: `FormEventSchema` acepta `collaborators`/`collaboratorsData` y `update-event.action.ts` hace `...event`, así que el save persiste colaboradores (viola el contrato "solo por operaciones atómicas"). Refactor pendiente.
- **Sin tope de tamaño de upload** en `generateUploadUrl` (requiere firmar `x-goog-content-length-range`; sin probar).
- **Sin rate limiting** en ninguna superficie.
- `login.action.ts`/`register.action.ts` usan el SDK cliente de Firebase (`createClientContainer`) dentro de Server Actions; debería autenticarse en cliente y enviar `idToken`.
- `respond-collaborator-invitation` no exige Premium (intencional, pendiente de decisión de producto).

Decisiones de producto pendientes:

- Perfil privado: `PublicProfileContainer` sigue renderizando `PublicProfileHeader` (bio/website/estadísticas) aunque oculta las tabs.
- `delete-account.action.ts` borra usuario Firestore + Auth sin cascada de eventos/sitios/registros/Storage.

Datos/SEO/rendimiento:

- Paginación de Explorar mezcla categorías (`presentation/events/data/exploreFetchers.ts`).
- Fetchers de detalle duplicados (`getEventById` por id) en `HomeEventsRecomendationContainer`, `AllEventsContainer`, `lib/preferenceEvents.ts` y `data/exploreFetchers.ts` además de `data/eventDetailFetchers.ts`.
- Fechas sin zona `America/Bogota` en el detalle público (`EventDetailClient`, `PublicSessionCard` con `date-fns` `format`); helpers `fmtBogo`/`bogoDay` duplicados en `FeaturedEventCard` y `SiteItineraryCard`.
- `use cache` anidados con lifetimes distintos (`hours`/`days`/`weeks`) en `HomeEventsRecomendationContainer`, `AllEventsContainer` y `CampaignCarouselContainer`.
- Likes: `EventCardInteractive` hace un `fetch('/api/events/likes')` por card.
- Doble conteo de vistas: `recordEventViewAction` al hacer click en la card + `recordEventView` en `after()` del detalle (`EventDetailContainer`, `SessionDetailContainer`).

## 9. Riesgos funcionales

| Área | Riesgo |
|---|---|
| Auth | Desincronización cookie/custom token/SDK cliente. |
| Publicación | Estados de evento/moderación distribuidos. |
| Multi-date | Rango padre y sesiones pueden divergir. |
| Registro | Formularios y cupos sin E2E; concurrencia debe probarse. |
| Sitios | Autosave/uploads y moderación complejos. |
| Colaboradores | Denormalización obsoleta, invitaciones concurrentes. |
| Studio | Repositorio grande (mocks eliminados). |
| Perfil | Caché de identidad tras cambios. |
| Premium | Asignación manual sin proceso comercial/auditoría. |

## 10. Estrategia de testing requerida

### Unitarios

- políticas de estados/permisos;
- mappers y DTOs;
- fechas, precios, cupos;
- tags de caché.

### Integración con emuladores

- Auth;
- Firestore rules;
- Storage rules;
- username transaccional;
- likes/contadores;
- registros/cupos;
- colaboradores.

### E2E

1. registro/login/logout;
2. verificación de email;
3. crear borrador y publicar evento;
4. moderación pre/post;
5. crear/publicar sitio;
6. like/share/registro;
7. perfil/trayectoria;
8. upgrade administrativo a Premium;
9. multifecha;
10. Studio y asistencia.

### No funcionales

- Lighthouse/Core Web Vitals;
- axe;
- carga;
- imágenes/medios;
- backup/restore;
- seguridad de endpoints.

## 11. Definition of Done técnica

Una tarea no está terminada si falta alguno aplicable:

- contrato de negocio preservado;
- autorización en servidor;
- validación de input;
- estado loading/empty/error;
- responsive y accesibilidad;
- invalidación de caché;
- test automatizado;
- lint/typecheck/build verdes;
- documentación/runbook actualizado;
- observabilidad suficiente;
- migración/rollback si cambia datos.