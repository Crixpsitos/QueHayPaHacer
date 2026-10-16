# 17 · Notificaciones (campanita)

Avisos cortos dentro de la app. Sin correo, sin push, sin preferencias, sin tiempo real.

## Dónde viven los datos

- Subcolección `users/{uid}/notifications` en la base `quehaypahacer-db`. Solo Admin SDK (las reglas niegan todo acceso de cliente).
- Campos: `type`, `title` (≤120), `body?` (≤240), `href?` (ruta interna), `readAt` (`null` = sin leer), `createdAt`, `expireAt`.
- Ni lecturas ni escrituras necesitan índice compuesto.
- Código: `domain/entities/notification/` (tipos, `sanitizeNotification`, textos compartidos en `messages.ts`), `NotificationService` (`notify` nunca lanza), `NotificationFirebaseRepository`.

## Quién crea cada aviso

| Tipo | Destinatario | Se crea en |
|---|---|---|
| `invitation_received` | invitado | `inviteCollaboratorsAction` (solo invitaciones realmente creadas) |
| `invitation_accepted` | quien invitó | `respondCollaboratorInvitationAction` (un rechazo no avisa) |
| `team_role_changed` | miembro del equipo | `changeCollaboratorRoleAction` (solo si el rol cambia) |
| `suggestion_received` | autor del sitio | `suggestSiteChangeAction` |
| `suggestion_resolved` | quien sugirió | `resolveSiteSuggestionAction` y `scripts/list-site-suggestions.ts` |
| `claim_resolved` | reclamante (y reclamos que pierden) | `scripts/list-site-claims.ts` (`--approve` / `--reject`) |
| `event_moderation` | autor del evento | `app/api/events/moderation/route.ts` (webhook) |
| `site_moderation` | autor del sitio | **Cloud Function** `notifySiteModeration` (ver abajo) |

Los avisos de moderación de **sitios** salen de un trigger porque la decisión se toma a mano en Firestore (o con el futuro panel) y no pasa por código de la app. Avisa de `pending→approved`, `pending→rejected` y `approved→rejected` ("dieron de baja"); editar un sitio aprobado lo devuelve a revisión y no avisa.

## Cómo se ve

- `NotificationBell` junto al menú de cuenta (navbar y mapa de sitios). Escritorio: popover; móvil: drawer.
- Insignia con el conteo (9+). Al **cerrar** el panel, todo queda leído.
- El conteo se pide al cargar y al volver a la pestaña (consulta `count()`, sin caché: webhooks y Cloud Functions no pueden invalidar etiquetas de Next).
- Se muestran los 30 más recientes.

## Operación (lo hace una persona)

1. **Desplegar el trigger** (repo `functions`): `firebase deploy --only functions:notifySiteModeration` (develop primero; prod cuando exista).
2. **Activar TTL** para que Firestore borre los avisos a los 90 días (una sola vez por proyecto):
   `gcloud firestore fields ttls update expireAt --collection-group=notifications --enable-ttl --database=quehaypahacer-db --project=<proyecto>`
   Sin esto los avisos no se borran solos (no estorba: la lista muestra 30).

## Límites conocidos

- Sin tiempo real: un aviso nuevo aparece al recargar, abrir la campanita o volver a la pestaña.
- Cerrar el panel marca todo como leído aunque no se haya abierto cada aviso.
- Rechazar una invitación no avisa a quien invitó (decisión de producto).
- No hay aviso al agregar a alguien a un evento (solo cambio de rol), ni al quitarlo.
- No hay aviso para "dar de baja" un **evento** (solo aprobado/rechazado vía webhook).
- Un sitio que el autor despublica o que se baja cambiando `publicationStatus` (no `moderationStatus`) no genera aviso.
- El panel de reclamos/sugerencias por script avisa solo si se ejecuta con `--apply`.
- **El aviso de "aprobaron tu sitio" puede llevar a una ficha que aún da 404.** La ficha pública se cachea (`cacheLife("hours")`, ver `siteDetailFetchers.ts`) y una aprobación hecha en Firestore o por trigger no puede invalidar esa caché de Next. Hasta que expire (≤1 h; en Cloud Run también se pierde al reciclarse la instancia) la ficha puede seguir en 404. Solución si molesta: un endpoint protegido por secreto que la Cloud Function llame para hacer `revalidateTag(\`site-<id>\`)`, `site-list` y `explore`.
- Un sitio con `isActive: false` (desactivado por su dueño) no es público aunque esté aprobado; el aviso de aprobación igual se envía.
