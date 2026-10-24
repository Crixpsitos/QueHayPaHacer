# 27. Sitios y eventos: incentivo para que un sitio tenga agenda

Un sitio con eventos sube en el listado. El ranking ya sumaba `eventCount × 4` (`domain/entities/sites/siteRanking.ts`), pero la app **nunca** actualizaba `analytics.eventCount`: solo lo fijaba a mano `scripts/link-events-to-site.ts`. Ahora se mantiene solo, y el dueño lo ve y recibe un empujón para crear eventos.

## Cómo se cuenta

`analytics.eventCount` = eventos **publicados** vinculados al sitio que son próximos, están en curso o **terminaron hace menos de 90 días**.

- Código: `domain/entities/sites/siteEventCount.ts` (`countSiteEvents`, `EVENT_COUNT_WINDOW_DAYS = 90`).
- Solo cuenta `status === "published"`. Quedan fuera borradores, pendientes de moderación, rechazados, cancelados y terminados.
- Fecha de referencia: `endDate`; si falta, `startDate`; sin ninguna fecha válida se cuenta.
- Vínculo: `location.siteId` (evento único) y `siteIds[]` (multi-fecha, derivado de sus sesiones por `syncEventSiteIds`).
- Fuente de datos: `EventsService.countRecentBySiteId`, que reutiliza `findPublishedBySiteId` (consulta ya indexada) y filtra en memoria. Sin índices nuevos. Tope de 300 eventos por sitio.
- El score se recalcula en la **misma escritura** (`SitesService.setEventCount`): `likes×3 + shares×5 + eventCount×4 + 10 si la ficha está completa`. Solo escribe si cambió el conteo o el score.

## Qué dispara el recálculo

`app/lib/sites/siteEvents.ts` (`linkedSiteIds`, `refreshSiteEventCounts`) y, desde Server Actions, `app/actions/events/lib/refreshSites.ts` (`refreshSitesOfEvent`, que además invalida `site-<id>`, `site-list`, `featured-sites`, `explore` y las listas del autor con `revalidateSite`). Recuenta el sitio **anterior y el nuevo** cuando un evento cambia de sitio.

| Cambio | Dónde engancha |
|---|---|
| Publicar (nuevo o republicar) | `publish-event.action.ts` |
| Editar (cambio de sitio o de estado; un autor sin verificar vuelve a moderación al editar un publicado) | `update-event.action.ts` |
| Eliminar | `delete-event.action.ts` (ids leídos antes de borrar) |
| Convertir entre estándar y multi-fecha | `migrate-event-type.action.ts` |
| Crear, mover, cancelar o borrar sesiones (multi-fecha) | `lib/syncEventSiteIds.ts` (usa los `siteIds` anteriores que ahora devuelve `EventsService.syncSiteIds`) |
| Aprobar o rechazar por moderación | `app/api/events/moderation/route.ts` (usa `revalidateTag(..., { expire: 0 })`) |
| Baja a mano en Firestore | `app/api/events/revalidate/route.ts`, que ya llama la Cloud Function `notifyEventChanges` |

El recálculo **nunca lanza**: un fallo se registra en el log y no rompe el guardado del evento.

## Lo que ve el visitante y el dueño

- **Etiqueta "Con eventos"** (`presentation/sites/components/SiteEventsBadge.tsx`): en la tarjeta del listado (cuando `eventCount > 0`), en la ficha pública (cuando hay al menos un evento próximo en "Próximos eventos aquí") y en el detalle de Mis sitios. Es un componente sin estado ni sesión, así que no rompe el HTML cacheable (`publicPagesNoSession.test.ts` sigue pasando).
- **Botón "Crear evento aquí"** (`presentation/sites/components/CreateEventHere.tsx`) en cada sitio **aprobado** de Mis sitios: enlace pequeño en la tarjeta y bloque con la razón en el detalle ("Los sitios con eventos suben en el listado y se ven más").
- **Sitio ya elegido en el asistente:** el enlace es `/eventos/create?siteId=<id>`. `Step4Location` lee el parámetro y `SitePickerWidget` lo aplica **una vez**, solo si aún no hay sitio elegido y el id es uno de los sitios **publicados y aprobados del propio usuario** (la lista ya viene filtrada por autor, así que no se puede forzar el sitio de otra persona).
- **Aviso al autor del sitio:** cuando se publica un evento de **otra persona** en su sitio, le llega a la campanita el aviso `event_at_site` ("Se publicó un evento en tu sitio X", con el título del evento y enlace). Se envía cuando el evento queda público: al publicar un autor verificado (`publish-event`) o al aprobar un evento de moderación previa (webhook). Id idempotente `event_at_site_<evento>_<sitio>`: editar o republicar no vuelve a avisar. No se avisa si el autor del sitio es el mismo del evento.

## Relleno inicial

`scripts/backfill-site-event-count.ts` (dry-run por defecto, `--apply` escribe). Recuenta todos los sitios y reemplaza el `eventCount` sembrado a mano. En develop el dry-run cambiaría 44 de 55 sitios, porque los datos de prueba traían contadores inventados.

## Límites conocidos

- **El conteo no decae solo.** Un evento sale del conteo 90 días después de terminar, pero nada recalcula en ese momento: se corrige en el próximo cambio de un evento del sitio o al correr el backfill. Si importa, se puede programar el backfill una vez por semana.
- **Cambios fuera de la app** (edición directa en Firestore) solo se reflejan si pasan por el webhook `/api/events/revalidate` (la baja a mano ya lo hace) o con el backfill. Si el documento del evento se borra por completo, el webhook no sabe qué sitios tenía.
- **Cancelar o borrar un evento** desde la app solo se cubre en el borrado; no existe un cancelar a nivel de evento.
- La etiqueta de la tarjeta usa `eventCount` (próximos **o** recientes de hasta 90 días); la de la ficha usa los próximos. Pueden no coincidir.
- Los avisos del webhook de moderación se envían tras guardar la decisión; si fallan no se revierte nada.
- El recálculo se hace con lecturas a Firestore por sitio afectado (una consulta doble por evento publicado); es barato pero no gratis.

## Pruebas

`domain/entities/sites/siteEventCount.test.ts` (ventana de 90 días, estados válidos, fechas), `app/lib/sites/siteEventsCore.test.ts` (cambio de sitio recuenta el anterior y el nuevo, ids repetidos, aislamiento de fallos, aviso y tipo `event_at_site`), `application/services/sites/SitesService.score.test.ts` (`setEventCount`) y `application/services/events/siteEventCount.test.ts`.

Verificado en develop con un evento y un sitio de QA: aprobar por el webhook de moderación subió `eventCount` de 0 a 1 y el score de 8 a 12 y generó el aviso; una baja manual más el webhook de revalidación lo devolvió a 0 y 8. Los datos de QA se restauraron.
