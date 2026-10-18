# Recomendaciones y ficha completa de un sitio

Dos ayudas para que las fichas de sitios sean más útiles. Ninguna es obligatoria: se incentivan, no bloquean guardar ni publicar.

## Recomendaciones

Campo opcional `recommendations` en `sites/{id}`:

```ts
recommendations?: { tips: TipId[]; note?: string }
```

- `tips`: casillas de un catálogo cerrado (`SITE_TIP_OPTIONS`, en `domain/entities/sites/value-objects/SiteRecommendations.ts`): ir temprano, menos gente entre semana, efectivo, agua y protector, calzado cómodo, parqueadero, reservar, niños, mascotas, ropa para la lluvia.
- `note`: texto libre de máximo 140 caracteres.
- `normalizeRecommendations` (misma filosofía que `normalizeOpeningPolicy`) descarta ids desconocidos o repetidos, ordena según el catálogo, recorta la nota y nunca lanza. Se aplica al guardar (`buildSiteInput`) y al leer (`SiteFirebaseMapper.toDetail`); el DTO valibot rechaza ids fuera del catálogo y notas largas.
- Se edita en la sección "Recomendaciones" del formulario. El detalle público y el modal muestran las casillas y la nota; sin datos no pintan nada.

Límite de la edición: el guardado es `set(merge)`. Para poder borrar la nota, `buildSiteInput` siempre envía `note: ""` cuando no hay (al leer, `""` equivale a "sin nota"). Las casillas sí se pueden vaciar (el arreglo se reemplaza completo).

## Medidor de ficha completa

Lógica pura en `domain/entities/sites/siteCompleteness.ts`: lista `COMPLETENESS_RULES` de `{ id, label, hint, done(input) }`. El porcentaje es `reglas cumplidas / reglas totales`, sin total fijo: para sumar una regla se agrega a la lista.

Reglas actuales (8): portada, descripción de al menos 80 caracteres, al menos un día abierto, dirección, festivos indicados, lluvia indicada, redes o enlace de reserva, al menos una recomendación.

- Formulario: barra "Tu ficha está al X %" con las pistas pendientes (`CompletenessMeter` en `SiteFormDrawer`).
- Detalle público y modal: insignia "Ficha completa" junto a las de confianza (`CompleteBadge`), solo al 100 %. Se calcula al vuelo desde el sitio, no se guarda.
- Adaptadores formulario/detalle a la entrada del medidor: `presentation/sites/lib/completeness.ts`. La portada del detalle se infiere de `coverUrl`.

No hay rutas ni acciones nuevas.
