# 22. Visibilidad de eventos

## Qué cambió

- **Destacados** (`findFeaturedEvents`): primero los promovidos vigentes (`promotion.isPromoted == true` y `promotedUntil >= ahora`, publicados y con `endDate >= ahora`); luego se completa hasta 10 con los próximos mejor puntuados, **sin umbral de score**. Sin duplicados. Son dos consultas simples unidas en memoria (`mergeFeaturedIds`); la vigencia de la promoción se filtra en memoria (el límite de promovidos leídos es 50).
- **Todos los eventos**: `/eventos` y `/eventos-todos-ibague` usan la misma lista (`InfiniteEventList` sin `categoryId`): primera página de 12 cacheada (`use cache`) y botón "Cargar más" que llama a la server action pública `loadMoreAllEventsAction(cursor)` (no recibe uid; el like sale de la sesión). Se quitó el enlace "Ver más" de esa sección en `/eventos`; la landing sigue existiendo por SEO.
- **Este fin de semana**: el tope sube de 20 a 50 eventos (la ventana es de pocos días); se muestran todos en la misma página.

## Orden y cursor

Próximos (`endDate >= ahora`, publicados) por `analytics.score` desc con desempate por id desc. El cursor es `score|id` (`encodeScoreCursor`/`decodeScoreCursor`), así los eventos con el mismo score no se saltan ni se repiten entre páginas.

Nota: los eventos sin `analytics.score` no aparecen en listados ordenados (ver backfill de score).

## Caché

Tags: `event-list` y `all-events` (páginas), `collection-*` (colecciones). Las acciones de crear/editar/aprobar/borrar ya invalidan `event-list`, que cubre todo lo nuevo.

## Índices

No se requieren índices nuevos: se reutiliza el de `status + endDate + analytics.score desc` (el desempate por `__name__` desc va implícito en la misma dirección) y los promovidos usan solo igualdad. Si Firestore pidiera uno en producción, el error trae el enlace de creación.

## Pendiente conocido

`findByCategoryPaginated` usa solo el score como cursor (sin id): con empates puede saltarse eventos. Conviene migrarlo a `score|id`.
