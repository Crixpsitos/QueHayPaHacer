# 26. Medición de sitios

Antes nada incrementaba `analytics.views` ni `analytics.clicks` de un sitio (solo los sembraban los scripts). Ahora la ficha pública mide vistas y clics. Los "me gusta" y compartidos ya se contaban.

## Qué se mide

| Qué | Dónde se cuenta | Cuándo |
|---|---|---|
| **Vista** | `analytics.views` y `stats/{día}.views` | Una por sitio y sesión del navegador (sessionStorage), con la pestaña activa. Si la ficha se abre en segundo plano, cuenta al verla |
| **Clic** | `analytics.clicks` y `stats/{día}.clicks`, más el contador del tipo | Clic en un elemento con `data-site-track="<tipo>"` |
| Me gusta | `analytics.likes` y `stats/{día}.likes` (neto: suma y resta) | `registerLike` |
| Compartido | `analytics.shares` y `stats/{día}.shares` | `registerShare` (la barra de compartir ya llama la acción) |

Tipos de `data-site-track`, y qué elemento lleva cada uno hoy:
- `directions`: "Ver en Google Maps" y "Abrir ruta en Google Maps".
- `transit`: botón "Usar mi ubicación" de "¿Cómo llego?" (la persona pide distancia y buses).
- `website` y `social`: enlaces de "Sitio web" y de redes (Instagram, Facebook, TikTok, X).
- `booking`: botón de reserva o "Reservar por WhatsApp".
- `call` y `share`: el endpoint los acepta, pero **ningún elemento los usa todavía**: no hay campo de teléfono, y los compartidos ya cuentan por su acción (`shares`). Ponerlos duplicaría.

## Datos

- `sites/{id}.analytics.views` y `analytics.clicks`: totales. Se suman con `FieldValue.increment`.
- `sites/{id}/stats/{YYYY-MM-DD}` (día de Bogotá, `bogotaDay()` en `domain/entities/sites/siteStats.ts`): `{ day, views, clicks, directions, website, social, booking, call, share, transit, likes, shares }`. Cada campo existe solo si ocurrió ese día.
- No se toca `updatedAt` (el sitemap lo usa como `lastmod`) ni `analytics.score`: las visitas no suman al ranking porque son fáciles de inflar.

## Cómo funciona

- `POST /api/sites/[id]/track` con `{ "type": "view" | "directions" | ... }` (valibot, `application/dto/sites/SiteTrackDto.ts`). 204 si todo bien (también si el sitio no existe), 400 si el id o el tipo son inválidos, 429 si una IP pasa de 60 eventos por minuto.
- Capas: `SitesService.recordTrack` → `SitesAdapter` → `SitesFirebaseRepository.recordTrack`. Usa `update()`, no `set()`: un id inventado falla con NOT_FOUND y no crea nada (mismo patrón que `recordStats` de campañas).
- Cliente: `SiteTracker` (`presentation/sites/components/detail/`) envuelve la ficha; envía con `navigator.sendBeacon` (respaldo `fetch` con `keepalive`) desde `app/lib/siteTrack.ts`.
- La ficha va en el CDN y es igual para todos: la cuenta sale **solo del navegador**, nada por usuario en el HTML.
- Los clics se escuchan en el contenedor del tracker, no en `document`: con Cache Components Next deja fichas anteriores montadas y ocultas, y un listener global contaría el clic para el sitio equivocado.

## Límites conocidos

- **Se puede inflar:** el endpoint es público. El tope es 60 por IP y minuto, en memoria de cada instancia (con varias instancias de Cloud Run el tope real es mayor). Por eso las visitas no entran al ranking.
- **Bots y rastreadores** que ejecutan JavaScript cuentan como vista. No se filtran (App Hosting reemplaza el User-Agent de todos por "Google", así que no se puede distinguir por UA).
- **Los clics no se deduplican:** cada clic suma.
- **No distingue sitios públicos de borradores:** hacerlo costaría una lectura por evento. Un POST directo a un borrador inflaría su contador.
- **Una vista por sesión:** cerrar la pestaña y volver cuenta otra; no son "visitantes únicos".
- **La ficha en caché** muestra "N vistas" con el valor del último refresco (el detalle se cachea por horas); los totales en Mis sitios se leen sin esa caché.
