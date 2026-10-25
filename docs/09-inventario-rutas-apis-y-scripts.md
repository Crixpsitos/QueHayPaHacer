# Inventario de rutas, APIs, acciones y scripts

Snapshot: 2026-10-10. Este inventario describe superficies encontradas; no reemplaza tests de permisos.

## 1. Páginas públicas principales

| URL | Archivo | Propósito |
|---|---|---|
| `/` | `app/(home)/page.tsx` | Home, campañas, búsqueda y recomendaciones. |
| `/login` | `app/(auth)/login/page.tsx` | Inicio de sesión. |
| `/register` | `app/(auth)/register/page.tsx` | Registro. |
| `/eventos` | `app/eventos/(descubrir)/page.tsx` | Descubrimiento de eventos. |
| `/eventos/[id]` | `app/eventos/(detail)/[id]/page.tsx` | Detalle de evento. |
| `/eventos/[id]/sessions/[sessionId]` | route group detail | Detalle público de sesión. |
| `/donde-ir` | `app/donde-ir/page.tsx` | Descubrimiento de sitios. |
| `/donde-ir/[id]` | `app/donde-ir/[id]/page.tsx` | Detalle de sitio. |
| `/explorar` | `app/explorar/page.tsx` | Búsqueda combinada. |
| `/contactanos` | `app/(home)/contactanos/page.tsx` | Contacto y Premium. |
| `/profile/[handle]` | `app/(home)/profile/[handle]/page.tsx` | Perfil público. |
| `/[coleccion]` | `app/(landings)/[coleccion]/page.tsx` | Landings SEO de colecciones. |
| `/sites` | `app/sites/page.tsx` | Superficie de sitios; el proxy la considera privada. |
| `/sites/[id]` | `app/sites/[id]/page.tsx` | Alias/superficie de sitio. |

`/events/:path*` redirige temporalmente a `/eventos/:path*` con 307.

## 2. Páginas autenticadas/de edición

| URL | Propósito | Protección observable |
|---|---|---|
| `/profile` | Perfil propio y trayectoria. | Proxy. |
| `/mis-eventos` | Gestión personal de eventos. | Proxy. |
| `/eventos/create` | Crear evento. | Proxy + acciones. |
| `/eventos/[id]/edit` | Editar evento. | Controles de página/acciones; auditar matriz. |
| `/eventos/[id]/sessions` | Gestionar sesiones. | Token/acciones; auditar ruta. |
| `/sites/create` | Crear sitio. | Proxy por prefijo `/sites`. |
| `/sites/[id]/edit` | Editar sitio. | Proxy por prefijo `/sites`. |

## 3. Studio Premium

`StudioGate` exige token y `plan === "premium"`.

| URL | Propósito |
|---|---|
| `/studio` | Overview/KPIs. |
| `/studio/events` | Lista de eventos. |
| `/studio/events/[id]` | Detalle de evento. |
| slot `@registrations` | Registros/asistencia. |
| slot `@stats` | Estadísticas. |
| slot `@multidate` | Estadísticas/sesiones multifecha. |
| `/studio/events/[id]/.../session/[sessionId]` | Detalle de sesión en Studio. |
| `/studio/collaborators` | Invitaciones y perfiles externos. |
| `/studio/support` | Tickets de soporte. |

## 4. Route Handlers

| Método y ruta | Acceso | Función/estado |
|---|---|---|
| `GET /api/auth/me` | Cookie opcional | Usuario actual y custom token; anónimo devuelve `user:null`. |
| `GET /api/categories` | Público | Categorías activas cacheadas. |
| `GET /api/events/[id]/sessions` | Cookie requerida | Sesiones cacheadas (borradores solo para el autor). |
| `GET /api/events/likes` | Cookie opcional | Mapa de likes; anónimo devuelve `{}`. |
| `POST /api/events/likes` | Cookie opcional | Lectura batch de likes, no toggle. |
| `POST /api/sites/likes` | Cookie opcional | Lectura batch de likes de sitios. |
| `POST /api/events/moderation` | Bearer secret | Aplica decisión de moderación. |
| `GET /api/profile/me` | Cookie requerida (401) | Eventos/sitios/likes/badges recientes del usuario. |
| `GET /api/profile/preference-events` | Cookie opcional | Recomendaciones; sin preferencias devuelve `[]`. |
| `GET /api/profile/events?uid=` | `canViewProfile` | Eventos publicados del perfil. |
| `GET /api/profile/sites?uid=` | `canViewProfile` | Sitios del perfil. |
| `GET /api/profile/badges?uid=` | `canViewProfile` | Insignias del perfil. |

Eliminados el **2026-10-10**: `POST /api/revalidation/events` (handler vacío), `GET /api/admin/seed-badges` (reemplazado por `scripts/seed-badges.ts`), `GET /api/profile/stats` y `GET /api/profile/likes` (sin consumidores). También `cache-handler.js`.

## 5. Server Actions por dominio

### Guard de sesión

`app/actions/_session.ts` (**2026-10-10**): `getSessionUid()`, `getPremiumSessionUid()`, `isStudioEventOwner(eventId)`, `isStudioSiteOwner(siteId)` y `canViewProfile(uid)`. Las acciones que reciben `uid`/`userId` deben derivar el usuario de la sesión; `app/actions/_session.test.ts` lo verifica estáticamente. Registro interno de vistas: `app/actions/events/_recordEventView.ts` (solo para server components en `after()`). Guard de sesiones: `app/actions/events/lib/sessionOwnership.ts` (`sessionOwnerError`, `afterSessionChange`).

### Autorización (matriz)

| Familia | Guard en código |
|---|---|
| Perfil (`app/actions/profile/*`) | `getSessionUid()`/`getTokens`: solo opera sobre el uid de la sesión; nunca uid del cliente. |
| Auth `change-password`, `delete-account` | `getSessionUid()`. |
| Páginas Studio (`app/(studio)/studio/**/page.tsx`) | `getPremiumSessionUid()`; detalle de evento/sitio con `isStudioEventOwner`/`isStudioSiteOwner` (además de `StudioGate` en el layout). |
| Actions Studio | Soporte, `cancel-invitation`, `remove-collaborator`: `getPremiumSessionUid()`. `confirm-attendance`, `remove-participant`: `isStudioEventOwner`. `invite-collaborators`, `search-collaborators`, `create-external-profile`: sesión + `plan === "premium"`. |
| `respond-collaborator-invitation` | Solo sesión (el repo verifica que sea el invitado). **Sin gate Premium a propósito**, pendiente de decisión de producto. |
| Sesiones de evento (create/save-draft/update/delete/set-status) | `sessionOwnerError` (`lib/sessionOwnership.ts`): autor del evento + `eventType === "multi-date"` + Premium. |
| `update-event`, `publish-event` | Sesión + email verificado + `author.id === uid`; `withServerOwnedFields`/`moderationFieldsForSubmission` fijan author/slug/promotion/status en servidor. |
| `delete-event`, `get-event-attendees`, `migrate-event-type` | Sesión + `author.id === uid` (`migrate` exige además Premium). |
| Mutaciones de sitios (save/publish/update/delete/set-active) | uid de sesión; sobre sitios existentes (`updateDraft`, `publishExisting`, `updateSite`, `setActive`, `deleteSite`) `SitesService.assertOwner(uid, id)`. |
| `/api/profile/{badges,events,sites}` | `canViewProfile(uid)`: perfil público o propio. |
| `generateUploadUrl` (`presentation/shared/actions/`) | Sesión + allowlists de entidad (`profile`/`support` solo al propio uid), subcarpeta, mime (sin SVG) y metadata; `fileName` sanitizado. Sin tope de tamaño. |
| `POST /api/events/moderation` | Bearer `EVENT_MODERATION_WEBHOOK_SECRET` (comparación timing-safe). |
| `POST /api/sites/revalidate` | Bearer `SITE_REVALIDATE_WEBHOOK_SECRET` (timing-safe); solo refresca cachés de un sitio. La llaman la Cloud Function `notifySiteModeration` y `scripts/list-site-claims.ts`. |
| `POST /api/events/revalidate` | Mismo secreto; refresca cachés de un evento (baja). La llama la Cloud Function `notifyEventChanges`. |
| `getHolidaysAction` (`app/actions/config/`) | Pública (festivos no son datos personales); `use cache` días, etiqueta `config-holidays`. |
| `admin-holidays.action.ts` | `getAdminUid()` (QHPA_ADMIN_UIDS): editar/restablecer festivos e invalidar caché. |
| `getTransitRoutesAction` (`app/actions/config/`) | Pública (catálogo de rutas de bus); `use cache` días, etiqueta `config-transit`. |
| `admin-transit.action.ts` | `getAdminUid()`: ver/guardar el catálogo, `markRouteChangedAction(id)` e invalidar caché. |
| `getSiteTransitViewAction` (`app/actions/site-transit/`) | Pública; `use cache` minutos, etiquetas `site-<id>` y `config-transit`. Estado "por confirmar" calculado al leer. |
| `reportTransitOutdatedAction` | `getSessionUid()`: "Está desactualizado" (una vez por persona y sitio, no el autor); a los 3 avisa al autor. |
| `update-tag` | Allowlist `featured-events`. |

### Auth

- `change-password.action.ts`
- `delete-account.action.ts`
- `google-auth.action.ts`
- `login.action.ts`
- `login-modal.action.ts`
- `logout.action.ts`
- `register.action.ts`

### Eventos

- crear/publicar/actualizar/eliminar evento;
- crear/guardar/actualizar/eliminar/cambiar estado de sesión;
- convertir standard/multi-date;
- obtener sesiones/asistentes/eventos por sitio;
- like, share, view y registro;
- cargar más por categoría;
- perfiles externos y colaboradores;
- sincronización de rango de fechas y siteIds.

Archivos principales:

```text
create-draft-event.action.ts
publish-event.action.ts
update-event.action.ts
delete-event.action.ts
create-event-session.action.ts
save-draft-session.action.ts
update-event-session.action.ts
delete-event-session.action.ts
set-session-status.action.ts
migrate-event-type.action.ts
register-event.action.ts
like-event.action.ts
share-event.action.ts
record-event-view.action.ts
get-event-attendees.action.ts
get-event-sessions.action.ts
get-events-by-site.action.ts
load-more-category.action.ts
create-external-profile.action.ts
get-external-profile.action.ts
get-my-collaborators.action.ts
get-user-likes.action.ts
_recordEventView.ts
lib/sessionOwnership.ts
lib/eventModerationPolicy.ts
lib/syncEventDateRange.ts
lib/syncEventSiteIds.ts
```

### Sitios

```text
save-draft-site.action.ts
publish-site.action.ts
update-site.action.ts
delete-site.action.ts
set-site-active.action.ts
get-my-sites.action.ts
get-user-sites-for-picker.action.ts
load-more-sites.action.ts
record-site-interaction.action.ts
buildSiteInput.ts
buildSiteMedia.ts
_revalidate.ts
```

### Perfil

```text
check-username-availability.action.ts
update-profile.action.ts
update-profile-visibility.action.ts
update-avatar.action.ts
update-banner.action.ts
delete-banner.action.ts
```

### Studio

```text
invite-collaborators.action.ts
search-collaborators.action.ts
respond-collaborator-invitation.action.ts
cancel-invitation.action.ts
remove-collaborator.action.ts
confirm-attendance.action.ts
remove-participant.action.ts
record-external-registration-click.action.ts
create-support-ticket.action.ts
get-support-ticket-detail.action.ts
close-support-ticket.action.ts
```

### Helpers fuera de `app/actions` (**2026-10-10**)

- `app/lib/utils/safeRedirect.ts`: valida destinos de redirect post-login (solo rutas internas).
- `presentation/sites/data/siteDetailFetchers.ts`: detalle público de sitio por slug/id (solo publicado + aprobado + activo), compartido por metadata/página/contenedor.
- `presentation/sites/lib/openStatus.ts`: estado abierto/cerrado de sitios en `America/Bogota`.
- `application/dto/sites/SiteDto.ts`: DTO/esquema de entrada de sitios (usado por las actions de sitios).

### Otros

- Contacto: envío de contacto.
- Explore: paginación de eventos/sitios.
- Cache: actualización de tag (allowlist `featured-events`).

## 6. Scripts manuales

### Auditoría/inspección

- `audit-consumer-privacy.ts`
- `inspect-sites-new-badge.ts`
- `verify-featured-creators.ts`

### Backfill/migración

- `backfill-event-score.ts`
- `backfill-interaction-type.ts`
- `backfill-multidate-dates.ts`
- `backfill-multidate-siteids.ts`
- `backfill-session-slugs.ts`
- `link-events-to-site.ts`
- `migrate-category-slugs.ts`
- `migrate-events-location.ts`
- `migrate-sites-location.ts`
- `reschedule-events.ts`

### Cleanup

- `cleanup-duplicate-categories.ts`
- `cleanup-session-likes.ts`
- `cleanup-test-events.ts`
- `deactivate-extra-categories.ts`

### Seed/datos de ensayo

- `seed-bulk-events.ts`
- `seed-bulk-sites.ts`
- `seed-holidays.ts` (festivos de Colombia → `appConfig`; dry-run por defecto, opcional)
- `seed-transit-routes.ts` (catálogo de rutas de bus → `appConfig/transit-routes`; dry-run por defecto, no pisa; lista a revisar por una persona de Ibagué)
- `seed-campaigns.ts`
- `seed-categories.ts`
- `seed-event-analytics.ts`
- `seed-events-with-collaborators.ts`
- `seed-fake-users.ts`
- `seed-badges.ts` (dry-run por defecto, `--apply` escribe, idempotente; `pnpm exec tsx scripts/seed-badges.ts [--apply]`)
- `seed-first-event-badge.ts`
- `seed-invitations.ts`
- `seed-site-events.ts`
- `seed-site-interactions.ts`
- `seed-site-new-fields.ts`

### Administración

- `create-verified-creator.ts`
- `_loadEnv.ts` es helper de carga de entorno.

## 7. Reglas para ejecutar scripts

Antes de cualquier script:

1. confirmar proyecto Firebase activo;
2. confirmar dry-run o leer el código completo;
3. tomar backup;
4. estimar documentos afectados;
5. usar credencial mínima;
6. registrar ejecutor, timestamp y resultado;
7. comprobar idempotencia;
8. validar datos después;
9. definir rollback/compensación.

No asumir que todos implementan `--apply` o dry-run de la misma forma.

### Matriz de comportamiento observada

Ningún script operativo está declarado en `package.json`. Desde el **2026-10-10** `tsx` es devDependency, así que la CLI es `pnpm exec tsx scripts/<archivo>.ts ...`. Scripts de calidad en `package.json`: `typecheck` (`next typegen && tsc --noEmit --pretty false`) y `test` (`tsx --test "**/*.test.ts" "**/*.test.tsx"`). “Repetible” no significa transaccional ni garantiza rollback.

| Grupo | Scripts | Comportamiento por defecto | Idempotencia/rollback |
|---|---|---|---|
| Dry-run con `--apply` | `audit-consumer-privacy`, todos los `backfill-*`, `cleanup-session-likes`, `link-events-to-site`, migraciones de categoría/location, `reschedule-events`, seeds de badges/campaigns/categories/analytics/first-badge/site-events/site-interactions/site-new-fields, `verify-featured-creators` | No escribe sin `--apply`. | Revisar código y conteos; rollback no está generalizado. |
| Lectura/inspección | `inspect-sites-new-badge` | Solo lectura; acepta filtros. | Sin rollback. |
| Escritura inmediata | `create-verified-creator`, `seed-bulk-events`, `seed-bulk-sites`, `seed-events-with-collaborators`, `seed-fake-users`, `seed-invitations` | Crea documentos/cuentas al ejecutar. Algunos aceptan `--clean`. | Riesgo de duplicados o datos de prueba; requiere ambiente y backup explícitos. |
| Destructivo inmediato | `cleanup-duplicate-categories`, `cleanup-test-events`, `deactivate-extra-categories` | Modifica/elimina sin convención `--apply` observada. | Tratar como alto riesgo; restauración desde backup/compensación manual. |
| Helper | `_loadEnv.ts` | Carga `.env`/`.env.local`; no ejecutar como migración. | No aplica. |

Antes de normalizar scripts se debe añadir a cada uno metadata uniforme (`--dry-run`, `--apply`, `--project`, confirmación, resumen y salida JSON).

## 8. Layouts y shells

- Root: providers, fuentes, metadata y Toaster; `app/error.tsx` y `app/global-error.tsx` como boundaries globales.
- Home: Navbar, PageContent, Footer, Modal/Tooltip.
- Profile: `app/(profile)/layout.tsx` + `profile/layout.tsx` (Navbar compartido + Settings drawer).
- Studio: Gate Premium + StudioShell; `studio/loading.tsx` y `studio/error.tsx`.
- Eventos/Sitios/Explorar: layouts por experiencia pública.
- Landings: colecciones SEO.

## 9. Superficies que requieren revisión de permisos

- `/eventos/[id]/edit` y gestión de sesiones;
- APIs públicas por `uid` para privacidad;
- signed upload URLs (sesión + allowlists desde **2026-10-10**; falta tope de tamaño);
- acciones de soporte;
- cambios de plan/verificación por scripts;
- colaboradores y perfiles externos;
- eliminación de cuenta;
- cualquier ruta futura bajo `/api`, ya que proxy excluye APIs generales.

### Capacidades por actor

| Actor | Capacidades esperadas |
|---|---|
| Anónimo | Leer Home, eventos, sitios, categorías, colecciones y perfiles públicos. |
| Autenticado | Perfil propio, likes, registro, aportes y acciones autorizadas sobre recursos propios. |
| Consumer | Puede aportar; tras aprobación de su primer contenido puede pasar a creator según flujo actual. |
| Creator Basic | Eventos/sitios estándar y gestión básica. |
| Creator Premium | Multifecha, Studio, formularios/colaboradores según gates actuales. |
| Creator verificado | Publicación con auditoría posterior; no implica Premium. |
| Webhook de moderación | Solo decisión con Bearer secret. |
| Administrador humano | No existe un rol/claim único documentado; seeds y operaciones deben cerrarse hasta definirlo. |

## 10. Inventario pendiente por automatizar

Este archivo debe generarse/comprobarse en CI para detectar:

- página/API/action nueva sin owner;
- endpoint sin política de auth;
- script nuevo sin runbook;
- ruta privada fuera de la matriz;
- colección nueva sin reglas/retención;
- variable nueva sin matriz de ambientes.