# 27. Sitios y eventos: incentivo para que un sitio tenga agenda

Un sitio con eventos sube en el listado. El ranking ya sumaba `eventCount × 4` (`domain/entities/sites/siteRanking.ts`), pero la app **nunca** actualizaba `analytics.eventCount`: solo lo fijaba a mano `scripts/link-events-to-site.ts`. Ahora se mantiene solo, tiene un vencimiento conocido, el puntaje tiene tope, y el dueño lo ve y recibe un empujón para crear eventos.

## Cómo se cuenta

`analytics.eventCount` = eventos **publicados** vinculados al sitio que son **próximos, están en curso o terminaron hace menos de 7 días** (`SITE_EVENT_TAIL_DAYS = 7`).

- Código: `domain/entities/sites/siteEventCount.ts` (`siteEventState`, `countSiteEvents`, `isEventCountExpired`).
- Un evento cuenta mientras `fin + 7 días > ahora`. En el instante exacto `fin + 7 días` ya no cuenta.
- Solo cuenta `status === "published"`. Quedan fuera borradores, pendientes de moderación, rechazados, cancelados y terminados.
- Fecha de referencia (`fin`): `endDate`; si falta, `startDate`; sin ninguna fecha válida se cuenta y no aporta vencimiento.
- Vínculo: `location.siteId` (evento único) y `siteIds[]` (multi-fecha, derivado de sus sesiones por `syncEventSiteIds`).
- Fuente de datos: `EventsService.siteEventStateBySiteId`, que reutiliza `findPublishedBySiteId` (consulta ya indexada) y filtra en memoria. Sin índices nuevos. Tope de 300 eventos por sitio.

### Vencimiento (`analytics.eventCountValidUntil`)

Con el tiempo el conteo solo **baja** (un evento termina y sale de la ventana) y se sabe exactamente cuándo. `siteEventState` devuelve `{ count, validUntil }`, donde `validUntil` es el **primer** `fin + 7 días` entre los eventos contados (o `null` si no hay ninguno con fecha: no vence solo hasta que cambie algo). Se guarda como `Timestamp` junto al conteo en la misma escritura (`SitesService.setEventCount`). Los sitios antiguos sin el campo se leen como "no vence".

Esto permite recalcular el conteo **solo cuando venció** (`isEventCountExpired`: `validUntil <= ahora`) en vez de recalcular todo: lo hace el barrido horario (ver "Barrido de conteos vencidos").

### Puntaje con tope

`siteScore` = `likes×3 + shares×5 + min(eventCount, 5)×4 + 10 si la ficha está completa`. El tope (`SITE_SCORE_MAX_EVENTS = 5`, máx. 20 puntos) evita que publicar muchos eventos escale el ranking. `analytics.eventCount` guarda el conteo **real**; el tope solo se aplica al puntaje. Se escribe en la **misma escritura**: solo si cambió el conteo, el puntaje o el vencimiento.

## Solo se vinculan sitios propios de verdad

Un evento (o sesión) solo puede vincularse a un sitio que cumple **todo** esto (`domain/entities/sites/siteLink.ts`):

- lo creó el **dueño del evento** (`author.id`),
- lo publicó como **dueño** (`publishedAs === "owner"`; quedan fuera `proposer` —lo propuso la comunidad— y `qhpa`) y su `verification` no es `community`,
- está **publicado y aprobado**.

Un documento antiguo sin `publishedAs` se lee como `proposer` (igual que el mapper), así que **no** es vinculable. En develop 54 de 55 sitios no tienen esos campos: solo los sitios publicados con la declaración nueva pueden vincularse.

Dónde se aplica:

- **Selector del wizard** (`getUserSitesForPickerAction`): filtra con `isLinkableSite`. Es también lo que usa `?siteId=` (`SitePickerWidget` solo preselecciona sitios de esa lista).
- **Servidor** (el cliente puede mandar cualquier `location.siteId`): `app/actions/events/lib/siteLink.ts` (`siteLinkError`) en `create-draft-event`, `update-event` y `publish-event` (contra el dueño del evento, no contra el editor), y `sessionSiteLinkError` en `create-event-session`, `update-event-session` y `save-draft-session` (contra el dueño del evento padre). Test estático `siteLinkGuard.test.ts` falla si alguna deja de llamarlo.
- **Solo vínculos nuevos o cambiados:** un evento ya vinculado a un sitio no elegible se respeta hasta que alguien edite el vínculo. Quitar el vínculo siempre se puede. `migrate-event-type` no valida porque solo copia un vínculo ya guardado.
- **Botón "Crear evento aquí"** (Mis sitios): solo aparece en sitios vinculables (`isLinkableSite`), para no mostrar un botón que luego se rechazaría.

Error que ve la persona: "Solo puedes vincular tu evento a un sitio tuyo, publicado como dueño y ya aprobado."

## Qué dispara el recálculo (al escribir)

`app/lib/sites/siteEvents.ts` (`linkedSiteIds`, `refreshSiteEventCounts`) y, desde Server Actions, `app/actions/events/lib/refreshSites.ts` (`refreshSitesOfEvent`, que además invalida `site-<id>`, `site-list`, `featured-sites`, `explore` y las listas del autor con `revalidateSite`). Recuenta el sitio **anterior y el nuevo** cuando un evento cambia de sitio.

| Cambio | Dónde engancha |
|---|---|
| Publicar (nuevo o republicar) | `publish-event.action.ts` |
| Editar (cambio de sitio o de estado; un autor sin verificar vuelve a moderación al editar un publicado) | `update-event.action.ts` |
| Eliminar | `delete-event.action.ts` (ids leídos antes de borrar) |
| Convertir entre estándar y multi-fecha | `migrate-event-type.action.ts` |
| Crear, mover, cancelar o borrar sesiones (multi-fecha) | `lib/syncEventSiteIds.ts` (usa los `siteIds` anteriores que devuelve `EventsService.syncSiteIds`) |
| Aprobar o rechazar por moderación | `app/api/events/moderation/route.ts` (usa `revalidateTag(..., { expire: 0 })`) |
| Baja a mano en Firestore | `app/api/events/revalidate/route.ts`, que ya llama la Cloud Function `notifyEventChanges` |

El recálculo **nunca lanza**: un fallo se registra en el log y no rompe el guardado del evento.

## Lo que ve el visitante y el dueño

- **Etiqueta "Con eventos"** (`presentation/sites/components/SiteEventsBadge.tsx`): en la tarjeta del listado (cuando `eventCount > 0`), en la ficha pública (cuando hay al menos un evento próximo) y en el detalle de Mis sitios. Es un componente sin estado ni sesión, así que no rompe el HTML cacheable (`publicPagesNoSession.test.ts` sigue pasando).
- **Botón "Crear evento aquí"** (`CreateEventHere.tsx`) en cada sitio **aprobado y vinculable** de Mis sitios: enlace pequeño en la tarjeta y bloque con la razón en el detalle ("Los sitios con eventos suben en el listado y se ven más: cuentan hasta 5 eventos próximos o recientes.").
- **Empujón en el asistente de eventos** (solo si la persona tiene sitios vinculables):
  - Paso de ubicación, bajo "Usar mis sitios creados": "Si vinculas este evento a tu sitio, tu página sube en el listado y se ve con agenda."
  - Paso de revisión (evento único sin sitio vinculado), `SiteLinkNudge`: "¿Sabías que los eventos vinculados a tu sitio te ayudan a promocionarlo? Vincúlalo en el paso de ubicación." con un botón que vuelve a ese paso.
- **Sitio ya elegido en el asistente:** `/eventos/create?siteId=<id>`. `Step4Location` lee el parámetro y `SitePickerWidget` lo aplica **una vez**, solo si aún no hay sitio elegido y el id está en la lista filtrada del usuario.
- **Aviso al autor del sitio** (`event_at_site`): cuando se publica un evento de **otra persona** en su sitio. Con la regla de sitio propio, esto solo puede pasar de forma excepcional (p. ej. contenido anterior a la regla, o un sitio que cambió de autor); es inofensivo y queda como red de seguridad. Id idempotente `event_at_site_<evento>_<sitio>`.

## Relleno inicial

`scripts/backfill-site-event-count.ts` (dry-run por defecto, `--apply` escribe): recuenta todos los sitios con la definición nueva, escribe `eventCountValidUntil` en **todos** (con conteo 0 va `null`) y reemplaza el `eventCount` sembrado a mano. Informa además cuántos sitios no tienen el campo hoy. En develop el dry-run dice: **55 de 55 sitios sin el campo** y **55 de 55 cambiarían** (43 por conteo o puntaje y 12 solo por recibir el campo). **No se ha aplicado.**

## Barrido de conteos vencidos (diseño definitivo)

Al escribir (publicar, editar, borrar…) el conteo se recalcula al instante. Lo que no dispara ninguna escritura es el **paso del tiempo**: un evento sale del conteo 7 días después de terminar. Para eso cada sitio guarda `eventCountValidUntil` y un barrido horario recalcula **solo los vencidos**. Los puntajes con el tiempo solo bajan, así que un sitio vencido queda demasiado alto (nunca bajo) y el barrido lo corrige en menos de una hora. (Se descartó revalidar al leer en los `fetch` cacheados: `revalidateTag` no puede llamarse dentro de `use cache` ni durante el render, solo en Server Actions y Route Handlers.)

### Endpoint: `POST /api/sites/recompute-expired`

`app/api/sites/recompute-expired/route.ts`. Solo POST (GET da 405). Auth: `Authorization: Bearer <SITE_REVALIDATE_WEBHOOK_SECRET>` (503 si el secreto no está configurado, 401 si no coincide; mismo patrón que `/api/sites/revalidate`).

- Busca sitios con `analytics.eventCountValidUntil <= ahora`, el más atrasado primero, de a 100 por vuelta, y repite vueltas hasta que no queden o se agote un presupuesto de ~45 s. Un sitio que falla no se reintenta en esa ejecución (se pide de más para pasar de largo) y queda contado como pendiente.
- Cada sitio se recalcula con lo que ya existía (`EventsService.siteEventStateBySiteId` + `SitesService.setEventCount`: conteo, puntaje y nuevo `validUntil`), cada uno en su `try/catch`: un fallo no frena a los demás.
- Al final invalida la caché con `revalidateTag(tag, { expire: 0 })` solo de los sitios cuyo **conteo o puntaje** cambió (si solo se movió el vencimiento no hace falta). La lista de tags es **una sola** (`app/api/sites/_lib/siteTags.ts`: `site-<id>`, `site-list`, `featured-sites`, `explore`, y por autor `sites-<uid>` y `profile-sites-<uid>`) y la comparten `/api/sites/revalidate`, los webhooks de eventos y este barrido. `site-list` ya cubre `site-collection-*` y `site-type-*`, que se etiquetan junto con él.
- Respuesta: `{ processed, changed, failed, remaining, oldestOverdueMs }`.
- **Idempotente:** tras recalcular, el sitio queda con vencimiento futuro (o `null`), sale del conjunto de vencidos y una segunda ejecución da `processed: 0`.
- Lógica pura y probada en `app/api/sites/_lib/recomputeExpired.ts`.
- Sin índices nuevos: la consulta de rango sobre un solo campo usa el índice automático. ponytail: si la colección creciera mucho, conviene un índice de campo único en `sites.analytics.eventCountValidUntil`.

### Función programada (repo `functions`): `recomputeSiteEvents`

`functions/src/modules/sites/triggers/schedule.recomputeSiteEvents.ts`, exportada en `index.ts`. `onSchedule` cada 60 minutos (`America/Bogota`), `timeoutSeconds: 180`, `retryCount: 2`, `maxInstances: 1`, con el secreto `SITE_REVALIDATE_WEBHOOK_SECRET` y `REVALIDATE_APP_URL` (el mismo par que usan los avisos). Hace `POST ${REVALIDATE_APP_URL}/api/sites/recompute-expired`, registra el resultado y usa `logger.error` si la app no responde 2xx (además lanza para que Scheduler reintente) o si `oldestOverdueMs` supera 6 h (para poder crear una alerta de logs).

**Despliegue (SOLO producción, y solo después de que el endpoint exista en el rollout de producción):**

```
cd QueHayPaHacerPruebas
firebase deploy --only functions:recomputeSiteEvents --project quehaypahacer-prod
```

Disparo a mano (nombre del job creado por Firebase):

```
gcloud scheduler jobs run firebase-schedule-recomputeSiteEvents-us-central1 --location=us-central1 --project=quehaypahacer-prod
```

Antes de depender del barrido, correr **una vez** el relleno (`scripts/backfill-site-event-count.ts --apply`): escribe `eventCountValidUntil` en todos los sitios, también con conteo 0 (`null`). El barrido solo ve sitios que tienen el campo con una fecha.

## Auditoría de huecos: ¿cada camino recuenta?

Un test estático (`app/actions/events/lib/siteCountAudit.test.ts`) falla si alguno de los caminos marcados "sí" deja de recontar.

| Camino | ¿Recuenta? | Cómo |
|---|---|---|
| Publicar (nuevo o republicar) | Sí | `publish-event.action.ts` → `refreshSitesOfEvent` con los sitios de antes y de después. Si falla el registro de evidencia y se borra el evento recién creado, nunca llegó a contar |
| Editar: fechas, sitio vinculado, estado | Sí | `update-event.action.ts` (sitios de antes y de después; un autor sin verificar vuelve a moderación al editar un publicado) |
| Eliminar evento | Sí | `delete-event.action.ts` (ids leídos antes de borrar las sesiones y el evento) |
| Convertir estándar ↔ multi-fecha | Sí | `migrate-event-type.action.ts` (sitios del evento viejo, tras borrarlo; el nuevo nace en borrador y no cuenta hasta publicarse) |
| Crear, editar o borrar sesión; guardar borrador de sesión | Sí | `afterSessionChange` → `syncEventDateRange` y luego `syncEventSiteIds` → `refreshSitesOfEvent` (con los `siteIds` anteriores) |
| Cambiar el estado de una sesión (publicar, cancelar…) | Sí | `set-session-status.action.ts` → `afterSessionChange`; las sesiones canceladas no cuentan para `siteIds` |
| Moderación: aprobar o rechazar | Sí | `/api/events/moderation` → `refreshSiteEventCounts` + invalidación |
| Baja o cambio de visibilidad hecho a mano en Firestore | Sí | Cloud Function `notifyEventChanges` → `/api/events/revalidate` → `refreshSiteEventCounts` (solo si cambió la visibilidad del evento) |
| Borrado de cuenta | No hace falta | `deleteAccountAction` borra el perfil `users/{uid}` y el usuario de Auth, **no** sus eventos ni sus sitios: siguen publicados y los conteos no cambian (el contenido queda huérfano; es otro tema) |
| Cancelar un evento desde Studio o como colaborador | No hace falta | No existe un "cancelar evento". Studio solo toca colaboradores, inscripciones, check-in y soporte (el test estático verifica que no tocan estado, fechas ni sitio). Un editor que cambia el evento pasa por `update-event` |
| Cloud Function `cascadeDeleteEventInteractions` | No hace falta | Solo borra interacciones del evento borrado; el recuento ya lo hizo la acción de borrar |
| Cloud Function `recalculateScoreAnalitycs` | No hace falta | Puntaje del **evento**, no del sitio |
| **Borrar un evento a mano en Firestore** | **No (hueco)** | `notifyEventChanges` ignora borrados (`!before \|\| !after`) y no se puede arreglar sin tocar `functions`. El conteo queda alto hasta el próximo vencimiento de un evento contado (si el borrado era el único, hasta su fin + 7 días); lo corrige el barrido horario en ese momento. Inmediato: correr el relleno o cualquier cambio de otro evento del sitio |
| **Editar a mano fechas o `location.siteId` en Firestore** | **No (hueco)** | No cambia la visibilidad, así que no dispara el webhook. Fechas: el barrido lo corrige al vencimiento. Sitio vinculado: el viejo queda alto y el nuevo bajo hasta que algo los recuente. Inmediato: el relleno |
| Scripts (`reschedule-events`, `cleanup-test-events`, `link-events-to-site`, seeds) | No (fuera de la app) | Correr `backfill-site-event-count.ts` después |
| Sitio nuevo | Sí | Nace con `analytics.eventCountValidUntil: null` (`buildSiteInput` y el mapper) |
| Sitios antiguos sin el campo | Sí, con el relleno | El barrido no los ve; el relleno lo escribe en **todos** (con conteo 0 va `null`), y cualquier recuento lo escribe aunque nada más cambie (`setEventCount`) |
| Sitios despublicados, inactivos o rechazados | Sí | La consulta del barrido no filtra por estado: se recalculan igual |
| Sitio sin eventos contados | Sí | `setEventCount` guarda `validUntil: null` (no vence solo hasta que cambie algo) |

Los dos huecos manuales son los únicos sin cerrar. Se podrían cerrar con un barrido completo diario de los sitios con `eventCount > 0` (consulta de rango sobre otro campo, barata a esta escala); no se hizo porque el diseño acordado es solo de vencidos.

## Eventos: por qué NO se recalcula por día todavía

El puntaje de **eventos** (`analytics.score`, fórmula `calculateTrendingScore`) vive **solo en el repo `functions`** (Cloud Function `recalculateScoreAnalitycs`, trigger `onDocumentWritten` sobre `events/{id}`). No es una tarea programada: solo se dispara cuando cambia un campo de `SCORE_RELEVANT_FIELDS` (vistas, likes, shares, inscripciones, promoción, fechas).

Su fórmula sí depende del tiempo: `urgencyFactor = max(1, 2 − díasHastaElEvento/30)` (sube hasta ×2 en los últimos 30 días) y `decayFactor = 0.85^(díasDesdePublicado/7)` (≈ −2,3 % por día), y devuelve 0 si el evento ya pasó. Entre disparos el valor guardado deriva ~2–3 % por día. En la práctica se compensa porque cada vista incrementa `analytics.views` (campo relevante) y recalcula, así que los eventos populares se refrescan solos; los que nadie ve se quedan con el puntaje viejo, pero también se ven poco.

Si algún día se quisiera recalcular por día: la app no tiene la fórmula, así que la forma segura de no duplicarla es que la app **"toque" un campo** (p. ej. `analytics.scoreRefreshAt`, añadido a `SCORE_RELEVANT_FIELDS`) cuando el puntaje esté viejo, y la función recalcule y escriba `scoreComputedAt`. Requiere cambio y despliegue en el repo `functions` (develop y prod). No se hizo.

## Límites conocidos

- **El conteo puede ir hasta ~1 h por encima** de lo real tras vencer un evento (frecuencia del barrido), y más si el barrido no corre: la función vigila `oldestOverdueMs` (alerta a las 6 h).
- **Cambios fuera de la app** (edición directa en Firestore): ver los dos huecos manuales de la tabla de auditoría.
- **Cancelar o borrar un evento** desde la app solo se cubre en el borrado; no existe un cancelar a nivel de evento.
- La etiqueta de la tarjeta usa `eventCount` (próximos **o** de la última semana); la de la ficha usa los próximos. Pueden no coincidir.
- La regla de sitio propio deja fuera los sitios antiguos sin `publishedAs`; un dueño real los puede reclamar (flujo de reclamos) para poder vincular eventos.
- Los avisos del webhook de moderación se envían tras guardar la decisión; si fallan no se revierte nada.
- El recálculo hace lecturas a Firestore por sitio afectado (una consulta por evento cambiado); es barato pero no gratis.

## Pruebas

`domain/entities/sites/siteEventCount.test.ts` (ventana de 7 días y borde, `validUntil`, coherencia), `siteRanking.test.ts` (tope de 5), `siteLink.test.ts` (elegibilidad y `siteLinkViolation`), `app/actions/events/lib/siteLinkGuard.test.ts` (las 6 acciones validan el vínculo), `app/actions/events/lib/siteCountAudit.test.ts` (todos los caminos de la auditoría recuentan; sitios nuevos nacen con `null`), `app/api/sites/_lib/recomputeExpired.test.ts` (selección y orden de vencidos, forma de la respuesta, idempotencia, fallos aislados, presupuesto de tiempo, lotes), `app/api/sites/_lib/siteTags.test.ts` (lista de tags compartida), `app/lib/sites/siteEventsCore.test.ts`, `application/services/sites/SitesService.score.test.ts` (`setEventCount` con vencimiento, tope, campo ausente, `visible`, `getLinkSnapshot`, consultas de vencidos) y `application/services/events/siteEventCount.test.ts`.

Verificado en develop (servidor de desarrollo con el secreto local de QA):

- `POST /api/sites/recompute-expired`: GET → 405; sin credenciales o con credencial equivocada → 401; sin secreto configurado → 503; con credencial → 200 con `{ processed, changed, failed, remaining, oldestOverdueMs }`.
- Un sitio QA con `eventCountValidUntil` vencido hace 2 h, conteo viejo 3 / puntaje 20 y dos eventos temporales (uno que terminó hace 10 días y otro que termina en 5): tras el POST quedó con `eventCount 1`, `score 12` y `eventCountValidUntil` = fin del evento futuro + 7 días. Un sitio de control con vencimiento futuro y un conteo "equivocado" (9) no se tocó. La segunda llamada dio `processed: 0`. Los datos de QA y los eventos temporales se restauraron.
- Antes, `setEventCount(7 eventos, vence en 3 días)` sobre el sitio QA escribió `eventCount 7`, `score 28` (tope: 5 eventos = 20 puntos) y el vencimiento como fecha; repetirlo no escribió. La regla de vínculo se probó contra datos reales: el sitio propio del usuario QA es vinculable; uno ajeno y uno antiguo sin `publishedAs` no.
