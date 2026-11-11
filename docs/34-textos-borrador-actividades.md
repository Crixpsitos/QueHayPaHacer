# Textos BORRADOR de actividades (pendientes de revisión del dueño)

Estado: **borrador escrito por Claude el 2026-11-11**. Están en develop; antes de producción el dueño debe aprobarlos o corregirlos (la regla de fundamento de B4 pide texto propio, no de plantilla).

## Dónde viven
- Landings (`/actividades-*-ibague`): `presentation/activities/lib/activityCollections.ts` (campo `intro`, 2 párrafos por colección). Se indexan solo con ≥160 caracteres de texto y ≥3 actividades públicas (`domain/entities/activities/collectionRule.ts`); si no, `noindex` y fuera del sitemap.
- Página pilar `/cosas-para-hacer-en-ibague`: `app/cosas-para-hacer-en-ibague/page.tsx` (dos párrafos que explican eventos / actividades / sitios).

## Qué revisar al aprobar
1. Que los ejemplos citados existan de verdad en Ibagué cuando salga a producción (cañón del Combeima, mercados campesinos, etc.).
2. Que el tono sea el de la marca (tú, sin voseo).
3. Quitar o ajustar afirmaciones que dependan de datos reales («casi todas aceptan gente nueva»).
4. Qué colecciones quedan: hoy (6 colecciones iniciales: hoy, fin de semana, gratis, aire libre, en familia, deporte y bienestar).

Cuando estén aprobados, borrar la palabra «BORRADOR» de los comentarios de los dos archivos.
