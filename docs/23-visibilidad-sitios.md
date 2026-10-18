# 23 · Visibilidad de sitios: ranking, ficha completa y "Cargar más"

## Qué estaba mal
- `analytics.score` de un sitio **nunca se calculaba** con datos reales: solo lo traían los sitios sembrados. "Destacados" exigía `score >= 20`, así que casi siempre salía vacío.
- El índice `/donde-ir` mostraba un tope (4 destacados + hasta 26) y su "Ver más" llevaba a otra página que mostraba lo mismo.

## Ranking (`domain/entities/sites/siteRanking.ts`)
`score = me gusta × 3 + compartidos × 5 + eventos × 4 + 10 si la ficha está completa`.
- El bono por ficha completa (10 ≈ 3 "me gusta") es "un poquito más de visibilidad": empuja a quien cuida su ficha sin taparlo todo.
- "Completa" = las 8 reglas del medidor (`siteCompleteness.ts`). Se guarda como `listingComplete` en el documento al guardar/publicar/editar, y el score se recalcula ahí (`SitesService.recomputeScore`) y al registrar un "me gusta" o un compartido (`recordSiteInteractionAction`). Escribe solo si el valor cambió.
- Sitios ya existentes: `pnpm exec tsx scripts/backfill-site-score.ts [--apply]` (dry-run por defecto). Sobrescribe el score actual (p. ej. los aleatorios de los sembrados). En producción hay que correrlo una vez al salir.
- Los listados se cachean (`site-list`, días): el nuevo orden se ve en ≤1 día, o al instante si se invalida la etiqueta.

## Listados
- **Destacados**: los 8 mejor puntuados, sin umbral (`findFeaturedSiteIds`).
- **Todos los sitios** (`/donde-ir` y la landing "todos"): lista paginada por cursor `score|id` con **"Cargar más" en la misma página** (`InfiniteSiteList` con `category="all"`, `loadMoreSitesAction`). La primera tanda del índice pide 20 para que, tras ocultar los destacados, queden ≥ 12; no se repiten sitios.
- Los tipos (`/donde-ir/<tipo>`) ya paginaban igual; ahora comparten la consulta (`pageByScore`).
- No hay índices nuevos: las consultas usan el mismo orden por score con desempate por id que ya existía.

## Detalle del sitio
El bloque "Próximos eventos aquí" (y el "Itinerario" del modal del dueño) solo se muestra si el sitio tiene eventos.

## Límites
- No hay recencia: un sitio nuevo sin interacciones empata en 0 con los demás (salvo que su ficha esté completa). Si hace falta, una ventana de novedad se puede sumar a `siteScore`.
- El score no distingue visitas (no se miden hoy en sitios): solo "me gusta", compartidos y eventos.
