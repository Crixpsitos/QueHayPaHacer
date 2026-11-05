# Spec: SEO tanda 1 — h1 de la home, datos `Event` en el detalle, landing "Qué hacer hoy"

Origen: auditoría `seo-audit` de producción (2026-11-05) + Search Console: te buscan por "qué hay para hacer hoy", "planes para hoy domingo", "qué hay para hoy". Todo el HTML se verificó con curl/Googlebot en prod.

## Objective
Que Google entienda cada evento (fecha, lugar, precio) y que exista UNA página que responda a "qué hacer hoy". Éxito = (a) home con un `<h1>`, (b) cada `/eventos/<slug>` con JSON-LD `Event` válido, (c) `/eventos-hoy-ibague` indexable, con eventos de hoy en hora de Colombia, en el sitemap.

## Hallazgos que cubre (verificados)
1. Home sin `<h1>` (solo `<h2>`; el título del carrusel "Bienvenido a Que hay pa hacer" es h2).
2. Detalle de evento: JSON-LD solo `WebSite` + `Organization`. El `Event` vive únicamente en `EventCard.tsx:97` (tarjetas de listados).
3. `/eventos-hoy-ibague` y `/que-hacer-hoy-en-ibague` hoy dan `noindex` (no existen). El framework de landings (`presentation/events/lib/eventCollections.ts`, `app/(landings)/[coleccion]/page.tsx`) ya sabe crear colecciones nuevas.

## Assumptions
1. Slug: `eventos-hoy-ibague` (mismo patrón `eventos-{coleccion}-ibague`; ver memoria eventos-routes-seo). Una sola página para hoy; el domingo/sábado se resuelve con el texto del día, no con URLs por día.
2. "Hoy" = día calendario en `America/Bogota` (UTC-5, sin horario de verano), NO el huso del servidor (Cloud Run = UTC; `findWeekendEvents` usa `new Date()` del servidor: no se toca aquí).
3. Evento "de hoy" = su rango [startDate, endDate] cruza el día de hoy; multi-fecha: cuenta si alguna sesión cae hoy si el modelo lo permite sin migrar datos (si no, solo startDate/endDate del evento, como el feed actual).
4. Sin eventos hoy → la página NO queda vacía: muestra "Hoy no hay eventos publicados" + los próximos de la semana. Sigue indexable y con 200.
5. El JSON-LD del detalle reutiliza la lógica de `EventCard` extraída a una función pura compartida (una sola fuente), sin cambiar lo que ya emiten las tarjetas.
6. Sin dependencias nuevas. Rama `develop`.

## Commands
- Test: `pnpm test` · Typecheck: `pnpm typecheck` · Build: `pnpm build`
- Verificación HTML de lo que ve Google (tras build local o develop): `curl -s -A Googlebot <url> | grep -oE 'application/ld\+json|<h1'`
- Validar JSON-LD: Rich Results Test (https://search.google.com/test/rich-results) por el usuario (no se puede desde aquí) + revisar el JSON en HTML.

## Project Structure (archivos probables, ~8)
- `app/(home)/page.tsx` (+ el componente del hero) — `<h1>` visible
- `presentation/events/lib/eventJsonLd.ts` (+ `.test.ts`) — función pura `buildEventJsonLd(event)` extraída de `EventCard.tsx`
- `presentation/events/components/card/EventCard.tsx` — usa la función compartida
- `presentation/events/components/EventDetailContainer.tsx` — emite el `<script type="application/ld+json">`
- `presentation/events/lib/eventCollections.ts` — nuevo `kind: "today"` + entrada base `hoy`
- `presentation/events/data/collectionFetchers.ts`, `application/aggregations/EventFeed/EventFeed.ts`, `EventsService`, repositorio — `getToday()` con límites de día en Bogotá; función pura de límites con test
- `app/(landings)/[coleccion]/page.tsx` — título/H1/intro con el día; manejo del vacío
- `app/sitemap.ts` — la landing entra sola por `getEventCollections()` (verificar)

## Code Style
Funciones puras con test `node:test` junto al archivo (ej. `siteCompleteness.test.ts`); fechas con `Intl`/offset fijo -05:00 en una sola utilidad; sin librerías de fechas nuevas.

## Design / copy (landing hoy)
- `<title>` "Qué hacer hoy en Ibagué: eventos y planes"; H1 "Qué hacer hoy en Ibagué"; subtítulo dinámico "Planes para hoy domingo 8 de noviembre" (día y fecha en español, hora de Bogotá). Las palabras de las búsquedas reales ("hoy", "planes", día de la semana) deben aparecer en H1/subtítulo de forma natural.
- Reusa las tarjetas y el layout de las otras landings; sin diseño nuevo. Tono: tú/usted, nunca voseo.
- Caché corta: la página de "hoy" NO puede usar `cacheLife("days")` como el resto de colecciones (mostraría eventos de ayer). Propuesta: `cacheLife("minutes")` y la clave del día en la función; se invalida con el tag `event-list`.

## Testing Strategy
- Unitarios (RED primero): límites del día en Bogotá (23:30 hora local no salta de día; 00:30 sí), "evento cruza hoy", `buildEventJsonLd` (campos, cancelado, multi-fecha, sin ubicación → sin `location` roto), título/subtítulo con el día.
- Regresión: salida del JSON-LD de `EventCard` igual a la de antes (test de igualdad con un evento de ejemplo).
- Build + curl local contra el build de prod: h1 en home, `Event` en detalle, landing con 200/index y `ld+json` tipo ItemList si ya se usa en las otras landings.
- Rich Results Test lo corre el usuario sobre develop.

## Boundaries
- Always: TDD, un commit por tarea, tests+typecheck+build antes de cada checkpoint, revisión independiente al final.
- Ask first: `git push origin develop` (dispara rollout), merge a `main`/prod, cambiar `findWeekendEvents` (bug de huso del fin de semana), tocar índices de Firestore (la consulta "hoy" debe poder usar los existentes; si pide uno nuevo, paro y aviso: ver memoria firestore-enterprise-search).
- Never: tocar prod sin orden explícita, inventar eventos o datos para llenar la página, poner `noindex` por error, dejar la página "hoy" cacheada por días.

## Success Criteria
1. Home: exactamente un `<h1>` (con "Qué hay pa' hacer" + Ibagué), sin romper el diseño del hero.
2. Todo `/eventos/<slug>` publicado: un `Event` JSON-LD con name, startDate, endDate, eventStatus, location (si hay), image, offers (si hay), organizer; válido en Rich Results Test (usuario).
3. `/eventos-hoy-ibague`: 200, `index, follow`, canonical propio, en `sitemap.xml`, eventos de hoy en hora de Bogotá, vacío con respaldo (próximos), caché corta.
4. `pnpm test`, `pnpm typecheck`, `pnpm build` verdes; curl local confirma 1–3.
5. Ninguna landing existente cambia de URL, título ni canonical.

## Fuera de esta tanda (siguiente, si apruebas)
- Descripciones únicas y más ricas en las 18 landings por categoría (hoy genéricas).
- Datos estructurados `Place`/`TouristAttraction` + `AggregateRating` no (no hay reseñas) en fichas de sitios; `ItemList` y `BreadcrumbList`.
- Verificar por qué el sitemap solo lista 5 eventos (¿solo 5 vigentes o corta `findSitemapEntries`?).
- Bug de huso en "fin de semana" (usa hora del servidor).
- Páginas por día/semana ("planes este sábado") y `ai-seo`; enlazado interno desde la home a "Qué hacer hoy".
- Medir: Search Console (impresiones/posición de las consultas de arriba) a 2 y 4 semanas.

## Open Questions
A. ¿Slug `eventos-hoy-ibague` (recomendado) o prefieres `que-hacer-hoy-en-ibague`? (el segundo rompe el patrón de URLs y exigiría una ruta aparte).
B. Sin eventos hoy: ¿mostrar los próximos de la semana (recomendado) o un mensaje simple?
C. ¿Añado un acceso visible a "Qué hacer hoy" en la home (chip o botón junto a "¿Qué hay pa' hacer hoy?")? Ayuda al enlazado interno; es un cambio visual pequeño.
D. ¿Me compartes qué páginas reciben esas impresiones y su posición promedio en Search Console? Afina el título de la landing.

---
## Decisiones del usuario (2026-11-05 17:25)
A slug `eventos-hoy-ibague` · B vacío → mostrar próximos · C sí, acceso visible a "Qué hacer hoy" en la home · D pendiente (datos de Search Console) · **E: "que se indexen todas mis páginas"**.

## Mapa de indexación (graphify + código; 4.851 nodos de código, 980 archivos)
Rutas públicas hoy: `/`, `/eventos`, `/donde-ir`, `/premium`, `/terminos`, `/privacidad`, 18 landings, 3 fichas de sitio, 5 eventos vigentes (todo en `sitemap.xml`, 44 URLs).
**Públicas que NO están en el sitemap (se agregan):**
1. `/explorar` (indexable, con canonical, fuera del sitemap).
2. `/contactanos` (idem).
3. Páginas de sesión de eventos multi-fecha `/eventos/<id>/sessions/<sessionId>` (sin `generateMetadata`: heredan el título genérico; no hay canonical). Primero se inspecciona qué muestran; si repiten el evento → canonical al evento, si aportan fecha propia → título/descripción propios y al sitemap.
4. Landing nueva `/eventos-hoy-ibague` (entra sola por `getEventCollections()`).
**Decisión tuya (por ser datos de personas / criterio):**
5. Perfiles públicos `/profile/<handle>`: ya son indexables si el usuario eligió "público", pero no están en el sitemap. Recomendado: agregar SOLO los `isPublic`. Si no quieres exponer personas, se dejan como están.
6. Eventos ya terminados: el sitemap solo lista vigentes (`endDate >= now`, por eso hay 5). Recomendado: seguir listando los terminados en los últimos 90 días (conservan búsquedas como "candlelight ibagué") con el estado "finalizado" en el JSON-LD; más allá de 90 días salen del sitemap pero su página sigue indexable.
**Se quedan FUERA a propósito (indexarlas daña):** `/studio/*`, `/mis-eventos`, `/mis-inscripciones`, `/mis-invitaciones`, `/profile` (propio), crear/editar eventos y sitios, `/login`, `/register`, `/offline`, `/api/*`. Son privadas, sin contenido útil o duplicadas; indexarlas diluye el sitio. Si quieres `/login` y `/register` indexables, dilo.
**Redirecciones:** `/sites/<id>` (ruta vieja) ya redirige 307 a `/donde-ir/...`; se cambia a 308 (permanente) para que Google traspase todo a la ruta nueva.
**Higiene del sitemap:** `lastModified: now` en las fijas es ruido (Google lo ignora si no es fiable): se usa la fecha real de cambio donde exista y se omite donde no.
**Éxito extra:** `sitemap.xml` incluye todas las públicas anteriores; ninguna privada; tests del armado del sitemap (función pura que recibe colecciones/fichas y devuelve entradas).
