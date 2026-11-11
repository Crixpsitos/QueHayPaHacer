# Actividades — modelo, estados, permisos y scripts (F1)

Spec: `SPEC-actividades.md` · plan: `tasks/plan-actividades.md` · tareas: `tasks/todo-actividades.md`.

## Qué es
Una actividad es algo que se **hace** (recurrente o permanente), **global** o **de un sitio propio**. Rutas: hub `/actividades`, ficha `/actividades/[slug]`, gestión `/actividades/{crear,mis,[id]/editar}` (fuera de `/studio`, que es solo Premium). Atención: el segmento dinámico se llama `[slug]` en todas las rutas hermanas (en `editar` su valor es el **id**); Next revienta al arrancar si dos hermanos se llaman distinto (`app/lib/routing/dynamicSegments.test.ts` lo vigila).

## Datos (Firestore, solo Admin SDK)
| Ruta | Contenido |
|---|---|
| `activities/{id}` | La actividad (`Activity`): estado de publicación/moderación, `analytics {views, clicks, visits, reviews, saves}`, `join {capacity, closed} \| null`. `saves` es **privado** (nunca se muestra). |
| `activities/{id}/stats/{día}` | Conteo diario por canal (`bySource`, `viewsBy`), igual que eventos. |
| `activities/{id}/visits/{uid}` | "Yo fui": una por persona. |
| `activities/{id}/joinCounts/{salida}` | Inscritos vigentes por salida (`taken`). |
| `activityJoins/{actividad}_{salida}_{uid}` | Una inscripción por persona y salida. `salida` = día `YYYY-MM-DD` o `open`. |
| `users/{uid}/saved/activity_{id}` | Guardado privado. |
| `hostIdentities/{uid}`, `activityAccounts/{uid}` | Registro de oferente (Ley 1480 art. 53) e historial de confianza. |

Todo cambio y su contador van en **una transacción** (doble toque o dos pestañas = un solo cambio).

## Estados y visibilidad
`draft → published(pending) → approved | rejected`; `isActive=false` = pausada. Pública = publicada + aprobada + activa (+ sitio publicado y activo si es de sitio). `pending` no existe públicamente: la ficha responde con el 404 de la app (en streaming, con `noindex`, como `/donde-ir`); el dueño y QHPA ven vista previa. Cuentas con 3 aprobadas se autoaprueban (salvo categoría "otros").

## Permisos
Crear de sitio: autor del sitio "de verdad propio" (`isLinkableSite`) o QHPA. Editar, pausar, ver inscritos y cerrar cupos: dueño o QHPA (`canManageActivity`). Guardar / "Yo fui" / unirse: cuenta + actividad pública. El uid sale **solo** de la cookie.

## Unirse (A22; la interfaz espera prototipo A23)
`activityJoin.ts` (puro): `resolveOccurrenceKey` (salida pedida o próxima, hasta 120 días), `joinDecision` (cerrado/lleno), `spotsLeft`. Servicio: `ActivityJoinService` (avisos por la campanita al creador y a quien se une). Acciones: `join.action.ts`.

## Medición mínima (A24)
`POST /api/activities/[id]/track` (`view|directions|cta|share`) con mismo-origen, tope por IP y global (120/min), repetido por día. Guardar/"Yo fui"/unirse se cuentan en sus acciones de servidor. Canal de origen: `?ch=` (lo escribe `/r/a/<id>/<canal>`).

## Kit de compartir (A25)
`ShareKit` con `kind="activity"`: enlaces `/r/a/<id>/{ig,ig_h,wa,fb,qr}` (307 a `/actividades/<slug>?ch=…`; solo públicas), QR y afiche. Se abre al terminar el asistente y desde "Mis actividades".

## Scripts (`pnpm exec tsx scripts/…`, dry-run por defecto)
`list-activities.ts` (pendientes; `--approve <id> --apply`, `--reject <id> --reason`), `export-host-identity.ts`, `list-site-claims.ts` (transfiere actividades al aprobar un reclamo). Los scripts no pueden invalidar la caché de Next: lo aprobado aparece en listados en unos minutos.

## Pendiente / decisiones abiertas
- **Medios**: `../functions` aún no incluye `activities` en `OPTIMIZABLE_FOLDERS`: las imágenes quedan en `processing` (se ven con el original). Cambio en `../functions` = preguntar antes y empujar su rama.
- Índice de texto de `activities` en Firestore (F2, búsqueda) = preguntar antes.
- A23 interfaz de "Unirme" y lista del creador (`/actividades/[slug]/inscritos`) + campo de cupo en el asistente: **requieren prototipo aprobado**.
- "Yo fui" es autodeclarado (una por cuenta): con cuentas desechables se puede inflar "N personas fueron" (auditoría B4); mitigación futura: antigüedad mínima de cuenta.
- Guardar usa mecanismo propio para actividades; unificar con los "me gusta" de eventos/sitios es la tarea T12 de analytics-v2.

## Reservas (A23)

- Reservar un cupo **no se paga en QHPA**. Gratis: queda `confirmed` al instante y no se guarda teléfono. De pago (todas las opciones cuestan): se pide WhatsApp + consentimiento explícito; queda `pending` y quien organiza cobra afuera (`join.payInstructions`).
- Estados de `activityJoins/{act}_{salida}_{uid}`: `pending | confirmed | noShow`. Los registros viejos sin `status` cuentan como `confirmed`. `noShow` libera el cupo (el contador `joinCounts` solo cuenta pending+confirmed); «Devolver el cupo» lo pide de nuevo y respeta el tope.
- La persona puede reservar varias salidas de una misma actividad en una sola vez (una inscripción por salida); entre actividades distintas cada reserva es independiente.
- `phone` + `consentVersion` (LEGAL_VERSION vigente) solo se guardan en actividades de pago. El organizador (dueño o QHPA) los ve en `/actividades/[id]/inscritos`; nadie más.
- Embudo: Vieron/Fueron = toda la actividad (`analytics.views/visits`); Reservaron/Por confirmar/Confirmadas = de la salida elegida. Porcentajes desde 10 reservas. **Pendiente:** origen de las reservas por canal (no se atribuye el `join` al canal todavía).
- Pendiente legal (preguntar antes): texto de la Política de privacidad sobre el WhatsApp compartido y posible subida de `LEGAL_VERSION`.
