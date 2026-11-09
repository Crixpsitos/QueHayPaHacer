# Spec: `analytics-v2` — medir honesto, enlaces cortos, embudo y "qué hacer"

Estado: BORRADOR para aprobación. No hay código. Fecha: 2026-11-08.
Relacionadas: `SPEC-social-visits.md` (GA4, ya en prod), `docs/26-medicion-sitios.md`, `docs/29-analytics-ga4.md`.

## Objetivo

Una promesa para cada lado de la plataforma, en una frase:

- **Usuarios: "quiero saber qué hacer".** Lo que aparece primero es lo que de verdad le sirve a la gente (acciones reales, no solo volumen).
- **Clientes (organizadores y sitios): "quiero saber si honestamente esta página funciona".** Cada cliente ve cuántas personas vieron su evento o sitio, cuántas actuaron, de dónde llegaron, y un veredicto que **dice cuando no hay datos suficientes** en vez de inventar.

Contexto: hay poca gente hoy y la meta es crecer. El valor de esta spec es **demostrar** la mejora con números de antes y después, no solo construirla.

Éxito global: en 14 días de datos nuevos, (a) las vistas de eventos dejan de ser ~0 para visitantes anónimos, (b) existe un informe por evento/sitio con embudo y origen, (c) hay una tabla antes/después entregada al dueño, y (d) el costo de escrituras extra queda dentro del presupuesto declarado (ver "Presupuesto de escrituras").

## Mapa de capacidades (para aprobar ANTES de la spec de cada módulo)

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `measure` | Contar vistas (anónimas y con sesión) y acciones de **eventos** con la misma lógica que ya usan los sitios; clasificar el origen | — |
| `short-links` | Redirección contada: `/r/e/…` y `/r/s/…` para botones de salida, y `/r/<código>` para enlaces de campaña que un cliente pega en sus redes | `measure` (clasificador de origen y contadores diarios) |
| `intent` | Reemplazar el "like" por **Guardar** (privado) y agregar **Voy a ir** | `measure` (para contarlos en el embudo) |
| `funnel-report` | Embudo por evento/sitio (vistas → interés → acción), origen, veredicto honesto; vista para organizador y para QHPA | `measure`, `short-links`, `intent` |
| `ranking-v2` | Orden de listas por acciones reales ("qué hacer") + atajos hoy / fin de semana | `funnel-report` (datos), 14 días de `measure` |

Orden de construcción: `measure` → (`short-links`, `intent` en paralelo) → `funnel-report` → `ranking-v2`.
Cada módulo se puede lanzar y verificar solo. Si algún límite entre módulos está mal, se ajusta aquí antes de construir.

## Hallazgos verificados (en el código, 2026-11-08)

1. `recordEventView` solo cuenta con sesión (`if (!userId) return`) y `/api/events/[id]/viewer` sale temprano sin sesión: **un visitante anónimo no deja rastro en `analytics.views` de eventos.** El ranking usa `views*0.1`.
2. Los **sitios** sí cuentan anónimos: beacon `POST /api/sites/[id]/track` → `recordTrack` = 1 incremento en el doc del sitio + 1 escritura en `sites/{id}/stats/{día Bogotá}`. Tipos: `view, directions, website, social, booking, call, share, transit`. Eventos y sitios miden distinto.
3. Clics de eventos (WhatsApp, cómo llegar, enlace externo): solo en GA4 (`click_whatsapp`, `click_como_llegar`, `click_out`, `share`, `like`, `register_event`, `view_item`); en Firestore solo el clic de registro externo (`record-external-registration-click.action.ts`).
4. El like exige sesión y es **del evento**, no de la sesión (multi-fecha); alimenta el perfil y `analytics.likes` (peso 0,5).
5. Puntaje de evento (`../functions/src/utils/calculateTrendingScore.ts`): `(views*0.1 + likes*0.5 + registrations*2 + shares*1 + promo 100) × urgencia × decaimiento`. Sitios: `domain/entities/sites/siteRanking.ts`.
6. Existen guardas reutilizables: `app/api/_lib/beaconGuard.ts` (`isSameOriginBeacon`, `readBoundedJson`, `createGlobalLimiter`) y `ipRateLimit.ts` (`createIpLimiter`, `clientIp`).
7. App Hosting: el User-Agent siempre llega "Google" → **no se puede detectar bots por UA**. La fichas públicas van en CDN: solo el cliente ve a cada visitante.
8. No hay `firestore.rules` ni `firestore.indexes.json` en el repo de la app (las reglas se manejan fuera): colecciones nuevas necesitan reglas/índices por canal aparte (ver "Preguntar antes").

**No verificado:** los totales reales de prod (la consulta fue bloqueada por permisos). Por eso el primer entregable es el script de línea base.

## Supuestos (corrígelos ahora o sigo con ellos)

1. Solo web (Next.js 16 App Router, Cache Components); sin app nativa.
2. Firestore es la fuente de verdad de contadores; GA4 sigue como herramienta del dueño y **no** alimenta la app (decisión del 2026-11-05 se mantiene).
3. "Guardar" y "Voy a ir" **requieren sesión** (igual que el like hoy). Un "voy" anónimo sería fácil de inflar.
4. Los contadores nunca guardan IP, UA, uid ni identificadores personales; solo conteos por (día, tipo, origen).
5. Las cifras para organizadores son **gratis** en lo básico; si se vuelven Premium es decisión comercial posterior (ver preguntas).
6. Zona horaria de los días: Bogotá (`bogotaDay`, ya existe).

## Línea base y demostración de mejora (entregable 0)

- `scripts/analytics-baseline.ts` (solo lectura, vía REST con token de gcloud o SDK admin): por colección (`events`, `sites`) → total y promedio de `views`, `likes`, `shares`, `registrations`, `clicks`; cuántos eventos tienen `views == 0`; cuántos tienen carpeta `stats`. Guarda JSON con fecha en `~/.cache/qhpa-qa/baselines/`.
- Se corre **antes** de desplegar `measure`, y otra vez a los 14 días.
- Tabla "antes / después" entregada al dueño, más una conciliación **GA4 vs Firestore** (vistas de ficha en GA4 `view_item` contra vistas propias; objetivo: diferencia explicada, no necesariamente igual: GA4 pierde a quien rechaza cookies, el beacon propio pierde a quien bloquea JS).
- Criterio de honestidad: si la mejora no se ve, se dice.

## Presupuesto de escrituras (obligatorio)

Regla heredada de `SPEC-social-visits.md`: **ninguna visita puede crecer sin techo.**

- Vista de evento aceptada = 2 escrituras (doc del evento `analytics.views` + `events/{id}/stats/{día}`), igual que sitios. Acción aceptada = 2 escrituras.
- Filtros antes de escribir (todos responden 204 sin tocar la base): `isSameOriginBeacon`, cuerpo ≤ 1 KB, id y tipo válidos (valibot), 1 vista por navegador y día (`localStorage`), tope por IP (`createIpLimiter`) y tope global por instancia (`createGlobalLimiter`, hoy 600/min), y en servidor `Set` en memoria de `SHA-256(IP + UA + sal diaria)` con vencimiento 24 h para repetidos.
- El techo real es el límite global por instancia, que se baja a **120 aceptadas/min** para este endpoint (hoy en sitios es 600). Peor caso bajo ataque sostenido: 5 instancias × 120/min × 1 440 min = 864 000 aceptadas/día × 2 escrituras ≈ 1,7 millones de escrituras ≈ US$3/día (a ~US$0,18 por 100 000, cálculo mío sin verificar contra la factura). Con tráfico normal (cientos de visitas/día) el costo es centavos. Se agrega alerta si las escrituras de este flujo superan un umbral diario (infra de prod: pedir permiso).
- Límite conocido: un doc `stats/{día}` admite ~1 escritura/s sostenida. Con el tráfico actual sobra; si se acerca, se agrega buffer en memoria con vaciado cada 30–60 s. (`ponytail:` documentarlo en el código.)

---

## Módulo 1 — `measure`

**Qué hace.** Un beacon único para eventos (calcado de sitios) y una función compartida que clasifica el origen.

**Comportamiento**
- `POST /api/events/[id]/track` con `{ type, sessionId?, src? }`. `type ∈ view | directions | website | booking | whatsapp | share | register_external | call`. Sesiones: `sessionId` opcional (multi-fecha); el contador se suma al evento y a `events/{id}/sessions/{sid}` (ya hay agregadores `session*`).
- Cliente: `sendBeacon` tras ≥ 2 s con la pestaña visible y en idle, solo en rutas públicas (`isTrackablePath`), una vista por navegador y día.
- Origen (`src`): función pura `trafficSource({ utm_source, utm_medium, ref, qr })` → `instagram | facebook | tiktok | whatsapp | google | direct | link:<código> | other` (lista cerrada, sin cardinalidad libre).
- `recordEventView` y la rama de vista de `/api/events/[id]/viewer` se **retiran**: todas las vistas (con o sin sesión) entran por el beacon. Cambio de semántica: de "única por usuario para siempre" a "única por persona y día". Queda registrado: `analytics.views` crecerá (ver riesgo de ranking).
- Datos: `events/{id}/stats/{día}` = `{ day, views, <tipo>: n, clicks, bySource: { instagram: n, … } }` con incrementos. El doc del evento mantiene `analytics.views` y `analytics.clicks` acumulados (mismo contrato que sitios).
- Sitios: se reutiliza `recordTrack`, agregando `bySource` en el doc diario; sin cambio de API pública.

**Estructura** (siguiendo capas del repo)
```
domain/entities/analytics/trackTypes.ts      → EVENT_TRACK_TYPES, isEventTrackType
domain/entities/analytics/trafficSource.ts   → trafficSource() puro + test
application/dto/events/EventTrackDto.ts      → valibot
application/services/events/EventInteractionsService.ts → recordTrack()
infraestructure/firebase/repositories/events/…           → escritura (batch)
app/api/events/[id]/track/route.ts           → copia el patrón de sites/[id]/track
app/lib/analytics/ (cliente)                 → hook useTrackEvent (idle + 2 s + 1/día)
```

**Criterios de éxito**
- Visitante anónimo abre un evento y recarga 3 veces → `views` sube **1** (prueba con Playwright, contando peticiones).
- Petición sin `Sec-Fetch-Site: same-origin`, con cuerpo > 1 KB o `type` inválido → 204 y **0** escrituras (test unitario).
- Evento inexistente → ignorado sin lectura (`update()` con NOT_FOUND, como sitios).
- Un clic en WhatsApp del evento queda en `stats/{hoy}.whatsapp`.
- Lighthouse de la ficha de evento no baja más de 2 puntos.

## Módulo 2 — `short-links`

**Qué hace.** Redirección contada, en dos formas.

**A. Salida rastreada (sin crear nada).** `GET /r/e/[id]?to=register|website|booking` y `/r/s/[id]?to=website|booking|social|call`. El servidor lee el destino **del documento** (nunca de la URL), cuenta con `after()` y responde 307. Los botones de la app apuntan a estas rutas. Sirve para: enlace de registro externo, entradas, WhatsApp, reserva.

**B. Enlaces de campaña (el "Bitly").** Para pegar en la biografía de Instagram, historias, QR: `yquehaypahacer.com/r/<código>` → ficha de evento/sitio con `?utm_source=…&qr=<código>`. El cliente genera el enlace desde "Mis enlaces" (estudio) y le pone una etiqueta ("Instagram de Nebraska").
- Datos: `links/{código}` = `{ code, label, target:{ type:"event"|"site", id }, ownerUid, createdAt, active }`; `links/{código}/stats/{día}` = `{ clicks, bySource }`. Código: 7 caracteres base62 con `crypto`, creado con `create()` (falla si existe).
- El clic en `/r/<código>` cuenta en el enlace; la visita que llega a la ficha cuenta como `view` con `src = link:<código>` (así se mide clic → vista → acción).
- **Seguridad: no hay redirección abierta.** El destino sale siempre de un documento propio; solo http(s); se rechazan `javascript:`, `data:`, hosts locales/IP privadas al guardar. Solo dueños del evento/sitio (o admin) crean enlaces sobre lo suyo. Código desconocido → 404 con enlace a la home. `Cache-Control: no-store`.
- Costo: 1 lectura del doc destino/enlace por clic (cache en memoria 60 s por instancia) + 1–2 escrituras, mismos topes del módulo 1.
- Fuera de alcance v1: dominio corto propio (`qhpa.co`) y generador de QR (se decide después).

**Criterios de éxito**
- `/r/e/<id>?to=register` → 307 al URL guardado y `stats/{hoy}.register_external` +1; con `to` inválido → 404 sin escritura.
- `/r/<código>` → 307 a la ficha con `utm_source` y `qr`; código inexistente → 404.
- Test: ninguna URL del query/path llega a `Location` (solo destinos guardados).
- Un cliente crea un enlace, lo abre, y ve "1 clic" en su listado en ≤ 1 min.

## Módulo 3 — `intent` (adiós like, hola Guardar y Voy a ir)

**Guardar.** El corazón pasa a marcador "Guardar". Es el mismo dato (`liked`, `analytics.likes`), **privado**: se quita el contador a la vista pública (tarjetas, detalle, `PublicProfileTabs`); el organizador lo ve en su informe. Los favoritos existentes se conservan; la lista del perfil se llama "Guardados". Cero migración de datos.

**Voy a ir.** Botón nuevo para eventos con y sin inscripción (y por **sesión** en multi-fecha: se asiste a una fecha). Datos: `eventInteractions` con `going: true` (+ `sessionId`); contador `analytics.going` (y agregado de sesiones). Requiere sesión. Si la persona además se inscribe, cuenta **una** intención (no se suma doble). Texto público "N personas van" solo desde un umbral (propuesta: 10) para no exhibir cifras ridículas con poco tráfico. Recordatorio opcional el día anterior (usa el sistema de notificaciones; **fuera de v1**, ver preguntas).

**Criterios de éxito**
- Ninguna pantalla pública muestra el contador de guardados; los guardados previos siguen apareciendo en "Guardados".
- Marcar/desmarcar "Voy a ir" es idempotente y actualiza el contador una sola vez por persona.
- Inscribirse a un evento donde ya marqué "voy" no suma intención dos veces (test de dominio).
- Textos y accesibilidad según `frontend-ui-engineering` (botón con estado `aria-pressed`, foco visible, 44 px).

## Módulo 4 — `funnel-report`

**Qué muestra (por evento o sitio, rango 7/30 días):**
1. Embudo: **vistas → interés** (guardados + voy + compartidos) **→ acción** (WhatsApp, cómo llegar, enlace, registro). Cada paso con el **número absoluto** y el porcentaje.
2. **Origen**: de dónde llegaron (Instagram, Facebook, WhatsApp, Google, directo, enlace de campaña con su etiqueta).
3. **Veredicto honesto** con reglas fijas y explicables:
   - menos de 30 vistas en el rango → "Pocos datos todavía" (sin porcentajes comparativos);
   - con datos suficientes y ≥ 5 eventos comparables de la misma categoría en 30 días → compara con la mediana: "Funciona mejor / parecido / peor que otros de su categoría";
   - siempre una acción sugerida ("Comparte con un enlace corto en Instagram", "Agrega la ubicación y un horario").
4. Todo con su fecha de corte y la nota "no contamos a quien bloquea el seguimiento".

**Dónde se ve**
- Organizador: pestaña "Estadísticas" en su evento (`/studio/events/[id]`) y en su sitio, más "Mis enlaces".
- QHPA (solo `QHPA_ADMIN_UIDS`): `/studio/analitica` con los eventos y sitios que más/menos funcionan, orígenes y enlaces. Es el primer paso del panel administrativo pendiente, no el panel completo.
- Lectura: hasta 30 docs diarios por vista del informe, con `"use cache"` y `cacheLife("hours")` + tag por evento (sin lecturas por visita pública). Línea base de comparación por categoría: se calcula al abrir el informe de QHPA y se cachea; sin función programada en v1.

**Criterios de éxito**
- Con 12 vistas el informe dice "Pocos datos todavía" y no muestra porcentajes comparativos (test de la función `verdict()` pura).
- Los números del informe coinciden con la suma de `stats/{día}` (test con datos de ejemplo).
- Un organizador solo ve **sus** eventos/sitios; un no-admin recibe 403 en `/studio/analitica` (test).
- El informe carga en < 2 s con 30 días de datos (medición manual).

## Módulo 5 — `ranking-v2` ("qué hacer")

- Puntaje por **tasa de acción suavizada**: `(acciones + k·p0) / (vistas + k)` con `k = 20` y `p0` = tasa global, para que un evento con 3 vistas y 3 acciones no gane a uno con 300 y 90. Se conservan promoción (+100), urgencia y decaimiento.
- Modo **sombra** primero: se guarda `analytics.scoreV2` junto al actual **sin cambiar el orden visible**; se compara el orden de ambos con datos reales (≥ 14 días de `measure`) y se documenta; el cambio visible requiere aprobación.
- Eventos: función en `../functions` (repo aparte, se despliega con `firebase deploy --only functions:<nombre> --project quehaypahacer-prod`; **pedir orden explícita**). Sitios: `domain/entities/sites/siteRanking.ts` en la app.
- Atajos "Hoy" y "Este fin de semana" en Explorar: ya existen `findTodayEvents` y la landing `/que-hay-hoy-ibague`; el módulo solo agrega chips que lleven a ellos (verificar primero qué filtros hay, no duplicar).

**Criterios de éxito**
- En modo sombra, 0 cambios en el orden visible.
- Informe de comparación: top 10 con puntaje actual vs v2 y por qué cambian.
- Test de la fórmula: poca muestra no supera a mucha muestra con tasa razonable.

---

## Comandos

```
Dev:        NODE_OPTIONS=--dns-result-order=ipv4first pnpm dev     # IPv6 local roto: ver memoria
Tests:      pnpm test                                              # tsx --test, node:test
Typecheck:  pnpm typecheck                                         # next typegen && tsc --noEmit
Build:      pnpm build
Línea base: pnpm tsx scripts/analytics-baseline.ts                 # solo lectura
```

## Estructura y estilo

Capas existentes: `domain/` (reglas puras + tests), `application/` (servicios y DTOs valibot), `infraestructure/` (Firebase), `app/` (rutas y acciones), `presentation/` (UI). Funciones puras con test `node:test` al lado; los atajos conocidos se marcan `ponytail:` con su techo.

```ts
// domain/entities/analytics/trafficSource.ts — lista cerrada, sin cardinalidad libre
export const SOURCES = ["instagram", "facebook", "tiktok", "whatsapp", "google", "direct", "other"] as const
export type Source = (typeof SOURCES)[number]
export function trafficSource(i: { utm_source?: string; ref?: string }): Source { /* … */ }
```

## Pruebas

- Unitarias: `trafficSource`, `verdict`, fórmula de `ranking-v2`, regla "una intención por persona", validación de `type`/`to`.
- Integración con el emulador o contra develop: beacon → escritura (contar documentos).
- Playwright contra develop (cuando el MCP conecte; si no, guion numerado al usuario): 3 recargas = 1 vista; clic de WhatsApp; `/r/…` redirige.
- Revisión independiente con `code-reviewer` y `security-auditor` (redirección abierta, abuso de beacons, privacidad) antes de cada subida a prod.

## Límites

**Siempre:** tests y typecheck en verde; `git add` con rutas explícitas (nunca `-A`); validar entradas en el servidor; avisar la hora antes de empujar a `main`; documentar el techo de cada atajo.

**Preguntar antes:** reglas e índices de Firestore para `links`, `*/stats` y `eventInteractions.going` (se gestionan fuera del repo); `maxInstances` y alertas de Cloud Monitoring (infra de prod); desplegar `functions` (ranking); dependencias nuevas; texto de `/privacidad` (cambia al contar por origen); dominio corto; cualquier cambio visible del orden de las listas.

**Nunca:** crear un documento por visita; detectar bots por User-Agent; guardar IP/UA/uid en los contadores; aceptar el destino de una redirección desde la URL; desplegar a prod sin orden explícita; cambiar el orden visible sin comparar antes en modo sombra.

## Preguntas abiertas (necesito tu decisión)

1. ¿"Guardar" y "Voy a ir" **solo con sesión**? (recomendado: sí; un "voy" anónimo se infla y no sirve para recordatorios).
2. Umbral para mostrar "N personas van": ¿10?
3. Estadísticas: ¿todas gratis, o el origen y la comparación con otras categorías para Premium? (`docs/25-monetizacion-sitios.md`).
4. Salida rastreada: ¿mostrar una pantalla intermedia "vas a salir de Que hay pa hacer" para enlaces externos? (frena phishing, cuesta un clic más; recomendado: no en v1, sí si se abre la creación de enlaces a cualquiera).
5. Cambio de "única por usuario para siempre" a "única por persona y día": ¿ok? Hace subir `analytics.views` de todos los eventos; el modo sombra de `ranking-v2` lo absorbe.
6. ¿Recordatorio "mañana es tu evento" para quien marca "Voy a ir" en v1 o después?
7. ¿Dominio corto (`qhpa.co` o similar) ahora o cuando haya clientes que lo pidan?
8. ¿Generador de QR en "Mis enlaces" en v1?
9. Texto de privacidad: ¿lo redacto como borrador para tu revisión legal?
