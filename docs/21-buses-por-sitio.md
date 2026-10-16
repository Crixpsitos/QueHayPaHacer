# 21 · Buses que llegan al sitio

Los datos de bus los dicen las personas, a mano y eligiendo de una lista. No hay feed GTFS ni datos abiertos de rutas de Ibagué, y no se calcula nada geográfico.

## Modelo

- **Catálogo** (`appConfig/transit-routes`): `{ routes: { id, label, operator?, changedAt? }[] }`. `id` `^[A-Za-z0-9-]{1,10}$` único, `label` ≤ 40, ≤ 120 rutas. `changedAt` (ms) = "esta ruta cambió". Servicio `TransitRouteService`; lectura pública cacheada (`use cache`, días, etiqueta `config-transit`). Solo es una lista de números/nombres: **sin trazado**.
- **Siembra**: `scripts/seed-transit-routes.ts` (dry-run, `--apply`, no pisa). Cada ruta lleva su fuente pública en un comentario; debe revisarla una persona de Ibagué antes de usarse.
- **Sitio** (`transit` en el doc del sitio): `{ routes: { id, note? }[], updatedAt }`. `note` ≤ 120, máx. 8 rutas. `updatedAt` (ms) lo fija el servidor.
- **Reportes** (`siteTransitReports`, doc `${siteId}_${uid}`, solo Admin SDK): `{ siteId, uid, at }`.

## Reglas de seguridad de datos

1. Solo rutas del catálogo (no hay texto libre de rutas). Al guardar, el servidor (`SiteTransitService.resolveForSave`) valida contra el catálogo **vigente**, descarta ids desconocidos y duplicados, recorta notas y fija `updatedAt`. Si el autor no cambió el bloque, conserva su `updatedAt`.
2. Siempre "Informado por el dueño · hace X". Nunca hay sello de verificado.
3. "Está desactualizado": requiere sesión, una vez por persona y sitio (hasta que el dueño reconfirme), no disponible para el autor, solo sitios públicos con buses.
4. **Por confirmar** (calculado al leer, sin migraciones): ≥ 3 reportes de personas distintas posteriores a `transit.updatedAt`, o alguna ruta del sitio con `changedAt > transit.updatedAt`. Se atenúa, se explica y deja de ofrecerse como bus en "¿Cómo llego?". Reconfirmar (guardar con cambios) lo limpia. Al llegar a 3 reportes se avisa al autor (`transit_outdated`, un aviso por versión del bloque).
5. Lectura cacheada de estado: `cacheLife("minutes")`, etiquetas `site-<id>` y `config-transit`.

## Interfaz

- Formulario: sección "Cómo llegar en bus" (chips ≥ 44 px, nota por ruta con contador). Catálogo vacío: "Aún no hay rutas cargadas."
- Detalle público y modal: sección "Buses". **Decisión**: sin dato la sección se omite (a los visitantes les sobra un bloque vacío).
- "¿Cómo llego?": opción "Bus" con las rutas, sin minutos, si hay buses, la distancia por calle > 1 km y el estado no es "por confirmar".

## Límites

Sin trazado ni "pasa a menos de X m" (el modelo queda listo para añadirlo), sin horarios, sin tiempos de bus, y depende de la participación de los autores y de los reportes. Sugerencias de visitantes con tipo "Buses": fase posterior.
