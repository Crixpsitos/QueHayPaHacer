# 29 · Google Analytics (visitas y redes sociales)

Para qué sirve: **tomar decisiones de producto**. Solo lo ve el dueño, en la consola de Google Analytics (GA4). No se muestra dentro de la app: los contadores de la app (vistas de eventos, "Visitas" de sitios, el estudio) siguen siendo independientes y no cambian.

Spec: `SPEC-social-visits.md` · Plan: `tasks/plan-analytics.md`.

## Qué mide

- **Cada visita a una página pública**, con o sin sesión, y de dónde llegó (Facebook, Instagram, TikTok, WhatsApp, búsqueda de Google, directo…).
- **Con o sin sesión** en cada visita (`login_state` = `anon` | `logged_in`). Nunca el usuario, el correo ni el nombre.
- **Acciones**:

| Evento | Cuándo sale | Datos que lleva |
|---|---|---|
| `page_view` | Cada cambio de página pública | ruta y UTM (nunca `redirect_to`, tokens ni `#`) |
| `view_item` | Se abre la ficha de un evento o un sitio | `item_type`, `item_id`, `item_category` (eventos) |
| `click_whatsapp` | Clic en un enlace de WhatsApp de un sitio | `item_id`, `destination` |
| `click_como_llegar` | Clic en "Cómo llegar" / transporte | `item_id`, `destination` |
| `click_out` | Clic en web, redes, reserva o llamada (no WhatsApp) | `item_id`, `destination` |
| `share` | Compartir (WhatsApp, X, Facebook, copiar, nativo) | `item_id`, `method` |
| `like` | Dar me gusta a un evento (no al quitarlo) | `item_id` |
| `register_event` | Inscripción nueva a un evento | `item_id` |
| `search` | Buscar en el explorador | solo `method` (`text` o `filters`). **El texto buscado no se envía.** |

- **No mide** el estudio, tus eventos/inscripciones/invitaciones, tu perfil privado, el editor ni la API.

## Hacer una sola vez en la consola de GA4

1. **Etiqueta con/sin sesión.** Admin → *Definiciones personalizadas* → *Crear dimensión personalizada*: nombre «Estado de sesión», ámbito **Usuario**, propiedad de usuario `login_state`. Desde ahí se puede segmentar cualquier informe por con/sin sesión.
2. **Datos de las acciones** (para filtrar por ficha, categoría o método): crear dimensiones de ámbito **Evento** para `item_type`, `item_id`, `item_category`, `method` y `destination`.
3. Comprobar el flujo en **Informes → Tiempo real** (después de abrir la página).

> Las dimensiones personalizadas solo cuentan desde que se crean; no recuperan el pasado.

## Dónde mirar para decidir

- **Adquisición → Adquisición de tráfico**, dimensión *Fuente/medio de la sesión*: cuánto trae cada red y cada anuncio.
- **Participación → Eventos**: cuántas acciones hay (`click_whatsapp`, `click_como_llegar`, `share`…).
- **Participación → Páginas y pantallas**: qué fichas se ven más.
- Compara **con sesión vs sin sesión** con la dimensión «Estado de sesión».
- La métrica que importa es la **acción** (WhatsApp, cómo llegar), no solo la visita (ver docs/28).

## Enlaces con etiqueta (UTM) por red

Para que Analytics sepa de qué anuncio viene cada visita, el enlace que compartes debe llevar etiquetas. Plantilla:

```
https://yquehaypahacer.com/donde-ir/<sitio>?utm_source=<red>&utm_medium=<tipo>&utm_campaign=<nombre>
```

| Dónde lo pones | `utm_source` | `utm_medium` |
|---|---|---|
| Biografía de Instagram | `instagram` | `bio` |
| Publicación de Facebook (orgánica) | `facebook` | `social` |
| Anuncio de Facebook/Instagram | `facebook` | `cpc` |
| TikTok | `tiktok` | `bio` o `social` |
| Estado/mensaje de WhatsApp | `whatsapp` | `social` |
| QR impreso | `qr` | nombre del lugar |

`utm_campaign` es libre y en minúsculas, sin espacios (ej. `bienvenida-nov`). Los navegadores internos de Facebook/Instagram a veces ocultan de dónde vienes: **por eso conviene siempre la etiqueta**, no confiar en el referente.

## Límites (para no sacar conclusiones de más)

- Solo cuenta bien a quien **acepta** el aviso de cookies. Si rechaza, Google recibe un conteo básico sin cookies; Analytics lo estima.
- Los **bloqueadores de anuncios** impiden que parte de las visitas se midan. GA4 subestima.
- Tus propias visitas se cuentan (no hay filtro de tráfico interno, decisión del dueño).
- Develop y producción usan **propiedades distintas** (`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`): los datos de prueba no se mezclan con los reales.

## Para desarrollo

- Código: `app/lib/analytics/` (`events.ts` reglas puras, `client.ts` cliente, `consent.ts`/`useConsent.ts` consentimiento, `index.ts` instancia), `app/components/analytics/` (`AnalyticsProvider`, `ConsentBanner`, `CookiePreferencesButton`, `ViewItem`) y los enganches en `SiteTracker`, `EventDetailActions`, `EventCardInteractive`, `FeaturedEventCard`, `EventSections`, `EventDetailClient`, `ExploreSearchBar`.
- Sin `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, el SDK de Analytics ni se carga.
- El consentimiento por defecto es `denied` y se fija **antes** de iniciar el SDK; la decisión se guarda en `localStorage` (`qhpa-analytics-consent`).
- Aun con consentimiento denegado, el SDK de Firebase guarda en el navegador un identificador técnico de instalación (IndexedDB `firebase-installations-database`); está declarado en la política de privacidad.
- Para añadir un evento: agregar el nombre en `AnalyticsEventName`, los parámetros nuevos a la lista permitida de `sanitizeParams` (con su prueba) y llamar a `analytics.track(...)` solo tras la acción confirmada. **Nunca** enviar uid, correo, nombre ni texto libre del usuario.
- Probar sin Google: el SDK deja cada comando en `window.dataLayer` (consola del navegador).
- Los contadores propios que escriben en Firestore (`/api/sites/[id]/track`, `/api/campaigns/track`) tienen guardia común en `app/api/_lib/beaconGuard.ts` (mismo origen, JSON ≤ 1 KB, tope total por minuto) y la ficha de un sitio cuenta una sola vista por navegador y día.
