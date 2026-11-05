# Plan: `social-visits` → Google Analytics 4 (camino A)

Spec aprobada 2026-11-05 15:05: `SPEC-social-visits.md` (sección REVISIÓN + DECISIÓN 14:57 + protección de abuso).
Lista de tareas: `tasks/todo-analytics.md` (archivos aparte para no pisar `tasks/plan.md`/`todo.md` del trabajo de medios, que aún tiene ítems sin marcar).
Measurement ID de prod que dio el usuario: `G-H2HVSKEBNZ` (público; NO se escribe en el código, entra por `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`).

## Resumen

GA4 vía Firebase Analytics (`firebase` 12.19.0, ya instalado) en las páginas públicas, para uso exclusivo del dueño (decisiones de producto). Cuenta visitas con y sin sesión, por red social, con eventos de producto. Cero lecturas/escrituras Firestore por visita. Aviso de consentimiento (Consent Mode v2). Además se endurece lo que ya escribe por visita (`/api/sites/[id]/track`) según la spec.

## Hechos verificados que condicionan el diseño

- No hay ningún código de Analytics hoy; solo `measurementId` en `infraestructure/firebase/config/client/firebase.ts`.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` en prod viene del secreto `firebaseMeasurementId` con disponibilidad BUILD+RUNTIME (`apphosting.production.yaml:77`). Develop NO lo declara en `apphosting.yaml` (se inyecta fuera, según el runbook): **verificar** que develop tenga valor y cuál.
- El service worker (`public/sw.js`) solo intercepta mismo origen e imágenes de hosts conocidos; las peticiones a Google (gtag/collect) pasan sin tocarse. La CSP solo afecta a `/sw.js`. Ninguno bloquea GA.
- `app/layout.tsx` ya monta `AuthProvider` y componentes cliente bajo `Suspense`; ahí entra el nuevo proveedor. `useAuth()` (`app/store/auth/AuthContext`) da el usuario para `login_state`.
- Páginas públicas van por CDN/SW: el `page_view` tiene que salir del cliente (ya es el plan).
- Puntos de clic existentes: `BookingButton.tsx` (WhatsApp/reserva), `SiteDetailContainer.tsx` (Google Maps), `SocialShareBar.tsx`, `FeaturedEventCard.tsx`, `ShareProfileButton.tsx` (compartir), `EventDetailActions.tsx` + `HeartLikeButton` (like).

## Decisiones de arquitectura

1. **Lógica pura aparte de la UI** (`app/lib/analytics/`): `isTrackablePath`, nombres/params de eventos tipados, saneado de parámetros (lista permitida; nunca uid, email, nombre). Probable con `node:test` sin DOM.
2. **Carga diferida:** el SDK se importa dinámicamente (`import("firebase/analytics")`) tras idle/primera interacción, para no empeorar Lighthouse (ya optimizado el 2026-10).
3. **Consent Mode v2:** por defecto `denied`; con aceptación pasa a `granted`. Sin aceptar solo llegan pings sin cookies. **T0 verifica que el SDK 12.19 lo permita** (`setConsent` / orden respecto al primer `config`); si no, plan B: no inicializar hasta aceptar (se pierde el conteo base sin consentimiento; se documenta).
4. **Sin envío en rutas privadas** (`/studio`, `/mis-*`, `/profile`, `/sites`, `/eventos/create`, `/eventos/:id/edit`, `/eventos/:id/sessions`).
5. **`login_state`** (`anon` | `logged_in`) como propiedad de usuario; sin identificadores. Requiere registrar la dimensión personalizada en la consola GA4 (clic del usuario; guía en T7).
6. **`page_view` manual** en cada cambio de ruta (App Router no recarga); `send_page_view` automático desactivado para no duplicar.
7. **Fallos silenciosos:** todo con try/catch; si no hay `measurementId`, bloqueador de anuncios o `isSupported()` falso → no-op, nunca rompe la página.

## Fases

- **Fase 0 — Verificar (T0):** API/consentimiento del SDK, IDs de develop/prod.
- **Fase 1 — Núcleo (T1–T3):** helpers puros → cliente de analytics → proveedor con `page_view` y `login_state`. *Checkpoint 1: visita anónima aparece en Tiempo real de GA4 (develop).*
- **Fase 2 — Consentimiento (T4):** aviso accesible + enlace para cambiar la decisión. Aquí aplican las skills de UI. *Checkpoint 2.*
- **Fase 3 — Eventos de producto (T5a, T5b):** ver ficha, clics, compartir, like, inscripción. *Checkpoint 3.*
- **Fase 4 — Protección de abuso de lo existente (T6a):** tope global + una visita por navegador/día + comprobación same-origin en `/api/sites/[id]/track`. Opcionales con permiso: **T6b** lectura de `recordEventView`, **T6c** `maxInstances`.
- **Fase 5 — Documentación y revisión (T7, T8).**
- **Fase 6 — Ship (T9):** solo con orden explícita; verificación en GA4 con el ID real.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Consent Mode no se comporta como se espera en el SDK de Firebase | Alto | T0 lo prueba antes de construir; plan B documentado |
| Bloqueadores de anuncios y quien rechaza cookies no se cuentan | Medio | Es límite aceptado; se documenta que GA4 subestima |
| Más JS empeora Lighthouse/LCP | Medio | Import dinámico tras idle; medir antes/después en T8 |
| Navegadores internos (Facebook/Instagram) quitan el referrer | Medio | Enlaces propios con UTM (docs/28); la guía de T7 incluye plantilla de enlaces |
| `useSearchParams` sin `Suspense` rompe prerender (Cache Components) | Alto | Proveedor siempre bajo `<Suspense fallback={null}>` en layout |
| Tus propias visitas contaminan los datos | Bajo | Filtro de tráfico interno en GA4 (guía en T7) |
| Datos de develop mezclados con prod | Medio | T0 confirma ID distinto por entorno; si es el mismo, usar flujo/propiedad aparte |
| Parámetros con datos personales | Alto | Lista permitida + test que rechaza `uid`/`email`/texto libre |

## Respuestas del usuario (2026-11-05 15:22)

- Sí tiene política de privacidad: `app/(home)/privacidad/page.tsx` (y `/terminos`). **Hallazgo:** su sección "Cookies" dice hoy "No usamos cookies de publicidad ni de seguimiento de terceros", y `LEGAL_VERSION = "2026-10-15"` (`app/lib/legal/version.ts`). Agregar GA4 la vuelve inexacta → nueva tarea **T4b** (actualizar texto + decidir si se sube `LEGAL_VERSION`). El texto legal final lo aprueba el usuario.
- NO excluir sus propias visitas (sin filtro de tráfico interno; se quita de T7).
- Autoriza T6b (lecturas de `recordEventView`) y T6c (`maxInstances`), **con la condición de no gastar más dinero**: `maxInstances` es un techo, no sube el costo; el costo SUBIRÍA con `minInstances` > 0 (no se toca; sigue en 0). Valor del techo se confirma con él antes de aplicar (T6c).
- Pendiente: ¿develop tiene su propio measurementId? (T0 lo averigua).
