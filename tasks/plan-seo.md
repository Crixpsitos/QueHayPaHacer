# Plan: SEO tanda 1 (ver SPEC-seo-growth-1.md)
Orden por valor y riesgo. Un commit por tarea. Archivo aparte: `tasks/plan.md` tiene trabajo de otros.
1. H1 de la home (XS).
2. `buildEventJsonLd` puro + test; EventCard lo usa (sin cambiar salida) (S).
3. JSON-LD `Event` en el detalle + curl local (S).
   Checkpoint A: test+typecheck+build, curl confirma 1-3.
4. Límites del día en Bogotá (puro + test) (XS).
5. Feed "hoy" (repo/servicio/fetcher) + colección `today` + landing + vacío con próximos + caché corta (M). Ojo índices de Firestore: si exige uno nuevo, parar y avisar.
6. Acceso a "Qué hacer hoy" en la home (XS/S).
   Checkpoint B.
7. Sitemap: `explorar`, `contactanos`, sesiones (tras inspeccionar), eventos terminados 90 días, lastModified real; armado puro + test (M).
8. `/sites/[id]` → 308 (XS).
9. Perfiles públicos al sitemap SOLO si el usuario lo aprueba (pregunta abierta).
   Checkpoint C: revisión independiente (code-reviewer), build, curl; luego aviso antes de `git push origin develop`.
