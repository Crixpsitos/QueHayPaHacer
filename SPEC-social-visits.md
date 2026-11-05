# Spec: `social-visits` — contar visitas anónimas de Facebook/redes (punto 7)

Estado: BORRADOR para aprobación. No hay código. Fecha: 2026-11-05.

## REVISIÓN 14:45 (reemplaza la recomendación de abajo)

El usuario aclaró el alcance: NO es solo Facebook. Quiere (1) Google Analytics bien puesto en todas las páginas públicas, (2) contar a TODOS los visitantes sin sesión, (3) separar tráfico de cualquier red social (Facebook, Instagram, TikTok, WhatsApp, etc.), no solo el que trae UTM.

**Nueva recomendación: opción A (GA4 vía Firebase Analytics) como solución principal.** El beacon propio (opción B) queda solo como respaldo opcional.

- GA4 clasifica solo el tráfico social por `referrer` y por `utm_*` ("Organic Social"/"Paid Social"). Los navegadores internos de Facebook/Instagram/TikTok a veces quitan el referrer, por eso además se pide UTM en los enlaces propios (docs/28 ya lo manda).
- `firebase/analytics` ya está instalado (`node_modules/firebase/analytics`). Falta: cargarlo perezosamente en el cliente (no en SSR), enviar `page_view` en cada cambio de ruta del App Router, y NO enviar nada en rutas privadas (`/studio`, `/mis-*`, `/profile`, `/sites`, `/eventos/create`, editor).
- **Ley 1581 / consentimiento:** Consent Mode v2 con `analytics_storage` en `denied` por defecto; sin cookies hasta que la persona acepte. Un aviso simple y accesible (aceptar / rechazar, mismo peso visual). Aquí sí aplican las skills de UI (frontend-ui-engineering, ui-design, web-design-guidelines, frontend-design) para el aviso.
- 0 escrituras a Firestore. Costo: GA4 es gratis; el único costo es el JS extra (cargado diferido, tras la interacción/idle, para no empeorar Lighthouse).
- Eventos propios (fase 2, opcionales): `view_item` en ficha de evento/sitio, `click_whatsapp`, `click_como_llegar`. Sin datos personales ni uid.
- **Verificar antes de construir (no comprobado):** que la app web de `quehaypahacer-prod` exista en Firebase y que `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` tenga un valor real en prod y develop (runbook docs/15 dice "no pude comprobar"); y que la propiedad GA4 esté vinculada. Esto lo ve el usuario en la consola o lo compruebo con permiso.
- Límite honesto: con aviso de cookies, quien rechaza o no responde no queda contado al 100% (GA4 solo estima con "modelado"). Si quieren un conteo base de visitas sin consentimiento, se suma el beacon B (sin cookies, sin IP) como complemento, solo con la ruta y el origen.

### DECISIÓN 14:57: camino A (el usuario eligió)

GA4 es **solo para decisiones de producto del dueño**, no se muestra en la app. Los contadores actuales (`analytics.views`, "Visitas" de sitios, estudio) NO se tocan. Sin puente diario a Firestore por ahora. Si luego se quiere ver Analytics en el estudio, será otra spec (camino B).

Qué debe poder ver el dueño en GA4, **con y sin sesión**:
- Visitas y páginas más vistas, por canal (Organic/Paid Social, Directo, Búsqueda, Referido) y por red (Facebook, Instagram, TikTok, WhatsApp…).
- Parámetro de usuario `login_state` = `anon` | `logged_in` en cada evento (booleano, SIN uid, email ni nada personal). Se debe registrar como dimensión personalizada en la consola de GA4 (un clic del usuario) para poder segmentar.
- Eventos de producto (fase 1 mínima, fase 2 el resto): `page_view` por ruta pública; `view_item` (tipo evento/sitio + id + categoría); `click_whatsapp`, `click_como_llegar`, `share`, `like`, `register_event` (inscripción), `search`/uso de filtros.
- Rutas privadas (`/studio`, `/mis-*`, `/profile`, `/sites`, `/eventos/create`, editor) no envían nada.
- Aviso de consentimiento (Consent Mode v2) como ya dicho; sin consentimiento solo llegan pings sin cookies.

### Protección contra abuso y lecturas/escrituras innecesarias (pedido del usuario 14:49; OBLIGATORIA)

Regla madre: **ninguna visita individual escribe ni lee en Firestore.** GA4 cuenta las visitas; si se quiere un número propio, solo se escribe un agregado cada tanto, y el tráfico (real o de bots) no cambia cuántas escrituras hay.

1. **Filtrar bots (sin usar User-Agent: en App Hosting siempre llega "Google", ver memoria).** El conteo solo lo dispara JavaScript del cliente, así que los scrapers sin JS no cuentan. Además: pestaña visible ≥ 2 s antes de enviar; el servidor exige `Sec-Fetch-Site: same-origin` + `Content-Type` JSON + cuerpo ≤ 1 KB; `path` validado contra patrón de rutas públicas (no se aceptan rutas inventadas); campos con lista permitida. Lo que falla se responde 204 y se descarta sin tocar la base.
2. **Rate limit en dos niveles.** Por IP (ya existe `createIpLimiter`, bajarlo a ~10/min para este endpoint) y un tope GLOBAL por instancia (p. ej. 600/min): al pasarlo, se descarta en silencio. Y `maxInstances` fijo en `apphosting.production.yaml` para que un ataque no escale sin techo (pedir permiso: es infra de prod).
3. **Una visita por persona, aunque borre/resetee el navegador.** Tres capas: (a) marca en `localStorage` + `sessionStorage` (1 por día por navegador); (b) si borra eso, el servidor recuerda un hash `SHA-256(IP + UA + sal diaria)` en memoria con vencimiento de 24 h y descarta repetidos (la sal rota cada día: no se puede rastrear a nadie entre días, sin dato personal almacenado); (c) lo que se cuela igual solo suma a un contador agregado, no crea documento. Límite honesto: la memoria es por instancia, así que con varias instancias puede colarse algún duplicado; es aceptable porque nada se escribe por visita.
4. **Escritura acotada (solo si hay número propio).** Contadores acumulados en memoria y vaciados como UN documento agregado por (día, origen) cada ≥ 5 min por instancia, o mejor: registro en logs + una Cloud Function diaria que agrega (≈ 1 escritura/día). Peor caso de escrituras = `maxInstances × 288/día × orígenes`, constante, sin importar el tráfico ni los bots (con 3 instancias y 5 orígenes ≈ 4 300/día ≈ US$0.01/día).
5. **Lecturas (ya existe, mismo problema):** `recordEventView` hace 1 lectura por cada vista de un usuario con sesión aunque ya la haya visto (`eventInteractions/{id}.get()`). Propuesta: no leer si el cliente ya marcó "visto" localmente, y usar `create()` (falla si existe) en vez de get + set. Preguntar antes de tocarlo: afecta ranking `analytics.views`.
6. **Alerta:** métrica de "descartados por rate limit/bot" para notar un ataque y alerta si las escrituras de este flujo superan un umbral diario.

Preguntas abiertas actualizadas al final del documento (sección "Preguntas abiertas" original sigue en pie, ver lo de enlace/gasto/vista).

---

## Hallazgos (lo que ya existe, verificado en el código)

1. **Firebase Analytics NO está cableado.** `measurementId` está en `infraestructure/firebase/config/client/firebase.ts` y como secreto en `apphosting.production.yaml`, pero no hay `getAnalytics`, `logEvent`, `gtag` ni `<Script>` en todo el repo. (La nota de memoria que decía "ya existe, carga perezosa" era incorrecta: solo existe la config.)
2. **`recordEventView` solo cuenta autenticados** (`_recordEventView.ts`: `if (!userId) return`), 1 lectura + 2 escrituras por vista única, y se dispara desde `/api/events/[id]/viewer`, que sale temprano si no hay sesión. Un visitante anónimo de Facebook hoy no deja rastro. Cambiarlo a anónimo = escritura a Firestore por visitante → justo lo que se quiere evitar.
3. **Patrón existente de beacon anónimo:** `/api/campaigns/track` (POST, sendBeacon, valibot, tope por IP 60/min en memoria). Pero escribe 2 documentos por llamada (`analytics.*` + `stats/{día}`). Reusar tal cual = escrituras.
4. **No hay UTM ni `fbclid` capturados** en ningún lado. docs/28 ya manda usar UTM por canal pero nada los lee.
5. **No hay aviso de cookies/consentimiento** en la app. CSP solo cubre `/sw.js`, no bloquearía GA.
6. **Fichas públicas se sirven desde CDN** (`s-maxage=120`): el servidor no ve cada visita; solo el cliente puede contarla.
7. **`apphosting.production.yaml` no fija `maxInstances`** (solo `minInstances: 0`): el peor caso de tráfico abusivo no tiene techo de instancias.
8. UA siempre "Google" en App Hosting (memoria): no se puede detectar origen por UA ni por logs de acceso; hay que leer `utm_*`/`fbclid` en el cliente.

## Objetivo

Saber cuántas visitas anónimas llegan desde cada anuncio/canal social (Facebook, Instagram, QR) y a qué ficha, **sin escribir en Firestore** por visita, respetando Ley 1581 (sin identificar personas).

Éxito: tras publicar un enlace con UTM, en ≤ 1 día se ve "N visitas, origen X, ficha Y", con 0 escrituras Firestore atribuibles, y el costo extra < US$1/mes con el tráfico esperado.

## Opciones (con recomendación)

| | A. GA4 vía Firebase Analytics | B. Beacon propio → log estructurado (Cloud Logging) | C. Contador Firestore | D. Muestreo |
|---|---|---|---|---|
| Escrituras Firestore | 0 | 0 | 1+ por visita | 0.1–1 por visita muestreada |
| Costo | gratis | gratis hasta 50 GiB/mes de logs | por escritura | menor, impreciso |
| Datos personales | cookies + ID de cliente (requiere aviso/consentimiento) | ninguno si no se guarda IP ni ID | ninguno | ninguno |
| Dónde se ve | consola GA4 (tarda, tiene muestreo y umbrales) | Logs Explorer / métrica basada en logs | panel propio | panel propio |
| Esfuerzo | medio (SDK + banner de consentimiento) | bajo (1 ruta + 1 hook) | bajo | medio |

**Recomendación: B ahora, A solo si quieres embudos/demografía.**
B es lo único que cumple 0 escrituras + 0 datos personales + sin banner. Se puede consultar ya con Logs Explorer o con una métrica basada en logs (`utm_campaign`, `path`). Si luego quieres un panel propio, se agrega después una Cloud Function programada que agregue los logs en 1 documento/día (≈ 1 escritura por día, no por visita).

## Diseño de B (borrador)

- **Cliente:** componente montado una vez en el layout. Si la URL trae `utm_source|utm_medium|utm_campaign|fbclid`, envía UNA vez por pestaña (sessionStorage, con try/catch) un `sendBeacon` a `/api/v/hit` con `{ path, source, medium, campaign, fb: boolean }`. Sin cookies, sin ID persistente. Sin UTM → no envía nada (solo interesa tráfico de campañas; el orgánico no se mide aquí).
- **Servidor:** ruta POST, valibot con listas permitidas y longitudes máximas (`path` debe empezar por `/` y ≤ 200, valores UTM `[A-Za-z0-9_.-]{1,64}`), tope por IP reutilizando `createIpLimiter`, respuesta 204. Emite `console.log(JSON.stringify({ event: "social_visit", entryPoint: "web_beacon", path, source, medium, campaign, fb }))`. **No** registra IP, UA ni cabeceras. No toca Firestore.
- **Lectura:** consulta guardada en Logs Explorer + (opcional) métrica basada en logs con `campaign`/`source` como etiquetas (cardinalidad acotada por la lista permitida).
- **Pregunta de on-call/negocio que responde:** ¿cuántas visitas trajo el anuncio X? ¿a qué ficha llegan? ¿cuántas vienen de Facebook vs Instagram vs QR?

## Peor caso de costo (precios de memoria, SIN verificar contra la tarifa vigente; confirmar antes de decidir)

- Tráfico legítimo: tu gasto/enlace aún no los tengo (ver preguntas). Con 10 000 visitas/mes: 10 000 solicitudes + ~3 MB de logs → ≈ US$0.
- Peor caso abusivo (bot que llama la ruta sin parar, el tope por IP es por instancia y se evade con IPs/instancias): 1 M llamadas/día = 30 M/mes ≈ 9 GiB de logs (dentro de los 50 GiB gratis) + solicitudes de Cloud Run ≈ (30 M − 2 M gratis) × US$0.40/M ≈ **US$11/mes** + CPU/instancias (no acotado hoy: no hay `maxInstances`). Firestore: **US$0** (ese es el punto).
- Comparación: opción C con el mismo abuso = 2 escrituras × 30 M ≈ 60 M escrituras/mes ≈ **US$100+** (a ~US$0.18/100k). Por eso B.
- Mitigación propuesta (pedir permiso, es infra): fijar `maxInstances` en `apphosting.production.yaml` y una alerta de presupuesto/solicitudes.

## Comandos

```
pnpm typecheck   # typegen primero (ver memoria test-setup)
pnpm test
pnpm lint
pnpm dev         # con NODE_OPTIONS=--dns-result-order=ipv4first
```

## Estructura prevista (si se aprueba)

```
app/api/v/hit/route.ts                 → beacon, valida y loguea
app/lib/socialVisit.ts                 → parseo de UTM (puro, testeable) + envío
app/components/SocialVisitBeacon.tsx   → client component montado en layout (sin UI)
app/lib/socialVisit.test.ts            → pruebas del parseo/validación
docs/15-runbook-produccion.md          → consulta de Logs Explorer + qué hacer si se dispara
```

Sin UI visible → las skills de frontend/UI-UX no aplican a este punto; solo si se pide un panel (opción "panel mío") habría diseño de pantalla.

## Estilo de código

```ts
// puro y testeable: sin DOM
export function parseCampaign(search: string): Campaign | null {
  const p = new URLSearchParams(search);
  const source = clean(p.get("utm_source"));
  const fb = p.has("fbclid");
  return source || fb ? { source: source ?? "facebook", medium: clean(p.get("utm_medium")), campaign: clean(p.get("utm_campaign")), fb } : null;
}
```

## Pruebas

- Unitarias (node test, como el resto): `parseCampaign` (sin UTM → null; solo fbclid → facebook; valores con caracteres raros → descartados/limpiados), validación de body de la ruta (rechaza path sin `/`, campos largos).
- Manual con guion numerado: abrir `https://…/eventos/<id>?utm_source=facebook&utm_medium=cpc&utm_campaign=prueba` en develop, ver 1 log `social_visit` en Logs Explorer, recargar y comprobar que NO duplica en la misma pestaña, y comprobar 0 escrituras Firestore nuevas.

## Límites

- Siempre: no guardar IP/UA/ID persistente; no escribir en Firestore por visita; validar entrada con lista permitida; sin cookies.
- Preguntar antes: fijar `maxInstances`, crear métrica/alerta en GCP prod, agregar GA4 (banner de consentimiento), cualquier tabla agregada.
- Nunca: contar visitas anónimas escribiendo a Firestore por visita; loguear cuerpos completos o cabeceras; desplegar a prod sin orden explícita.

## Criterios de éxito (testables)

1. Enlace con UTM → exactamente 1 línea `social_visit` por pestaña, con `source/medium/campaign/path` correctos.
2. Enlace sin UTM → 0 llamadas a `/api/v/hit`.
3. 0 escrituras Firestore nuevas (verificable en uso de Firestore antes/después).
4. Ninguna línea de log contiene IP, UA ni cookies.
5. Body inválido → 400; sobre el tope por IP → 429.
6. `pnpm test`, `typecheck`, `lint` verdes (lint con los 8 `any` previos sin tocar).

## Preguntas abiertas (necesito tu respuesta)

1. **Enlace anunciado:** el mensaje llegó con `<PEGA EL ENLACE>` sin reemplazar. ¿Cuál fue? (¿ya lleva UTM? Si no, las visitas ya pasadas no se pueden recuperar por esta vía.)
2. **Gasto:** llegó `<MONTO>` sin reemplazar. Sirve para costo por visita; no cambia el diseño.
3. **Dónde ver el conteo:** llegó `<GA4 / un panel mío / no me importa>` sin elegir. Mi propuesta: Logs Explorer ahora (opción B), panel propio después si lo quieres.
4. ¿Apruebas B (y fijar `maxInstances`), o prefieres GA4 con banner de consentimiento?
