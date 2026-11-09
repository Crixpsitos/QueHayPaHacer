# 30 · Conteo propio de visitas y acciones (analytics-v2)

Estado: **BORRADOR para revisión del dueño y de un abogado.** No cambia `/privacidad` ni `LEGAL_VERSION` hasta que se apruebe.
Spec: `SPEC-analytics-v2.md` · Plan: `tasks/plan-analytics-v2.md`.

## Qué se cuenta (y qué no)

Cuando alguien abre la ficha pública de un evento o de un sitio, o toca una acción (cómo llegar, compartir, registro externo), la app suma **1 a un contador**. Eso permite que cada organizador vea cuántas personas vieron su evento, cuántas actuaron y de dónde llegaron.

Lo que se guarda, por día (hora de Bogotá) y por evento/sitio:

- Cuántas vistas y cuántas acciones, por tipo.
- De dónde llegaron, en una **lista cerrada**: Instagram, Facebook, TikTok, WhatsApp, Google, directo, otro, o un enlace de campaña.

Lo que **no** se guarda en los contadores: IP, navegador (user agent), identificador de usuario, correo, nombre, ubicación ni texto de búsqueda. Los contadores son números sin relación con una persona.

## Cómo se evita contar dos veces

- El navegador recuerda (en el propio dispositivo) que ya contó esa ficha hoy, y no vuelve a enviar.
- El servidor, en memoria y sin guardarlo, usa un código irreversible (SHA-256 de IP + navegador + una sal aleatoria que se pierde al reiniciar) para descartar repetidos de 24 horas. Ese código **no se escribe en la base de datos** ni se puede revertir a la IP.

## Cookies y consentimiento

Este conteo propio **no usa cookies ni identificadores persistentes**. Solo usa el almacenamiento local del navegador para recordar «ya conté esta ficha hoy» y, durante la sesión, el origen de la visita. Google Analytics (ya descrito en `/privacidad`) sigue dependiendo del aviso de cookies y no se alimenta de estos contadores.

## Cambios de significado para el equipo

- Antes, la vista de un evento solo se contaba si la persona tenía sesión y **una sola vez para siempre**. Ahora cuenta a cualquier visitante, **una vez por persona y día**. `analytics.views` de eventos va a subir por este cambio, no necesariamente por más interés real.
- El orden de las listas **no cambia** con este módulo; se evaluará por separado (módulo `ranking-v2`, modo sombra).

## Efectos conocidos (revisión de Fase 1, pendientes de decisión)

1. **Cada vista aceptada dispara la cadena de Cloud Functions de `events/{id}`.** `analytics.views` está en `SCORE_RELEVANT_FIELDS` (`../functions`); `recalculateScoreAnalitycs` reescribe `analytics.score`, `updatedAt` y `_meiliNeedsSync`, y `notifyChanges`/`cleanupOldMediaFiles` se vuelven a disparar. Efecto: más invocaciones y el `lastmod` del sitemap cambia con las visitas. Antes solo ocurría en la primera vista de cada persona con sesión. Arreglo propuesto (repo `functions`, requiere orden de despliegue): no escribir `updatedAt` en ese trigger cuando solo cambió `analytics.*`, y/o recalcular el score solo si el cambio es material.
2. **Se perdió la señal "vio el evento" de las personas con sesión.** El `recordEventView` viejo escribía `users/{uid}/eventInteractions/{id}.viewedAt`, que `calculateDelta` usa para aprender preferencias de categoría. Opción propuesta: que `/api/events/[id]/viewer` (ya exige sesión) escriba solo ese documento de interacción la primera vez, sin tocar el contador.
3. **Techo conocido del conteo anónimo.** La IP sale de la primera entrada de `X-Forwarded-For` (falsificable), así que el tope por IP y el dedupe se pueden evadir con un script; el techo real es el tope global de 120 aceptadas/min por instancia × `maxInstances` 5 (≈ US$3/día en el peor caso sostenido, cifra de la spec sin verificar contra la factura). Un atacante también puede inflar `views` de un evento y, con ello, su puntaje. Por eso `ranking-v2` va en modo sombra y no cambia el orden visible. Pendiente: confirmar en prod qué entradas agrega el frente de Google y usar la correcta.
4. **Detrás de CGNAT** (operadores móviles) varias personas con el mismo navegador cuentan como una por evento y día: el conteo subestima.
5. `bySource` suma vistas y acciones juntas (igual que en sitios): no dividir clics entre `bySource`.

## Texto propuesto para `/privacidad` (para revisar)

> **Contadores de uso.** Para saber si una página funciona, contamos cuántas veces se ve cada evento y cada lugar y qué acciones se hacen (cómo llegar, compartir, ir al sitio del organizador), agrupadas por día y por procedencia general (por ejemplo, Instagram o Google). Estos contadores son números agregados: no guardan tu dirección IP, tu navegador, tu nombre ni tu cuenta, y no sirven para identificarte. Para no contar dos veces la misma visita, tu navegador guarda localmente una marca del día.

## Pendiente de decisión

- Aprobar o ajustar el texto anterior (y revisión legal, Ley 1581 de 2012).
- Decidir si, al aprobarlo, se sube `LEGAL_VERSION` (hoy solo se muestra como fecha y no obliga a re-aceptar).
