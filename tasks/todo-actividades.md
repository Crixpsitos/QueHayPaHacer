# Tareas: `actividades`

Plan: `tasks/plan-actividades.md`. Spec: `SPEC-actividades.md`. Cada tarea: **un commit**, `pnpm typecheck` + `pnpm test` verdes antes de marcar; `pnpm build` en cada checkpoint. Rutas explícitas en `git add` (nunca `-A`). Rama `develop`. Sin `git push` sin avisar (dispara rollout de develop).
Comandos: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm lint`. Tamaño: S ≤ 2 archivos, M 3–5. Lo que pase de 5 archivos se parte.
Convención: **TDD** en toda lógica con ramas (test primero, verlo fallar, luego implementar). Las tareas **P#** son **prototipos en Artifact** (referencia visual, sin código de la app) y se hacen **una a la vez**, justo antes de la tarea de interfaz que desbloquean; el dueño las aprueba antes de codificar.

Estado inicial: todas sin marcar.

---

## Fase 0 — Verificaciones previas (solo lectura)

- [x] **A0 Verificaciones y correcciones de spec (S)** — sin código de la app.
  - Aceptación: (1) confirmar el nombre exacto del método de `UserService` que pasa a `creator` y cómo lo llama `publish-site.action.ts`; (2) confirmar el campo del autor del sitio en dominio, DTO y Firestore (`author.id`/`authorId`); (3) localizar cómo se implementa hoy la búsqueda por tokens (`exploreFetchers`, repositorios) y qué índices usa; (4) listar los índices actuales relevantes en `firebase/firestore.indexes.json` y cómo se aplican; (5) abrir `optimizeMedia`, `optimizeImages` y `optimizeSessions` en `../functions` y anotar qué carpetas/tipos atienden hoy; (6) leer en `node_modules/next/dist/docs/` lo necesario para rutas dinámicas con Cache Components; (7) **corregir la spec** 8.2 punto 1 (gestión fuera de `/studio` por ser Premium) y las rutas de almacenamiento de 8.4; (8) documentar los hallazgos en `tasks/plan-actividades.md`.
  - Verifica: relectura del plan; `git diff` solo en `SPEC-actividades.md` y `tasks/plan-actividades.md`.
  - Archivos: `SPEC-actividades.md`, `tasks/plan-actividades.md`.

---

## Fase 1 — `activity-core` (dominio puro)

- [x] **A1 Categorías, "con quién" y bandas de presupuesto (S)**
  - Aceptación: constante `ACTIVITY_CATEGORIES` (16 slugs de la spec 5.3, con nombre y ejemplos), tipo `ActivityCategory`; `COMPANIONS` (`solo,pareja,familia,amigos,ninos,mascotas`); `budgetBand(priceFromCop)` devuelve `gratis|hasta-20000|hasta-50000|hasta-100000|mas-de-100000`; `isActivityCategory(x)`. `otros` marcado como "siempre a revisión".
  - Verifica: `pnpm test` (límites de cada banda: 0, 1, 20000, 20001, 50000, 100000, 100001).
  - Archivos: `domain/entities/activities/value-objects/ActivityCategory.ts`, `Budget.ts` (+ tests).

- [x] **A2 Motor de recurrencia: reglas y texto legible (M)** — TDD.
  - Aceptación: tipos `ScheduleRule` (`weekly`, `everyNWeeks`, `monthlyNth`, `monthlyDay`, `dates`, `always`, `byAppointment`) y `ActivitySchedule`; `validateSchedule` (horas HH:mm, `end>start`, `n` 2–8, `weekdays` sin repetidos, máx. 7 reglas, `skipDates` ≤60, `dates` ≤52, vigencia coherente); `describeSchedule(schedule)` devuelve texto en español ("Todos los domingos · 6:00 a. m.", "Cada 2 semanas, sábados · 7:00 a. m.", "El último viernes de cada mes").
  - Verifica: `pnpm test` con casos válidos e inválidos y todas las variantes de texto.
  - Archivos: `domain/entities/activities/value-objects/ActivitySchedule.ts`, `describeSchedule.ts` (+ tests).

- [x] **A3 Motor de recurrencia: ocurrencias (M)** — TDD, la pieza más delicada.
  - Aceptación: `occurrencesBetween(schedule, from, to)`, `nextOccurrence(schedule, from)`, `occursOn(schedule, date)`, `occursWeekdays(schedule)`; semanal, cada N semanas (ancla, cruce de mes y de año), n-ésimo del mes incluido "último", día del mes 29–31 (se salta meses cortos), fechas sueltas, `skipDates`, `validFrom/validUntil`, `always` (hereda horario del sitio o propio), `byAppointment` (no genera ocurrencias), cruce de medianoche, hora **America/Bogota** sin horario de verano.
  - Verifica: `pnpm test` con fechas fijas simuladas (nunca `Date.now()` directo; reloj inyectado).
  - Archivos: `domain/entities/activities/value-objects/occurrences.ts` (+ test).

- [x] **A4 Precios, extras y CTA (S)** — TDD.
  - Aceptación: `PriceOption`/`Extra` con límites (≤8 y ≤10, etiquetas ≤40, `amountCop` entero ≥0, `unit` válida, `includes` ≤6); `priceFromCop`; formato `$40.000`; `normalizeCta({kind,value})`: WhatsApp colombiano → `https://wa.me/57…`, `whatsappGroup` solo `https://chat.whatsapp.com/…`, `website/reserveLink/buyLink/instagram` solo `https://`, rechazo de `javascript:`, `data:`, `http:`, credenciales en la URL; `kind:"checkout"` **rechazado** hoy.
  - Verifica: `pnpm test` (casos de ataque: `javascript:alert(1)`, `//evil.com`, `https://user:pass@x.com`).
  - Archivos: `domain/entities/activities/value-objects/Price.ts`, `Cta.ts` (+ tests).

- [x] **A5 Slug y normalización de la consulta de búsqueda (S)**
  - Aceptación: `slugifyActivity(title)` (minúsculas, sin tildes, guiones, máx. 60) y `uniqueSlug(base, exists)`; `normalizeSearchQuery(q)` (recorte, longitud máxima, sin caracteres de control); **no hay `searchTokens`**: la búsqueda usa el índice de texto de Firestore Enterprise (A0).
  - Verifica: `pnpm test`.
  - Archivos: `domain/entities/activities/slug.ts`, `searchQuery.ts` (+ tests).

- [x] **A6 Entidad `Activity`, visibilidad, confianza y permisos (M)** — TDD.
  - Aceptación: clase `Activity` con invariantes de la spec 5.1; `isPubliclyVisible(activity, site?)` (6 casos de 6.1 + sitio despublicado/inactivo); `isTrustedHost(history, now)` con `TRUST_MIN_APPROVED = 3`; `canCreateForSite(uid, site, isAdmin)`; `needsReReview(prev, next, trusted)` (cambia `title/description/media` y no es de confianza → true); tabla de permisos de la spec 7 como funciones puras.
  - Verifica: `pnpm test`; sin nombres prohibidos (`organizer`, `business`, …; se usa `host`).
  - Archivos: `domain/entities/activities/Activity.ts`, `visibility.ts`, `trust.ts`, `permissions.ts` (+ tests).

- [x] **A7 DTO valibot, modelo Firestore y mapeadores (M)**
  - Aceptación: `ActivityDto` (límites y mensajes en español, tú) reutilizando el normalizador de `sections`; DTO Firestore (`FirebaseActivityDto`, con `media[]` **plano** como sitios) con `occursWeekdays`, `nextOccurrenceAt`, `rating`, `analytics`; mapeadores `toDto`/`toViewModel` con **round-trip** (no pierden campos al re-guardar).
  - Verifica: `pnpm test` (round-trip; valores fuera de límite rechazados con mensaje claro; ausente = aceptado donde es opcional).
  - Archivos: `application/dto/activities/ActivityDto.ts`, `infraestructure/firebase/dto/activities/FirebaseActivityDto.ts`, `infraestructure/firebase/mappers/activities/ActivityFirebaseMapper.ts` (+ tests).

- [x] **A8 Repositorio, adaptador, servicio base e inyección (M)**
  - Aceptación: interfaz en `domain/repository/activities`, implementación Firebase (Admin SDK) y adaptador; `ActivityService` con `create`, `update`, `getBySlug`, `listPublic`, `setActive`; registro en `createServerContainer()`; **ninguna consulta sin índice**: se listan las consultas y los índices necesarios en el plan y se **piden al dueño** (preguntar antes).
  - Verifica: tests del servicio con repositorio fake; `pnpm typecheck`.
  - Archivos: `domain/repository/activities/IActivityRepository.ts`, repo Firebase, adaptador, `application/services/activities/ActivityService.ts`, `infraestructure/di/container.ts`.

---

## Fase 1 — `activity-publish`

- [x] **A9 Registro de oferentes, Ley 1480 art. 53 (M)** — TDD.
  - Aceptación: entidad `HostIdentity` (persona natural: nombre completo, tipo y número de documento, dirección física, correo, teléfonos; persona jurídica: razón social, NIT, representante, dirección, correo, teléfonos) en `hostIdentities/{uid}` (solo Admin SDK); validación; fecha, `LEGAL_VERSION` y autorización de datos; acción `saveHostIdentityAction` (uid del token); `requireHostIdentity` impide publicar sin registro; reconfirmación a los 12 meses; **consulta para quejas** con sesión y límite (`getHostIdentityForComplaintAction`, con bitácora de quién consultó); `scripts/export-host-identity.ts` (dry-run, bitácora de exportación).
  - Verifica: `pnpm test`; sin sesión no consulta; consulta registra bitácora; ningún dato en HTML público.
  - Archivos: `domain/entities/activities/HostIdentity.ts`, DTO, repo, acciones, script (+ tests).

- [x] **A10 Antispam de actividades (S)** — extiende `spamGuard`.
  - Aceptación: `SPAM_LIMITS` gana `activitiesPerDay: 3`, `activitiesPendingMax: 3`, y `spamGuardError` soporta `kind: "activity"` (cooldown 30 s, duplicado 7 días, antigüedad mínima 10 min) **sin cambiar** el comportamiento de `suggestion`/`claim` (tests existentes siguen verdes).
  - Verifica: `pnpm test` (tests nuevos + los de `spamGuard` existentes).
  - Archivos: `domain/entities/spamGuard/spamGuard.ts` (+ test).

- [x] **A11 Acciones de servidor: crear, editar, pausar (M)**
  - Aceptación: `createActivityAction`, `updateActivityAction`, `setActivityActiveAction` con uid **solo del token**; comprueban propiedad del sitio (`canCreateForSite`) antes de aceptar `siteId`; exigen registro de oferentes (A9) y declaración (`contentDeclarations/activity_{id}` con `LEGAL_VERSION`); aplican antispam (A10); decide `pending` vs `approved` por `isTrustedHost` (admin siempre aprobada); `otros` siempre `pending`; al **publicar la primera** pasa la cuenta a `creator` con el método de `UserService` (D37, `try/catch` que solo registra como en sitios); emite log `alert=qhpa_new_activity` si queda `pending`; invalida con `updateTag`/`cacheTag`.
  - Verifica: tests de servicio: **IDOR** (otra cuenta intenta colgar actividad en sitio ajeno → error), `consumer` pasa a `creator`, tope de pendientes, edición de cuenta sin confianza con cambio de título → `pending`.
  - Archivos: `app/actions/activities/*.action.ts` (≤3) + `application/services/activities/ActivityService.ts`.

- [x] **A12 Moderación y administración por scripts (M)**
  - Aceptación: servicio `approve`/`reject` con transacción sobre `activityAccounts/{uid}` (`approvedCount`); notificaciones `activity_moderation` (agregar tipo a `NOTIFICATION_TYPES`, textos en `messages.ts`); `scripts/list-activities.ts` (dry-run por defecto; `--approve <id>`, `--reject <id> --reason "..."`, `--apply`; lista título, creador, URL local, antigüedad en horas).
  - Verifica: `pnpm test`; dry-run no modifica; con `--apply` en develop aprueba y notifica.
  - Archivos: `application/services/activities/ActivityModerationService.ts`, `domain/entities/notification/*`, `scripts/list-activities.ts`.

- [x] **A13 Transferencia por reclamo y visibilidad por sitio (S)**
  - Aceptación: al aprobar un reclamo, las actividades de ese sitio pasan al nuevo autor y el anterior recibe `activity_transferred`; una actividad de sitio deja de ser pública si el sitio se despublica o desactiva (visibilidad derivada, ya cubierta en A6; se agrega el cableado/consulta).
  - Verifica: `pnpm test` del script de reclamos ampliado; prueba manual en develop con sitio de QA.
  - Archivos: `scripts/list-site-claims.ts`, `application/services/siteClaim/*` (si aplica) (+ test).

### Checkpoint CP-1 — dominio y servicio
- [x] `pnpm test` (741 pruebas), `pnpm typecheck` y `pnpm build` verdes (2026-11-10).
- [x] Cubierto con pruebas de servicio (fakes): se crea, queda `pending`, no es pública y `list-activities.ts` la aprueba. **Sin probar contra Firestore real** (no se escribió ningún dato).
- [ ] Índices necesarios listados y **aprobados por el dueño** antes de crear consultas reales.
- [ ] Revisión con el dueño antes de abrir interfaz.

---

## Fase 1 — Interfaz (`activity-publish` + `activity-discovery` + SEO básico)

- [ ] **P1 Prototipo (Artifact): asistente de creación + ficha + tarjeta (S)**
  - Aceptación: una página Artifact **privada** con: pasos del asistente (tipo y sitio, qué es, cuándo con constructor de horario y vista previa del texto y de las próximas 5 fechas, cuánto con opciones y extras, dónde, medios, CTA, secciones, declaración + **formulario de registro de oferentes**), ficha pública (móvil y escritorio) con "Próxima salida", precio desglosado, CTA y barra fija, y tarjeta de actividad. Con estados (vacío, error, cargando, éxito) y los tokens reales de `DESING.md`/Tailwind del repo. Cargar skills `artifact-design`, `ui-design`, `frontend-design` y hacer `quickstart` antes de escribir.
  - Verifica: el dueño la abre y aprueba o corrige; **no se codifica la interfaz hasta su OK**.
  - Archivos: solo el Artifact (HTML en el directorio temporal de la sesión).

- [ ] **A14 Asistente de creación (L → se parte en 3 commits M)**
  - **A14a Esqueleto y pasos 1–3 (tipo/sitio, qué es, cuándo)**: componentes `ActivityWizard`, `ScheduleBuilder` con texto legible y próximas fechas; ruta `app/actividades/crear` y `app/actividades/[id]/editar`; borrador guardado; mensajes en español (tú); móvil primero.
  - **A14b Pasos 4–6 (cuánto, dónde, medios)**: `PriceBuilder` (opciones + extras), punto de encuentro `fixed|sharedAfterJoining|varies` (texto; mapa opcional), subida de portada/galería/video por URL firmada a `public/activities/{id}/…`, estado "procesando".
  - **A14c Pasos 7–9 (CTA, secciones, registro de oferentes + declaración)**: reutiliza el editor de `sections`; formulario A9; envío con mensaje claro de "en revisión" o "publicada".
  - Aceptación común: sin errores de consola a 320/390/768/1024/1440 px; accesible (teclado, foco, etiquetas, errores asociados); un usuario `consumer` llega al asistente y, al publicar la primera, queda `creator`.
  - Verifica: tests de lógica pura; guion de prueba manual numerado; Playwright si está disponible.
  - Archivos: ≤5 por commit, bajo `presentation/activities/components/wizard/` y `app/actividades/`.

- [ ] **A15 "Mis actividades" (M)**
  - Aceptación: `app/actividades/mis`: lista propia con estado (en revisión, publicada, rechazada con motivo, pausada), acciones (editar, pausar, vista previa), vista previa para actividades `pending`; sin Premium; vacío con invitación a crear.
  - Verifica: prueba manual con cuenta `creator` y con `consumer`.
  - Archivos: `app/actividades/mis/page.tsx`, `presentation/activities/components/MyActivities*.tsx`.

- [ ] **A16 Ficha pública `/actividades/[slug]` (M)**
  - Aceptación: contenido y orden de la spec 8.3 (galería, "Próxima salida", precio desglosado, CTA principal y secundarias con el comportamiento de `meetingPoint`, anfitrión, descripción + acordeón `sections` reutilizando `SectionsAccordion`, relacionadas, enlace "Datos de quien ofrece / Presentar una queja"); `params` dentro de `Suspense` y sin `generateStaticParams`+`notFound()` en el shell (memoria E22); no pública → 404; sin reseñas aún.
  - Verifica: build de producción local en :3100; actividad `pending` → 404 público y vista previa solo para el creador; Lighthouse en móvil.
  - Archivos: `app/actividades/[slug]/page.tsx`, `presentation/activities/components/detail/*`, `presentation/activities/data/fetchers.ts`.

- [ ] **A17 Tarjeta y hub `/actividades` con filtros básicos (M)**
  - Aceptación: `ActivityCard` (portada, título, categoría, "Próxima salida", precio "desde", chips); hub con listado infinito de 12 (patrón `InfiniteExploreSearch`), filtros de categoría y tipo; sin bloque vacío; orden = próxima salida más cercana.
  - Verifica: `pnpm build`; prueba manual con 6+ actividades de QA.
  - Archivos: `app/actividades/page.tsx`, `presentation/activities/components/ActivityCard.tsx`, `ActivityList.tsx`, `data`.

- [ ] **A18 Bloque "¿Qué se puede hacer aquí?" en la ficha del sitio (S)**
  - Aceptación: en `SiteDetailContainer`, tarjetas (máx. 6) de actividades públicas del sitio con "ver todas" → `/actividades?sitio=<slug>`; **no se renderiza** si no hay; orden estable; `cacheTag("site-<id>-activities")`.
  - Verifica: sitio con y sin actividades; invalidación al aprobar/pausar.
  - Archivos: `presentation/sites/components/detail/SiteDetailContainer.tsx`, `SiteActivitiesBlock.tsx`.

- [ ] **A19 SEO básico de F1 (M)**
  - Aceptación: `generateMetadata` de la ficha (título, descripción ≤155, canonical), Open Graph JPEG `app/og/actividad/[slug]`, JSON-LD `Service`/`TouristAttraction` con `offers` (sin `AggregateRating` todavía), sitemap con detalle de actividades y `cacheTag("activity-list")`.
  - Verifica: Prueba de resultados enriquecidos sin errores críticos; sitemap solo con URLs públicas; HTML con metadatos correctos.
  - Archivos: `app/actividades/[slug]/page.tsx` (metadata), `app/og/actividad/[slug]/route.tsx`, `app/sitemap.ts`, `presentation/activities/lib/activityJsonLd.ts` (+ test).

- [ ] **A20 "Guardar" (M)** — `activity-engagement`; **un solo mecanismo** para actividades, eventos y sitios; coordinar con `intent` de `analytics-v2` (T12) y **no duplicarlo** (si T12 ya existe, se extiende).
  - Aceptación: un toque con cuenta, privado, con deshacer; `users/{uid}/saved/{tipo_id}`; contador agregado; sin sesión pide Google y vuelve; no se expone quién guardó.
  - Verifica: `pnpm test` (idempotente; doble toque = 1); prueba manual con cuenta nueva (<10 s).
  - Archivos: dominio, servicio, acción, botón `SaveButton`, ficha de actividad.

- [ ] **A21 "Yo fui" (S)** — movida desde C5.
  - Aceptación: `visits/{uid}`, `analytics.visits`, "N personas fueron" desde 10, idempotente; una por persona.
  - Verifica: tests de servicio; doble clic = 1.
  - Archivos: servicio, acción, componente.

- [ ] **A22 Unirme / reservar cupo: dominio y servicio (M)** — TDD; reutiliza patrones de `EventRegistration`.
  - Aceptación: entidad `ActivityJoin` (por persona y **por ocurrencia** en salidas recurrentes); cupo opcional con máximo, cierre manual; una inscripción por persona y ocurrencia (idempotente, transacción); cupo lleno → error claro; cancelar propia inscripción; notificación al creador y confirmación al usuario.
  - Verifica: `pnpm test` (carrera de dos inscripciones al último cupo; lleno; cancelar libera el cupo).
  - Archivos: `domain/entities/activities/ActivityJoin.ts`, servicio, repo, acciones (≤2).

- [ ] **A23 Unirme / reservar cupo: interfaz y lista del creador (M)** — antes: prototipo en P1.
  - Aceptación: botón "Unirme" con selector de ocurrencia, estado "Estás dentro", cupos restantes ("quedan 4"); el creador ve la **lista de inscritos** de **su** actividad (nombre y contacto autorizado) y puede cerrar cupos; fuera de `/studio`.
  - Verifica: prueba de **IDOR** (un creador no ve inscritos ajenos); guion manual.
  - Archivos: componentes + `app/actividades/[id]/inscritos`.

- [ ] **A24 Medición mínima (M)** — movida desde D4.
  - Aceptación: `POST /api/activities/[id]/track` con `beaconGuard`, `ipRateLimit`, `dailyDedupe`; tipos `view|directions|cta|share|save|visit|join`; `stats/{día}` y `analytics.*` con **canal de origen**; sin datos personales; mismo presupuesto de escrituras que eventos.
  - Verifica: tests de la ruta (sin same-origin → 204 y 0 escrituras; repetido = 1).
  - Archivos: ruta, hook de cliente, repositorio.

- [ ] **A25 Kit de compartir con QR y afiche para actividades (M)** — reutiliza `ShareKit` y los enlaces `/r/` de `analytics-v2`.
  - Aceptación: enlaces automáticos por canal, QR, afiche PNG (formato feed e historia), mensaje de WhatsApp; se abre al publicar y desde "Mis actividades"; atribución por `ch` visible en la medición mínima (A24).
  - Verifica: prueba manual de descarga del afiche; la visita por QR suma al canal.
  - Archivos: extensión del kit existente, `/r/` para actividades.

- [ ] **A26 Carga de las ~5 actividades reales (S)** — contenido, no código nuevo.
  - Aceptación: el dueño las carga desde la app con su cuenta admin en develop; se invalida la caché; checklist de datos de la spec sección 16 por actividad.
  - Verifica: aparecen en hub, ficha de sitio y sitemap.
  - Archivos: ninguno (datos).

- [x] **G0 Material de acercamiento a comunidades (S)** — doc, no código.
  - Aceptación: `docs/33-acercamiento-comunidades.md` con guion de 30 s, mensaje de WhatsApp, oferta (página con QR/afiche, inscripción con cupos, gratis), lo que se pide (permiso, fotos, horario, precios) y plantilla de seguimiento; tuteo, sin voseo; sin prometer visitas.
  - Verifica: el dueño lo lee y lo ajusta.
  - Archivos: `docs/33-acercamiento-comunidades.md`.

### Checkpoint CP-F1 — actividades reales visibles
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build` verdes.
- [ ] Revisión del `security-auditor` (autorización por recurso, XSS, CTA, subidas, IDOR) sin críticos/altos abiertos.
- [ ] Guion de prueba para el dueño: crear 1 actividad global y 1 de sitio con su cuenta admin, verlas en el hub, en la ficha del sitio y por Google (sitemap).
- [ ] Un usuario nuevo guarda, marca "Yo fui" e inscribe en una salida (<10 s por acción) y la visita por QR/enlace se ve por canal.
- [ ] El dueño carga **sus ~5 actividades reales desde la app** (en develop; producción solo con orden explícita) y se invalida la caché (A26).
- [ ] Documento `docs/31-actividades.md` (modelo, estados, permisos, scripts).
- [ ] Revisión con el dueño; decisión de subir a prod.

---

## Fase 2 — Descubrimiento (home, búsqueda, filtros, landings)

- [ ] **P2 Prototipo (Artifact): bloque del home + filtros + resultados mezclados (S)** — misma regla que P1.

- [ ] **B1 Home "Actividades de hoy" (M)** — TDD en la parte pura.
  - Aceptación: `dailyActivityPicks(ids, day, limit=8, maxPerHost=2, seed)` determinista (misma entrada = mismo resultado, día distinto = distinto) reutilizando `pickDiscoverIds` con generador con semilla; bloque en `app/(home)/page.tsx` dentro de `Suspense`, con `use cache` + `cacheLife("hours")` + `cacheTag("activity-list")`; carrusel en móvil (6) y rejilla en escritorio; no se renderiza vacío.
  - Verifica: tests de determinismo y de la regla de variedad; dos cargas el mismo día = mismo conjunto.
  - Archivos: `domain/entities/activities/dailyPicks.ts` (+ test), `presentation/activities/components/ActivityHomeBlock.tsx`, `app/(home)/page.tsx`.

- [ ] **B2 Búsqueda (M)**
  - Aceptación: integrar `activities` en `ExploreSearchBar`/`HomeSearchBar` y `/explorar` con `content=activities`; consulta con el **índice de texto** de Firestore Enterprise (`documentMatches`, como `sites`/`events`), **nunca** substring/prefijo; **índice nuevo en `firebase/firestore.indexes.json` = preguntar antes**; resultados mezclados con etiqueta "Actividad".
  - Verifica: búsqueda "senderismo" encuentra la actividad; confirmado que no hay TableScan (plan de consulta o log); índice aprobado.
  - Archivos: `exploreFetchers`, `app/explorar/page.tsx`, componentes de búsqueda.

- [ ] **B3 Filtros "Hoy / fin de semana / presupuesto / con quién" (M)**
  - Aceptación: filtros en URL y compartibles: `cuando=hoy|este-fin-de-semana|esta-semana|<día>`, `presupuesto`, `con`, `categoria`, `tipo`, `dificultad`; "hoy" usa `occursWeekdays` (consulta) + `occurrencesBetween` en memoria sobre lo paginado; orden por próxima salida.
  - Verifica: tests con fechas simuladas (domingo 6 a. m. aparece el domingo, no el lunes; `skipDates` lo excluye); guion de prueba.
  - Archivos: `ActivityFilters.tsx`, `data/fetchers.ts`, `domain/entities/activities/filters.ts` (+ test).

- [ ] **B4 Landings y página pilar con regla de fundamento (M)**
  - Aceptación: prefijo `actividades-` en `app/(landings)/[coleccion]` sin alterar `donde-ir-` ni eventos; colecciones iniciales (hoy, fin de semana, gratis + 3 categorías con más contenido); **regla**: indexables solo con intención distinta + texto introductorio propio + ≥3 actividades públicas, si no `noindex` y fuera del sitemap; página pilar `/cosas-para-hacer-en-ibague` que une eventos de hoy, sitios y actividades, con `ItemList` y `BreadcrumbList`; textos propios redactados con el dueño (no plantilla).
  - Verifica: Prueba de resultados enriquecidos; landing con 2 actividades → `noindex`; sitemap correcto.
  - Archivos: `app/(landings)/[coleccion]/page.tsx`, `presentation/activities/lib/activityCollections.ts`, `app/cosas-para-hacer-en-ibague/page.tsx`, `app/sitemap.ts`.

- [ ] **B5 "Mis planes" (M)** — `activity-engagement`; fuera de `/studio`.
  - Aceptación: página con lo **guardado**, lo **próximo** (inscripciones) y lo **hecho** (Yo fui); solo datos de la propia cuenta; vacío con invitación a explorar.
  - Verifica: prueba de aislamiento entre cuentas; guion manual.
  - Archivos: `app/(profile)/…/mis-planes` (el plan confirma la ruta), componentes, fetchers.

- [ ] **B6 Avisos en la campanita (M)** — base de todos los canales; B8–B13 suman correo, push y WhatsApp.
  - Aceptación: `activity_reminder` ("mañana sale…" a inscritos y guardados), `activity_last_spot`, `activity_digest_new`; frecuencia con tope (máx. 1 aviso diario por usuario); barrido que respeta cuotas (el correo y el push se suman en B9–B12).
  - Verifica: tests del programador (tope diario, no repetir); prueba en develop con cuentas de QA.
  - Archivos: `Notification.ts`, `messages.ts`, servicio de avisos, barrido (el plan confirma dónde corre).

- [ ] **B7 Resumen semanal automático (M)**
  - Aceptación: función pura que arma "Qué hacer este fin de semana en Ibagué" desde eventos y actividades reales y vigentes; salida de **texto** para el Canal de WhatsApp y **imagen** para Instagram (con `sharp`/`/og`); publicación **manual** al inicio; nada vencido.
  - Verifica: tests con fechas simuladas; el dueño revisa un ejemplo real.
  - Archivos: dominio, ruta/imagen, página de administración simple o script.

- [ ] **B8 Preferencias de avisos y permiso (M)** — `activity-engagement` 26.2b.
  - Aceptación: `users/{uid}/notificationPrefs` por canal y tipo, por defecto todo apagado salvo transaccionales de **su** inscripción; página de preferencias; casilla de autorización **separada** (con fecha y `LEGAL_VERSION`) en registro y en "Mis planes"; banner de invitación tras guardar/inscribirse; usuarios existentes **no** se apuntan solos; baja registrada.
  - Verifica: tests de reglas (sin permiso no hay envío); prueba manual con cuenta nueva y existente.
  - Archivos: dominio de preferencias, servicio, acción, página y componentes; **actualización de textos legales** (preguntar antes por `LEGAL_VERSION`).

- [ ] **B9 Correo con Resend: infraestructura (M)** — **preguntar antes**: DNS y secretos.
  - Aceptación: cliente HTTPS con `fetch` (sin dependencia nueva) a Resend; clave como secreto de App Hosting (**solo nombres**); **cola con tope diario** (`EMAIL_DAILY_CAP`) que prioriza transaccionales y reparte resúmenes; registro de envíos/rebotes/bajas; aviso al 80% del tope; cabecera `List-Unsubscribe` y enlace de baja con un clic; pruebas con servicio fake.
  - Verifica: `pnpm test` (cola: prioridad, tope, reintento al día siguiente); en develop un correo de prueba a una cuenta de QA; SPF/DKIM/DMARC válidos (verificación manual del dueño en el DNS) y no cae en spam en Gmail/Outlook.
  - Archivos: `infraestructure/email/ResendEmailService.ts`, cola, DTO, acción de baja (el plan confirma dónde corre el envío: ruta con tarea programada o `../functions`).

- [ ] **B10 Correos transaccionales de actividades (S)**
  - Aceptación: plantillas de **confirmación de inscripción**, **recordatorio "mañana sale…"** y **último cupo/cupo liberado**; solo a quien se inscribió (no requiere casilla de marketing, sí baja visible); enlace con canal `email`.
  - Verifica: tests de plantillas (texto, tuteo, sin voseo, enlaces); prueba en develop.
  - Archivos: plantillas, servicio.

- [ ] **B11 Correos de valor: "Para ti" y "Eventos de esta semana" (M)**
  - Aceptación: (c) "Actividades y sitios que te pueden interesar" (según guardados, "Yo fui", categorías y `UserPreferences`; si no hay señal, las "de hoy") y (d) "Eventos de esta semana en Ibagué"; solo a quien dio permiso; máx. 1 diario y 1 resumen semanal por persona; contenido vigente; cada correo dice por qué se recibe.
  - Verifica: tests de selección con fechas simuladas y perfiles de prueba; el dueño aprueba un ejemplo real antes de enviar a nadie.
  - Archivos: dominio de selección, plantillas, programador.

- [ ] **B12 Notificaciones push web (M)** — **preguntar antes**: claves VAPID y FCM.
  - Aceptación: reutiliza `/sw.js`; registro de token por dispositivo; **solicitud de permiso solo tras una acción de valor** (no en la primera carga; si dice que no, no se pide en 30 días); avisos útiles con tope diario; limpieza de tokens inválidos; verificación del soporte en iPhone (PWA instalada).
  - Verifica: prueba en Android real y en escritorio; `pnpm test` de reglas (tope, no repetir, vencimiento de token).
  - Archivos: service worker, servicio, acción, componente de solicitud, preferencias.

- [ ] **B13 Ganchos del Canal de WhatsApp (S)**
  - Aceptación: botón "Seguir el canal" en la ficha de actividad, confirmación de inscripción, "Mis planes" y pie de correo; el enlace se configura en un solo lugar; el afiche con QR y el guion G0 lo incluyen; la visita se atribuye al canal `wa-channel`.
  - Verifica: prueba manual; atribución visible en la medición.

### Checkpoint CP-F2
- [ ] Verde en test/typecheck/build; home estable por día; búsqueda y filtros verificados; landings con fundamento; guion para el dueño; Lighthouse sin regresión en home.

---

## Fase 3 — Reseñas y moderación

- [ ] **C0 Legal y privacidad (M)** — `legal-privacy`
  - Aceptación: borrador de **Términos** (reglas de reseñas, licencia sobre textos/fotos/videos, reglas de "cuestionar" y sanciones, responsabilidad del autor, aviso y retiro, no verificamos asistencia) y de **Privacidad** (datos de reseñadores y anfitriones, finalidad y publicidad del nombre, conservación, derechos, Ley 1581, transmisión a Google); casilla de **autorización separada**; actualizar `docs/14-legal-y-cumplimiento.md` (art. 53 pasa a "implementado") y `docs/16`; **`LEGAL_VERSION` solo con OK del dueño** (preguntar antes).
  - Verifica: el dueño aprueba los textos; versión subida; declaración guarda la versión.
  - Archivos: `app/(home)/terminos/page.tsx`, `app/(home)/privacidad/page.tsx`, `app/lib/legal/version.ts`, docs.

- [ ] **C1 Dominio de reseñas (M)** — TDD.
  - Aceptación: `ActivityReview` (spec 5.9; colección de primer nivel `activityReviews/{activityId}_{uid}` con `media[]` plano), validaciones (rating 1–5; texto 0 o 10–1500; sin URLs, correos ni teléfonos; fecha de visita ≤hoy y ≥24 meses), `applyReviewToRating(rating, review, op)` para crear/editar/borrar/remover y `ratingSummary`; estados `published|flagged|removed|pendingMedia`; reglas: autor = id del documento, creador y dueño del sitio no reseñan.
  - Verifica: `pnpm test` (agregados correctos tras crear, editar de 5 a 2, borrar, remover; patrones de teléfono/URL).
  - Archivos: `domain/entities/activities/review/*` (+ tests).

- [ ] **C2 Servicio y acciones de reseña (M)**
  - Aceptación: `createOrUpdateReviewAction`, `deleteReviewAction` (no si `flagged`), identidad solo del token, una por persona (doc id = uid, transacción que actualiza `rating`), antispam de reseñas (cooldown 30 s, 10/día, duplicado 7 días, antigüedad 10 min), declaración con `LEGAL_VERSION`, notificación `review_received`; nombre público = primer nombre + inicial.
  - Verifica: tests de servicio, incluida **carrera simulada** de dos envíos; creador no reseña; no se filtra email/uid.
  - Archivos: `application/services/activities/ReviewService.ts`, `app/actions/activities/review*.action.ts` (≤2), DTO.

- [ ] **C3 `../functions`: procesar medios de actividades y reseñas (M)** — **repo hermano; preguntar antes**
  - Aceptación: añadir `ACTIVITIES: "activities"` y `ACTIVITY_REVIEWS: "activityReviews"` a `OPTIMIZABLE_FOLDERS` en `../functions/src/triggers/storage/config/storageOptimization.config.ts` (el optimizador genérico `optimizeMedia` ya hace el resto: ruta `public/{coleccion}/{docId}/{images|videos}/…`, parche del `media[]` plano, recompresión con `processVideo`, miniatura); **resolver el borrado del original** (el optimizador no lo borra): cambio en el trigger o **regla de ciclo de vida del bucket**; tope de origen 200 MB y 3 min; imágenes por el optimizador existente; compatible hacia atrás. **Entregable adicional: cifras de peor caso de costo** (cómputo + egreso) con precios vigentes antes de activar el interruptor.
  - Verifica: pruebas unitarias del `patch`; prueba en develop subiendo un video de QA; el original desaparece; el resultado carga con `faststart`.
  - Archivos (repo `../functions`): `src/triggers/storage/config/storageOptimization.config.ts`, y si hace falta `onObjectFinalized.optimizeMedia.ts` (borrado del original), README. **Empujar su rama junto al despliegue.**

- [ ] **P3 Prototipo (Artifact): reseñas (S)**
  - Aceptación: encabezado (promedio, distribución, "N personas fueron"), tarjetas **polaroid**, historia abierta (drawer/diálogo), formulario con Google y subida, estado **"En verificación"** en rojo suave (icono + texto, contraste AA), "Verificada por QHPA", flujo de cuestionar y de apelar, estado vacío. Tokens reales (sin `brand-violet`, que no está definido).
  - Verifica: aprobado por el dueño antes de C4/C8.

- [ ] **C4 Interfaz de reseñas (M, se parte si crece)**
  - Aceptación: sección en la ficha con encabezado, polaroid, historia abierta, filtros (con fotos, por estrellas, recientes), formulario con **"Continuar con Google"** (reutiliza `GoogleAuthButton` y `redirect_to`; vuelve con `?resena=1`); subida de fotos (≤3) y video (≤1) con estado de procesamiento; texto sin enlaces; accesible (estrellas como `radiogroup`, foco atrapado, Esc); respeta `reviewVideoEnabled`.
  - Verifica: guion de prueba; sin errores de consola; 320–1440 px; estrellas por teclado.
  - Archivos: `presentation/activities/components/reviews/*`, ficha de actividad.

- [x] **C5 "Yo fui" y contadores (S)** — **MOVIDA a F1 como A21** (no se hace aquí).
  - Aceptación: `visits/{uid}`, `analytics.visits`, "N personas fueron" desde 10; reseñar marca "Yo fui"; idempotente.
  - Verifica: tests de servicio; doble clic = 1.
  - Archivos: servicio, acción, componente.

- [ ] **C6 Dominio de moderación de reseñas y sanciones (M)** — TDD.
  - Aceptación: motivos cerrados; `canFlag(account, activity, review)` con topes (5 abiertos por cuenta, 3 por actividad, una vez por reseña, sin permiso si sancionado); `resolveFlag(outcome)` (`upheld`/`removed`) y efectos; escalera de sanciones y reincidencia a 12 meses; `activeSanctions` alimenta `isTrustedHost`; ocultado preventivo con 3 reportes distintos en 24 h.
  - Verifica: `pnpm test` con todas las ramas.
  - Archivos: `domain/entities/activities/moderation/*` (+ tests).

- [ ] **C7 Acciones y scripts de QHPA (M)**
  - Aceptación: `flagReviewAction`; `scripts/list-activity-flags.ts` (dry-run; `--resolve <id> --outcome upheld|removed --apply`) que actualiza reseña, agregados, sanciones y notifica (`review_flag_resolved`, `activity_sanction`); log `alert=qhpa_new_flag`.
  - Verifica: tests de servicio; en develop: cuestionar → rojo visible → resolver ambos desenlaces.
  - Archivos: `ReviewModerationService.ts`, acción, script, notificaciones.

- [ ] **C8 Interfaz: estado rojo, respuesta del dueño y reportes (M)**
  - Aceptación: `FlaggedReviewBanner` (texto neutro, **sin motivo**), chip "Verificada por QHPA", respuesta del dueño (≤600, editable), botón **Reportar** de reseña y de actividad; no editar ni borrar si `flagged`.
  - Verifica: auditoría de contraste AA y que no dependa solo del color.
  - Archivos: componentes de reseñas.

- [ ] **C9 Reportes de actividad y reseña (S)**
  - Aceptación: `ReportTargetType` incluye `"activity"` y `"review"` con motivos propios; `reportId` sin cambios; `scripts/list-reports.ts` los lista.
  - Verifica: `pnpm test` de `Report` existente + nuevos.
  - Archivos: `domain/entities/report/Report.ts`, `scripts/list-reports.ts`.

- [ ] **C10 Apelaciones (S)**
  - Aceptación: una apelación por reseña removida o sanción, con explicación ≥30 y pruebas opcionales; usa el canal de soporte existente si sirve; sin fundamentos se cierra sin trámite; con fundamentos QHPA restituye si procede.
  - Verifica: prueba manual del flujo; tests de la regla "una sola vez".
  - Archivos: acción + componente + script de resolución.

- [ ] **C11 Supresión de cuenta y retención (S)**
  - Aceptación: `scripts/anonymize-reviewer.ts` (dry-run) deja las reseñas como "Usuario eliminado" sin foto; borrar a solicitud; documentado en `docs/31-actividades.md`.
  - Verifica: dry-run lista lo que cambiaría; en develop anonimiza una cuenta de QA y restaura datos.
  - Archivos: script, doc.

- [ ] **C12 Auditoría de seguridad de F3 (S)**
  - Aceptación: skill `security-and-hardening` + agente `security-auditor` sobre reseñas con medios, "cuestionar", subidas y datos personales; hallazgos críticos/altos cerrados.
  - Verifica: informe y tests de los casos negativos.

- [ ] **C13 Tarjeta para compartir una reseña (S)** — imagen con `sharp`/`/og`, con enlace contado (`/r/…`) a la actividad; abre desde la historia abierta.
  - Verifica: la imagen no incluye datos privados; el enlace atribuye el canal.
- [ ] **C14 Insignias y pasaporte (M)** — reutiliza `badges`: "Primera historia", "Explorador de Ibagué" (5 actividades), "Pasaporte" (sellos); los sellos por QR del local cuentan como visita verificada; sin recompensas con dinero.
  - Verifica: tests de reglas (idempotente, no se otorga dos veces); aparece en el perfil.

### Checkpoint CP-F3
- [ ] Verde en test/typecheck/build; textos legales aprobados y `LEGAL_VERSION` actualizada.
- [ ] Reseña con Google, fotos y video procesado; una por persona; agregados correctos.
- [ ] Cuestionar → rojo → resolver (ambos desenlaces) con sanciones y notificaciones.
- [ ] Cifras de costo de video aprobadas antes de dejar `reviewVideoEnabled` encendido en prod.
- [ ] Alertas por log pedidas y creadas (con permiso) y probadas.
- [ ] Guion completo para el dueño.

---

## Fase 4 — Ofertas, promociones y medición

- [ ] **D1 Menú/productos y espacios reservables (M)** — solo actividades de sitio.
  - Aceptación: `offerings` (máx. 30) y `spaces` (máx. 10) con límites y precio COP; el servidor **rechaza** ambos en actividades globales; aviso "Precios sujetos a cambio".
  - Verifica: tests (global rechaza; sitio acepta); round-trip del mapper.
  - Archivos: dominio, DTO, mapper.

- [ ] **D2 Promociones (M)** — TDD.
  - Aceptación: `ActivityPromotion` en `activityPromotions`, vigencia obligatoria, `schedule` reutilizado, caducan solas (barrido horario existente), nunca se muestra una vencida; filtro "Promos hoy"; solo creador/dueño/admin.
  - Verifica: `pnpm test`; promo vencida desaparece de actividad, sitio y filtros.
  - Archivos: dominio, repo, servicio, acción, barrido.

- [ ] **P4 Prototipo (Artifact): menú, espacios, promociones, panel del creador (S)**

- [ ] **D3 Interfaz de bloques (M)**
  - Aceptación: `OfferingsList`, `SpacesList`, `PromotionCard` en la actividad y promos vigentes en la ficha del sitio con horario legible; botón vía CTA externa; editor en el asistente (solo si hay sitio).
  - Verifica: guion y 320–1440 px.

- [x] **D4 Medición (M)** — **MOVIDA a F1 como A24** (no se hace aquí). Aquí queda solo ampliar el panel (D5).
  - Aceptación: `POST /api/activities/[id]/track` con `beaconGuard`, `ipRateLimit`, `dailyDedupe`; tipos `view|directions|cta|share|visit`; `stats/{día}` y `analytics.*`; sin datos personales; presupuesto de escrituras igual al de eventos; **sin** usar los contadores para ordenar el home.
  - Verifica: tests de la ruta (sin same-origin → 204 y 0 escrituras; repetido = 1).
  - Archivos: ruta, hook de cliente, repo.

- [ ] **D5 Panel del creador y kit de compartir (M)**
  - Aceptación: vistas, clics, "Yo fui", reseñas y origen por canal para el creador, **fuera de `/studio`**; enlaces `/r/…` y kit (QR, afiche, mensaje de WhatsApp) como en eventos/sitios.
  - Verifica: guion; los números coinciden con Firestore.

### Checkpoint CP-F4
- [ ] Verde; menú/espacios/promos solo en sitio; medición dentro del presupuesto de escrituras; guion para el dueño.

---

## Fase 5 — Pulido

- [ ] **E1 Álbum/libro que se voltea (M)** — con prototipo propio previo; reemplaza las tarjetas polaroid sin cambiar datos.
- [ ] **E2 Cartelera de cine (M)** — items con horarios, **carga manual** o enlace al cine, fecha de verificación visible; reseñas por película solo si se justifica.
- [ ] **E3 Horarios avanzados (S)** — casos que salgan de la práctica (festivos, temporadas).
- [ ] **E4 `activity-premium` (por especificar)** — solo cuando haya usuarios: cupos y asistencia avanzados, estadísticas completas, kit sin marca, equipo (Q11), comisión reducida si existe `activity-commerce`. Reglas: no se limita la cantidad de actividades; reseñas y su moderación nunca son Premium. Antes: spec corta y decisión de plan único frente a dos planes.

---

## Futuro (no se construye aquí)

- [ ] **F-commerce** `activity-commerce`: split con Mercado Pago. Previo: responder las preguntas de `docs/32-investigacion-split-mercado-pago.md` (¿QHPA como persona natural puede ser integrador?, KYC del vendedor, tope de `marketplace_fee`, contracargos) y validar impuestos con contador. **Sin código hasta entonces.**

---

## Pendientes transversales

- [ ] Memoria del proyecto al cierre de cada fase ("lo de siempre"): hecho, pendiente, trampas.
- [ ] Actualizar `CAPABILITY-MAP.md` y `docs/09-inventario-rutas-apis-y-scripts.md` al terminar F1.
- [ ] Commitear `SPEC-actividades.md`, `tasks/plan-actividades.md`, `tasks/todo-actividades.md` y `docs/32-investigacion-split-mercado-pago.md` (preguntar antes: siguen sin commit).
