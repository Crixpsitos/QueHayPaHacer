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
| `invitation_accepted` / `invitation_declined` | quien invitó | `respondCollaboratorInvitationAction` |
| `team_added` / `team_removed` | la persona agregada, acreditada o quitada del equipo de un evento | **Cloud Function** `notifyEventChanges` (compara `collaborators` antes/después) |
| `team_role_changed` | miembro del equipo | `changeCollaboratorRoleAction` (solo si el rol cambia) |
| `suggestion_received` | autor del sitio | `suggestSiteChangeAction` |
| `suggestion_resolved` | quien sugirió | `resolveSiteSuggestionAction` y `scripts/list-site-suggestions.ts` |
| `claim_resolved` | reclamante (y reclamos que pierden) | `scripts/list-site-claims.ts` (`--approve` / `--reject`) |
| `event_moderation` | autor del evento | `app/api/events/moderation/route.ts` (webhook) |
| `site_moderation` | autor del sitio | **Cloud Function** `notifySiteModeration` (ver abajo) |
| `transit_outdated` | autor del sitio | `reportTransitOutdatedAction` (al llegar a 3 reportes de personas distintas; id idempotente por versión del bloque de buses) |
| `event_moderation` (baja) | autor del evento | **Cloud Function** `notifyEventChanges` (publicado → rechazado) |

Los avisos de moderación de **sitios** salen de un trigger porque la decisión se toma a mano en Firestore (o con el futuro panel) y no pasa por código de la app. Avisa de `pending→approved`, `pending→rejected`, `approved→rejected` ("dieron de baja") y `published→draft` ("ya no está publicado", lo haya hecho el autor u otra persona); editar un sitio aprobado lo devuelve a revisión y no avisa.

Los avisos de **eventos** que no pasan por una acción (altas/bajas del equipo, baja de un evento publicado) salen de `notifyEventChanges`. El rechazo de un evento *pendiente* lo avisa el webhook `/api/events/moderation`, así que no se duplica. La lógica vive en `functions/src/modules/notifications/notices.ts` (pura, con tests: `npm test` en `functions`).

## Cómo se ve

- `NotificationBell` junto al menú de cuenta (navbar y mapa de sitios). Escritorio: popover; móvil: drawer.
- Insignia con el conteo (9+). Al **cerrar** el panel, todo queda leído.
- El conteo se pide al cargar y al volver a la pestaña (consulta `count()`, sin caché: webhooks y Cloud Functions no pueden invalidar etiquetas de Next).
- Se muestran los 30 más recientes.

## Caché de la ficha pública tras una moderación a mano

La ficha (`fetchPublicSiteDetail`) se cachea, y una aprobación/baja hecha en Firestore no puede invalidar la caché de Next. Se resuelve en dos capas:

1. **Fichas no públicas** (en revisión, rechazadas, inexistentes) se cachean solo `minutes`: una aprobación aparece en ~1–2 min. Medido en develop: ~75 s (antes, hasta 1 h).
2. **Bajas y cambios de fichas publicadas:** la Cloud Function llama a `POST /api/sites/revalidate` (o `/api/events/revalidate` para eventos) (Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`) tras **cualquier** cambio de `moderationStatus`; invalida `site-<id>`, `site-list`, `featured-sites`, `explore` y las listas del autor. Medido en develop: la ficha pasa de pública a 404 al instante. Sin la configuración de abajo, una baja puede seguir visible hasta ~1 h.

## Operación (lo hace una persona)

**Orden obligatorio** (si `apphosting.yaml` referencia un secreto que no existe, el despliegue de App Hosting falla): 1) crear el secreto, 2) desplegar la función, 3) **descomentar** en `apphosting.yaml` y `apphosting.production.yaml` el bloque `SITE_REVALIDATE_WEBHOOK_SECRET` (hoy está como comentario "PENDIENTE" para poder fusionar la rama sin el secreto) y desplegar la app.

0. **Secreto compartido** (mismo valor en App Hosting y en las functions; se genera en una variable y no se imprime). Los `.env.*` del repo `functions` están **versionados en git**: no pongas secretos ahí.
   ```bash
   P=quehaypahacer-develop
   SECRET=$(openssl rand -base64 32)
   printf %s "$SECRET" | firebase apphosting:secrets:set siteRevalidateWebhookSecret --data-file=- --project $P
   firebase apphosting:secrets:grantaccess siteRevalidateWebhookSecret --backend quehaypahacerdev --project $P
   printf %s "$SECRET" | firebase functions:secrets:set SITE_REVALIDATE_WEBHOOK_SECRET --data-file=- --project $P
   unset SECRET
   ```
   La URL de la app (no es secreta) va en `functions/.env.<proyecto>` como `REVALIDATE_APP_URL=https://…` (develop: `https://quehaypahacerdev--quehaypahacer-develop.us-central1.hosted.app`; prod: el dominio propio).

1. **Desplegar el trigger** (repo `functions`; con `secrets: [...]` el deploy ya lo enlaza al secreto): `firebase deploy --only functions:notifySiteModeration,functions:notifyEventChanges` (develop primero; prod cuando exista).
2. **Activar TTL** para que Firestore borre los avisos a los 90 días (una sola vez por proyecto):
   `gcloud firestore fields ttls update expireAt --collection-group=notifications --enable-ttl --database=quehaypahacer-db --project=<proyecto>`
   Sin esto los avisos no se borran solos (no estorba: la lista muestra 30).

## Límites conocidos

- Los avisos de equipo (agregar/quitar), baja de evento y "despublicado" dependen de la Cloud Function: hasta desplegarla con su secreto no se generan.
- Quitar a alguien de la red de colaboradores lo saca de los eventos y genera un aviso `team_removed` por cada evento.
- Un evento que el autor cancela (`cancelled`) o borra no avisa a los inscritos.
- Sin tiempo real: un aviso nuevo aparece al recargar, abrir la campanita o volver a la pestaña.
- Cerrar el panel marca todo como leído aunque no se haya abierto cada aviso.
- El panel de reclamos/sugerencias por script avisa solo si se ejecuta con `--apply`.
- Un sitio con `isActive: false` (desactivado por su dueño) no es público aunque esté aprobado; el aviso de aprobación igual se envía.
