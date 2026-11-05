# Spec: image-quality — imágenes de eventos nítidas y bien cacheadas

## Objective
Las fotos de eventos se ven borrosas aunque el original sea bueno (prueba: `~/Documentos/QueHayPaHacer/eventos/alumbrado multicentro/`). Meta: calidad visible alta (el usuario pidió "máxima, ~96%, que se vea buena y con buen caché") sin pesos absurdos.

**Causas raíz (confirmadas leyendo el código):**
1. `compressImage.ts` (functions) usa `maxWidth: 1200`, WebP `quality: 80`, `effort: 4`. Se usa para galería **y** portada. Fotos grandes se reducen a 1200 px.
2. `/_next/image` recomprime en el servidor a **q=75**. En Next 16 `images.qualities` por defecto es `[75]` y `next.config.ts` no lo declara, así que ninguna `quality` mayor se respeta. Resultado: doble pérdida (q80 → q75).
3. Las variantes de `optimizedAndCreateVariants.ts` (desktop q88 / tablet q78 / mobile q72) existen pero el flujo de eventos no las usa para estas imágenes. Revisar si se usan (no asumir).

Caché: los archivos ya salen con `Cache-Control: public, max-age=31536000, immutable` (bien). Mantenerlo.

## Acceptance criteria
1. Una foto original ≥ 2000 px de lado largo se guarda con lado largo ≥ 1920 px (sin ampliar fotos menores).
2. Calidad WebP de salida ≥ 90 para galería y portada; portada usa tamaño/crop sin reducir a 1200.
3. En pantalla no se aplica una segunda compresión visible: o bien `qualities` incluye el valor usado por los componentes (p. ej. `[75, 90, 96]`) y los `<Image>` de evento piden ese `quality`, o bien las imágenes ya optimizadas se sirven con `unoptimized`. Decisión en el plan, con medición.
4. SSIM entre el original redimensionado a la misma escala y la imagen guardada ≥ 0,97 en las 3 fotos de Multicentro, y una comparación visual lado a lado aprobada por el usuario.
5. Peso por imagen reportado (antes/después). Límite orientativo: ≤ 600 KB para 1920 px; si lo supera, subir `effort` o bajar a q92 antes de aceptar. Tabla en el PR.
6. Cache-Control inmutable de 1 año se mantiene en los objetos nuevos; los viejos no se re-procesan salvo orden del usuario.
7. Imágenes ya subidas (viejas, 1200 px) siguen funcionando sin cambios.

## Tech stack
Functions: `sharp` (parche de seguridad ya aplicado), WebP. App: Next.js 16.4 `next/image`, `next.config.ts` `images.qualities`. Medición: `sharp` + SSIM (script temporal en el scratchpad, sin añadir dependencias al repo salvo que se pida).

## Commands
- Functions: `npm run build` · `npm run lint` · `npm test`
- App: `pnpm typecheck` · `pnpm test` · `pnpm build`
- Medición: script temporal en el scratchpad de la sesión que reprocesa las fotos de Multicentro con los parámetros candidatos y calcula SSIM y peso. Se borra al terminar.

## Project structure (archivos previstos)
- `../functions/src/modules/events/helpers/compressImage.ts` — nuevos defaults (ancho, calidad, effort) y opción para portada.
- `../functions/src/triggers/storage/onObjectFinalized.optimizeImages.ts` — pasar opciones distintas a galería vs portada si hace falta.
- `next.config.ts` — `images.qualities`.
- Componentes `Image` de evento (`EventCard`, detalle, carrusel) — `quality` solo donde haga falta, definido en el plan tras medir.

## Code style
Constantes con nombre, sin números mágicos repetidos:

```ts
// ponytail: ajustar tras medir SSIM con las fotos de Multicentro
export const EVENT_IMAGE = {maxWidth: 2400, webp: {quality: 92, effort: 5, smartSubsample: true}} as const;
```

## Testing strategy
- **Unit (functions):** test que genera una imagen sintética grande y comprueba dimensiones de salida, que no amplía imágenes pequeñas y que el formato es WebP. Corre con `npm test` (ampliar el glob).
- **Medición real:** script SSIM/peso con las 3 fotos de Multicentro, resultados en tabla.
- **Visual:** pegar original vs nuevo lado a lado (herramienta Read sobre ambos) y que el usuario confirme.
- **App:** `pnpm build` y revisar en `/_next/image?...&q=<nuevo>` que responde 200 (no 400) tras cambiar `qualities`.

## Boundaries
- Always: medir antes y después; reportar pesos; mantener `immutable` de 1 año; compatibilidad con imágenes viejas.
- Ask first: re-procesar eventos existentes en prod, cambiar `qualities` (afecta todo el sitio), cambios de tamaño de variantes, añadir una librería SSIM al repo.
- Never: subir a q100 sin medir (peso/LCP), ampliar imágenes pequeñas, borrar originales, desplegar a prod sin orden.

## Success criteria
Criterios 1-7 cumplidos con números reales; usuario aprueba la comparación visual; ninguna imagen existente se rompe; LCP de la página de evento sin empeorar más de un margen acordado (medir con `webperf` skill si se toca portada).

## Open questions
Resueltas el 2026-11-05: techo ≤ 600 KB a 1920 px (aprobado); calidad: q90-92 validada con SSIM (el 96 literal sube el peso sin mejora visible; el usuario pidió "que se vea buena", se mide en vez de fijar el número).
Decisión recomendada sobre re-procesar (el usuario no sabía): **solo imágenes nuevas** en este módulo. Los originales `deoptimized-*` siguen en Storage, así que más adelante se puede hacer un script con dry-run para los pocos eventos reales (Multicentro, Candlelight) si te gusta el resultado. No se hace masivo.

Abierta:
1. ¿Se usan las variantes `optimizedAndCreateVariants` en eventos hoy? Verificar antes del plan.
