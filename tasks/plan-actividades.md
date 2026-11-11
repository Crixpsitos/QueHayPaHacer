# Plan: `actividades`

Spec: `SPEC-actividades.md` (2026-11-10, **aprobada por el dueño**). Lista de tareas: `tasks/todo-actividades.md` (archivo aparte: `tasks/plan.md` y `tasks/todo.md` son de otro trabajo y tienen ítems sin marcar; no se tocan).
Estado: BORRADOR para aprobación del plan. No hay código.

## Reordenamiento (2026-11-10, objetivo del dueño: usuarios que interactúan)

Se reprioriza para **ganar usuarios que hagan cosas y vuelvan** (spec sección 26, D40–D42):
- **F1** ahora incluye **Guardar, "Yo fui", Unirme/reservar cupo con cuenta, kit de compartir con QR/afiche y medición mínima**, además de ficha, hub y las ~5 actividades reales.
- **F2** suma **Mis planes, avisos y resumen semanal automático** a home/búsqueda/filtros/landings, y los **canales de aviso (D43)**: campanita, **correo con Resend (gratis, con tope diario)**, **push web** y ganchos del **Canal de WhatsApp** (tareas B8–B13), todo con permiso y baja con un clic.
- **F3** (reseñas, moderación) suma tarjeta para compartir reseña e **insignias/pasaporte**.
- **F4** ofertas/promos y panel del creador.
- **F5** pulido y **`activity-premium`** (al final: con pocos usuarios Premium no mueve la aguja).
- Material de acercamiento a comunidades en `docs/33-acercamiento-comunidades.md` (tarea G0, no es código).
- El detalle de tareas nuevas y movidas está en `tasks/todo-actividades.md` (A20–A26, B5–B7, C13–C14, G0).

## Resumen

Diez módulos de la spec agrupados en cinco fases verificables. Orden: `activity-core` → `activity-publish` → { `activity-discovery`, `activity-seo` básico } (**F1**) → home/búsqueda/filtros/landings (**F2**) → `legal-privacy` + `activity-reviews` + `review-moderation` (**F3**) → `site-offerings` + `activity-insights` (**F4**) → álbum y cartelera (**F5**). `activity-commerce` queda fuera (futuro). Cada fase deja `develop` funcionando y se puede detener sin dejar el producto a medias.

## Hallazgos verificados en el código (2026-11-10) y su efecto en el plan

1. **`/studio` está limitado a Premium** (`presentation/studio/components/StudioGate.tsx`: sin sesión → `/premium`; sin Premium y sin equipo de eventos → `/profile`). La spec (D1) exige que **no** sea solo Premium. **Decisión del plan:** la gestión de actividades **no vive en `/studio`**: va en rutas abiertas, al estilo de `/sites` y `/sites/create`: `app/actividades/crear`, `app/actividades/mis`, `app/actividades/[id]/editar`. Las estadísticas del creador (F4) también fuera de Studio (como el kit de compartir que ya existe para cuentas básicas). La spec 8.2 punto 1 se corrige en consecuencia (tarea A0).
2. **Promoción a `creator` ya existe:** `application/services/user/UserService.ts` (≈ líneas 86–90: si `existing.participation === "creator"` devuelve; si no, la pone en `creator`) y la usa `app/actions/sites/publish-site.action.ts` (≈ línea 41, con `try/catch` que solo registra el error). Se **reutiliza** el mismo método para la primera actividad (D37). Se confirma el nombre exacto del método en A0.
3. **Procesamiento de video/imagen vive en `../functions`** (repo hermano). `onObjectFinalized.optimizeVideos.ts` solo acepta rutas `public/events/{id}/videos/…` (filtro explícito) y llama a `patchEventMedia`. Existe `config/storageOptimization.config.ts` con `OPTIMIZABLE_FOLDERS = { EVENTS, SITES }` y el `README` de la carpeta describe la convención `public/{carpeta}/{idRecurso}/{images|videos}/…`. Hay también `optimizeImages`, `optimizeMedia` y `optimizeSessions`. **Efecto:** las rutas de actividades deben **encajar en esa convención** → actividades: `public/activities/{activityId}/{images|videos}/…`; reseñas: `public/activity-reviews/{activityId}_{uid}/{images|videos}/…` (el "recurso" es el id compuesto de la reseña; así no se rompe el parser de rutas). Se agrega `ACTIVITIES` y `ACTIVITY_REVIEWS` a la configuración y se escribe un `patch` equivalente a `patchEventMedia` para cada recurso (tarea C3 y A-media).
4. **Landings por colección** (`app/(landings)/[coleccion]/page.tsx`) distinguen por prefijo (`donde-ir-` para sitios; si no, colección de eventos). Se agrega el prefijo `actividades-` (tarea B4) sin tocar la lógica de los otros dos.
5. **Sitemap** (`app/sitemap.ts`) usa `"use cache"` + `cacheTag("sitemap", "site-list", "event-list")`: se añade la etiqueta `activity-list`.
6. **Home** (`app/(home)/page.tsx`) compone bloques con `Suspense`; el bloque de actividades se inserta ahí. `pickDiscoverIds(ids, limit, excludeIds, random)` (`domain/entities/sites/siteDiscovery.ts`) ya acepta un generador: se reutiliza con una semilla por día.
7. **Autoría del sitio** es `site.author.id` (`Site.author: SiteAuthor { uid, … }` en dominio; el campo en Firestore es `author.id` según las reglas versionadas). Se confirma en A0 qué nombre usa cada capa.
8. **Antispam** ya centralizado (`domain/entities/spamGuard/spamGuard.ts`, `SPAM_LIMITS`, `spamGuardError`): se **extiende**, no se duplica. **Reportes** (`domain/entities/report/Report.ts`) y **notificaciones** (`domain/entities/notification/Notification.ts`, `NOTIFICATION_TYPES`) también se extienden.
9. **No verificado todavía** (se resuelve en la tarea indicada): índices de Firestore y reglas (fuera del repo, A0 y cada tarea con consulta nueva); cómo se hace la búsqueda por tokens hoy (A0, `exploreFetchers`); costo real por minuto de procesamiento de video (C3); si `optimizeMedia` ya atiende `sites/videos` o solo `events` (C3).

## Respuestas por defecto que adopto (el dueño las puede cambiar)

1. Prefijos de rutas: `/actividades`, `/actividades/[slug]`, `/actividades-{coleccion}-ibague`, `/cosas-para-hacer-en-ibague`.
2. La gestión del creador vive en `/actividades/mis` y el asistente en `/actividades/crear` (fuera de `/studio` por ser Premium).
3. Rutas de almacenamiento de la hallazgo 3.
4. Alerta a QHPA por **log estructurado** + política de Cloud Monitoring (crearla es "preguntar antes").
5. Semilla diaria del home = día Bogotá; conjunto de 8 con máx. 2 por sitio/anfitrión.
6. Resend (plan gratis) con **cola y tope diario** (`EMAIL_DAILY_CAP`, por debajo del límite gratis); solo `fetch`, sin dependencia nueva; correo solo con permiso y baja con un clic; push solo tras una acción de valor.
7. Tope de duración de origen del video de reseña = 3 min; origen ≤200 MB (el mismo que ya usa el procesador).
8. Escalera de sanciones y umbrales de la spec 8.6.

## Decisiones de arquitectura

- **Reutilizar antes que crear** (escalera): `SiteSections` + `SectionsAccordion`, `pickDiscoverIds`, `spamGuard`, `Report`, `Notification`, `contentDeclarations`, `bogotaDay`, `beaconGuard`/`ipRateLimit`/`dailyDedupe`, `GoogleAuthButton`, pipeline de medios y `UserService` para `creator`.
- **Lógica pura primero** (TDD): el motor de recurrencia, la visibilidad pública, la confianza de cuenta, los agregados de rating, las sanciones, los permisos y la semilla del home son funciones puras con test colocado; los servicios reciben dependencias inyectadas (patrón de `eventTrack.ts`).
- **Colecciones solo por Admin SDK**; lecturas públicas en servidor con `use cache` + `cacheTag`/`updateTag`. No se aumenta superficie de reglas de Firestore.
- **Sin TableScan**: toda consulta nueva se apoya en un campo indexable o tokenizado y su índice se **propone** (crearlo es "preguntar antes").
- **Home determinista por día**: nunca aleatorio por visita (rompería la caché).
- **Video**: se reusa el procesador de `../functions`; no hay HLS.
- **Moderación inicial**: `pending` no existe públicamente (404, no `noindex`); el creador la ve en su vista previa.
- **Prototipos**: cada tarea con interfaz va precedida por una tarea de **prototipo en Artifact** (una a la vez, el dueño aprueba antes de codificar). No se prototipa todo de golpe.

## Grafo de dependencias

```
A0 verificaciones ─ A1 categorías ─ A2 recurrencia ─ A3 precio/CTA ─ A4 slug/tokens ─ A5 entidad+reglas ─ A6 DTO/mapper ─ A7 repo+DI
                                                                                                              │
                                  A8 registro de oferentes ─┐                                                 │
                                  A9 antispam ───────────────┼─ A10 acciones crear/editar ─ A11 moderación+scripts ─ A12 transferencia por reclamo
                                                             ┘                                                 │
  [CP-1 dominio y servicio]                                                                                     │
                                  P1 prototipo ─ A13 asistente ─ A14 mis actividades ─ A15 ficha pública ─ A16 tarjeta+hub ─ A17 bloque en sitio ─ A18 SEO básico ─ [CP-F1]
                                                       │
  F2:  P2 prototipo ─ B1 home ─ B2 búsqueda ─ B3 filtros ─ B4 landings+pilar ─ [CP-F2]
  F3:  C0 legal ─ C1 dominio reseñas ─ C2 servicio ─ C3 functions (video/imágenes) ─ P3 ─ C4 UI reseñas ─ C5 "Yo fui" ─ C6 dominio moderación ─ C7 acciones+scripts ─ C8 UI rojo+respuesta ─ C9 reportes ─ C10 apelaciones ─ C11 supresión de cuenta ─ C12 auditoría de seguridad ─ [CP-F3]
  F4:  D1 ofertas/espacios ─ D2 promociones ─ P4 ─ D3 UI bloques ─ D4 medición ─ D5 panel del creador+kit ─ [CP-F4]
  F5:  E1 álbum ─ E2 cartelera de cine ─ E3 horarios avanzados
```

Paralelizable: A8 ∥ A9; B1 ∥ B2 tras F1; D1 ∥ D2; C1…C3 con A-media. Todo lo que comparte contrato (DTO de actividad) se define en A6 primero.

## Cuánto se demora (estimación mía, sin verificar)

Mido en **sesiones de trabajo** (≈ 1–3 horas mías con tus revisiones), no en calendario.

| Fase | Sesiones | Notas |
|---|---|---|
| F1 (A0–A26) | 13–17 | Dominio con TDD, asistente, ficha, hub, SEO básico, **guardar/yo fui/unirse, kit QR y medición mínima** |
| F2 (B1–B13) | 11–14 | Home, búsqueda, filtros, landings, Mis planes, avisos, resumen semanal, **correo (Resend), push web y ganchos de WhatsApp** |
| F3 (C0–C14) | 10–14 | La más delicada: reseñas con medios, moderación, `../functions`, auditoría, insignias |
| F4 (D1–D5) | 4–5 | Ofertas, promos, panel (la medición básica ya está en F1) |
| F5 (E1–E4) | 4–6 | Pulido y `activity-premium` |
| **Total** | **≈ 42–55** | Con prototipos incluidos; el calendario depende de qué tan rápido pruebes (estimación mía, sin verificar) |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Spam o páginas basura indexadas | Alto | `pending` invisible; autoaprobación solo con historial; frenos; sitemap solo público |
| Reseñas falsas / abuso del botón "cuestionar" | Alto | Una por cuenta, antigüedad mínima, declaración, topes, sanciones, reseña visible mientras se verifica |
| Costo del video | Alto | Reusar procesador; borrar original; tope de duración/tamaño; interruptor `reviewVideoEnabled`; cifras de peor caso (C3) antes de activar |
| Cambios en `../functions` (otro repo) | Med | Tareas separadas; compatibles hacia atrás; empujar su rama junto al despliegue; **preguntar antes** |
| Consultas sin índice (TableScan) | Med | Campos tokenizados/denormalizados; índices propuestos y aprobados antes |
| Cumplimiento (Ley 1480 art. 53, datos personales) | Alto | Registro de oferentes obligatorio (A8); textos legales (C0); supresión (C11) |
| Sin navegador automático (MCP caídos al inicio de esta sesión) | Med | Guion numerado para que el dueño pruebe en cada checkpoint, y Playwright cuando esté disponible |
| Alcance enorme | Alto | Fases verificables; cada fase se puede detener; prototipos por tarea para corregir antes de construir |
| Cambio de autor de sitio rompe D12 | Med | A12 transfiere actividades al aprobar el reclamo |
| Next 16 difiere de lo conocido (`AGENTS.md`) | Med | Leer `node_modules/next/dist/docs/` antes de tocar APIs; cuidado con `notFound()` en shell y `cachedNavigations` |
| Correo marcado como spam o enviado sin permiso | Alto | Casilla separada, baja con un clic, tope diario, SPF/DKIM/DMARC, solo contenido útil con "por qué lo recibes" |
| El plan gratis de Resend (≈100/día, a verificar) se queda corto | Med | Cola con tope y prioridad a transaccionales, aviso al 80%, plan B (Brevo o plan de pago) |
| Push poco soportado en iPhone | Med | Solo con la PWA instalada (verificar); la campanita y el correo lo cubren |
| Pedir permiso de push demasiado pronto lo quema | Med | Solo tras una acción de valor; no repetir en 30 días |

## Cosas que pediré al dueño al llegar a F2 ("preguntar antes")

1. **DNS** de `yquehaypahacer.com`: SPF, DKIM y DMARC para el remitente (por ejemplo `hola@yquehaypahacer.com`).
2. **Cuenta de Resend** y su clave como **secreto de App Hosting** (solo hablo de su nombre).
3. **Claves VAPID/FCM** para push web.
4. **`LEGAL_VERSION`** y textos: consentimiento de correo/push y transmisión internacional (Resend, Firebase).
5. **Activar envíos reales** a usuarios (primero solo a cuentas de QA en develop).
6. Confirmar los límites vigentes del plan gratis de Resend y de FCM en sus páginas oficiales.

## Orden de despliegue

`develop` primero (avisar antes de `git push origin develop`: dispara rollout), probar con el guion de cada checkpoint, y luego prod **solo con orden explícita** (cherry-pick en worktree limpio, como se ha hecho). Cambios en `../functions` **antes** de la app si son compatibles hacia atrás; empujar su rama junto al despliegue. Las alertas y los índices de Firestore se piden y aplican por separado.

## Verificación continua (en cada tarea)

`pnpm typecheck` + `pnpm test` verdes antes de marcar; `pnpm build` completo en cada checkpoint; rutas explícitas en `git add` (nunca `-A`); un commit por tarea con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; sin `git stash` simple, sin tocar `main`.

## Preguntas abiertas restantes

- Aprobar el plan, el mapa de tareas y las respuestas por defecto de arriba.
- Cambio respecto de la spec: **la gestión de actividades fuera de `/studio`** (por ser Premium). ¿De acuerdo?
- ¿Arrancamos por A0 (verificaciones, solo lectura) apenas apruebes?
