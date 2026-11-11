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

## Hallazgos verificados en el código (A0, 2026-11-10) y su efecto

1. **`/studio` es solo Premium** (`StudioGate.tsx`: sin sesión → `/premium`; sin Premium y sin equipo de eventos → `/profile`). Decisión D1 → la gestión de actividades va en rutas abiertas `app/actividades/{crear,mis,[id]/editar}`, como `/sites`. Las estadísticas del creador (F4) también fuera de Studio.
2. **Promoción a `creator` ya existe**: `userService.markAsCreator(uid)` (`application/services/user/UserService.ts`; devuelve si ya es creator, si no pone `participation: "creator"`), llamada desde `publish-site.action.ts` dentro de un `try/catch` que solo registra, seguida de `updateTag("user-profile-<uid>")`. Se reutiliza igual (D37).
3. **Propiedad de un sitio**: `sitesService.isOwner(uid, siteId)` **ya existe** (`SitesService.ts` ≈ línea 180) y lo usa `publishSiteAction`. En Firestore el autor es `author.id` (`RawAuthorDto { id, displayName, photoURL? }`); el dominio lo expone como `Site.author.uid` y el mapper traduce (`SiteFirebaseMapper.ts`). Consulta por autor: `where("author.id","==",uid)`. Se **reutiliza `isOwner`** para D12 (nada de reimplementarlo).
4. **Búsqueda = índices de texto de Firestore Enterprise**, no tokens propios: `firebase/firestore.indexes.json` define `searchConfig.textSpec` TOKENIZED/MATCH_GLOBALLY para `events`, `sites`, `registrations` y `users`; `presentation/events/data/exploreFetchers.ts` consulta con `db.pipeline().collection(...).search({ query: documentMatches(q), sort: score().descending() })`. Hay un `console.warn("[explore] sites search index not ready")` si el índice no está listo. **Efecto:** se elimina `searchTokens`; se agrega un índice de texto para `activities` (`title`, `tagline`, `description`, `category`, nombre del sitio). Crear el índice es **"preguntar antes"**. Solo hay **4 índices** en el repo: las demás consultas de actividades se mantienen simples (igualdad) o se proponen índices compuestos aparte.
5. **Procesador de medios en `../functions` ya es genérico**: `onObjectFinalized.optimizeMedia.ts` (`optimizeMediaImages`/`optimizeMediaVideos`) sirve a toda carpeta de `OPTIMIZABLE_FOLDERS` salvo `events`, con ruta `public/{coleccion}/{docId}/{images|videos}/…` y parche del `media[]` **plano** del documento `{coleccion}/{docId}` (estado `processing → ready|error`). `optimizeVideos.ts`, `optimizeImages.ts` y `optimizeSessions.ts` son de eventos/sesiones. **Efecto:** agregar `ACTIVITIES` y `ACTIVITY_REVIEWS` a `OPTIMIZABLE_FOLDERS` basta; **las reseñas pasan a ser colección de primer nivel `activityReviews/{activityId}_{uid}`** con `media[]` plano (una subcolección no encaja con `db.doc(coleccion/docId)`). Rutas: `public/activities/{id}/…` y `public/activityReviews/{activityId}_{uid}/…`.
6. **El optimizador NO borra el archivo original** (solo los temporales). La spec decía "borrar el original": requiere un cambio extra o una **regla de ciclo de vida del bucket**; se resuelve en C3. Tope de origen del video **200 MB**; no recorta duración.
7. **Next 16.4.2** con `cacheComponents: true` y `experimental.cachedNavigations: false` (`next.config.ts`). Patrón de ficha existente: `app/donde-ir/[id]/page.tsx` (`params` como `Promise`, `fetchPublicSiteDetail`, OG JPEG en `/og/site/[id]`; el mismo `[id]` resuelve además las colecciones `donde-ir-…`). Las guías están en `node_modules/next/dist/docs/` (p. ej. `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`, `01-app/02-guides/migrating-to-cache-components.md`); se leen antes de tocar rutas dinámicas en A16.
8. **Landings por colección** (`app/(landings)/[coleccion]/page.tsx`) distinguen por prefijo (`donde-ir-` o colección de eventos); se agrega `actividades-` sin tocar lo demás.
9. **Sitemap** (`app/sitemap.ts`): `"use cache"` + `cacheTag("sitemap","site-list","event-list")` → se suma `activity-list`.
10. **Home**: `app/(home)/page.tsx` compone bloques en `Suspense`; `pickDiscoverIds(ids, limit, excludeIds, random)` acepta un generador → semilla por día.
11. **Antispam, reportes y notificaciones** ya centralizados (`spamGuard.ts`, `Report.ts`, `Notification.ts`): se **extienden**.
12. **Pendiente de verificar en su tarea**: índices de Firestore y reglas (fuera del repo; cada tarea con consulta nueva), costo de procesamiento de video (C3), borrado del original (C3), nombre de la ruta de "Mis planes" (B5).

## Respuestas por defecto que adopto (el dueño las puede cambiar)

1. Prefijos de rutas: `/actividades`, `/actividades/[slug]`, `/actividades-{coleccion}-ibague`, `/cosas-para-hacer-en-ibague`.
2. La gestión del creador vive en `/actividades/mis` y el asistente en `/actividades/crear` (fuera de `/studio` por ser Premium).
3. Rutas de almacenamiento del hallazgo 5.
4. Alerta a QHPA por **log estructurado** + política de Cloud Monitoring (crearla es "preguntar antes").
5. Semilla diaria del home = día Bogotá; conjunto de 8 con máx. 2 por sitio/anfitrión.
6. Resend (plan gratis) con **cola y tope diario** (`EMAIL_DAILY_CAP`, por debajo del límite gratis); solo `fetch`, sin dependencia nueva; correo solo con permiso y baja con un clic; push solo tras una acción de valor.
7. Tope de duración de origen del video de reseña = 3 min; origen ≤200 MB (el mismo que ya usa el procesador).
8. Escalera de sanciones y umbrales de la spec 8.6.

## Decisiones de arquitectura

- **Reutilizar antes que crear** (escalera): `SiteSections` + `SectionsAccordion`, `pickDiscoverIds`, `spamGuard`, `Report`, `Notification`, `contentDeclarations`, `bogotaDay`, `beaconGuard`/`ipRateLimit`/`dailyDedupe`, `GoogleAuthButton`, pipeline de medios y `UserService` para `creator`.
- **Lógica pura primero** (TDD): el motor de recurrencia, la visibilidad pública, la confianza de cuenta, los agregados de rating, las sanciones, los permisos y la semilla del home son funciones puras con test colocado; los servicios reciben dependencias inyectadas (patrón de `eventTrack.ts`).
- **Colecciones solo por Admin SDK**; lecturas públicas en servidor con `use cache` + `cacheTag`/`updateTag`. No se aumenta superficie de reglas de Firestore.
- **Sin TableScan**: toda consulta nueva se apoya en un campo indexable o en el **índice de texto TOKENIZED** de Firestore Enterprise (como sitios y eventos) y su índice se **propone** (crearlo es "preguntar antes").
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
