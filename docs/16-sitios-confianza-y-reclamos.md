# 16. Sitios: confianza y reclamos de propiedad

Estado: implementado (reclamo + script manual). Panel de moderación: pendiente. No es asesoría legal; los puntos de la sección "Qué debe revisar un abogado" son para llevarlos a uno.

## Estados de una ficha

Definidos en `domain/entities/sites/value-objects/SiteListing.ts`.

| `verification` | Significa | Cómo se llega |
|---|---|---|
| `community` | Nadie con vínculo con el lugar respalda la ficha (`publishedAs: proposer` o `qhpa`). | Publicación inicial como proponente / cuenta admin. |
| `claimed` | Quien la publicó declara ser dueño o representante; QHPA no revisó nada. | Publicación inicial con `publishedAs: owner`. |
| `verified` | QHPA revisó la evidencia de un reclamo y lo aprobó. | SOLO aprobando un reclamo con el script. Nunca desde un formulario. |

`kind` (`public` | `business`) solo cambia la copia del botón: "Reclamar este lugar" (business) o "Soy el administrador" (public, p. ej. un mirador con operador).

## Flujo del reclamo

1. En el detalle del sitio, `SiteClaimCta` aparece si `verification !== 'verified'` y la sesión no es la autora. Sin sesión lleva a `/login?redirect_to=<ruta>`.
2. Desde el diálogo (escritorio) o drawer (móvil) la persona elige relación (`owner`, `legal_representative`, `authorized`), teléfono opcional y texto de evidencia (10 a 800 caracteres), y marca la declaración.
3. `requestSiteClaimAction` toma uid/nombre/email del token (nunca del cliente), valida con valibot (`application/dto/siteClaim/SiteClaimDto.ts`) y aplica reglas puras (`claimRuleError`): sitio existe y está publicado; no eres su autor; un reclamo pendiente por usuario y sitio; máximo 5 pendientes por usuario.
4. Se crea `siteClaims/{id}` con `status: 'pending'`, `declaration: true`, `termsVersion` (LEGAL_VERSION) y `createdAt`. La colección solo la escribe el Admin SDK (las reglas de Firestore niegan todo lo no listado).
5. La UI muestra "Reclamo enviado, lo revisaremos" (lectura sin caché por server action). No se prometen plazos.

Límite conocido: la comprobación "ya hay un pendiente" no es atómica; dos envíos simultáneos podrían duplicar. Al aprobar uno, el script rechaza los demás pendientes del mismo sitio.

## Sugerencias de cambio

Cualquier usuario con sesión, salvo el autor de la ficha (que la edita directo), puede pulsar "Sugerir un cambio" en el detalle de un sitio publicado. Es el camino para corregir fichas comunitarias sin ser su dueño.

- Flujo: formulario (campo: horario, dirección, contacto, precios, acceso, cerró, otro; descripción 10-600; fuente opcional ≤300; declaración) -> acción `suggestSiteChangeAction` -> colección `siteSuggestions` (solo Admin SDK; `firebase/firestore.rules` niega todo lo no listado) con `status: pending`. Autor y nombre salen del token, nunca del cliente.
- Reglas (`domain/entities/siteSuggestion/SiteSuggestion.ts`): sesión obligatoria, sitio existente y publicado, no ser el autor, 1 pendiente por usuario+sitio+campo, máximo 10 pendientes por usuario. No hay rate limiting adicional (el repo no tiene helper); las reglas anteriores son el único freno.
- Nunca se aplica solo: la sugerencia no toca el sitio.
- Revisar: `pnpm exec tsx scripts/list-site-suggestions.ts` lista pendientes con sitio (nombre, id, slug, URL local `/donde-ir/<slug>`). El administrador edita la ficha aparte y marca el estado:
  `pnpm exec tsx scripts/list-site-suggestions.ts --resolve <id> --status applied|rejected [--note "..."] --apply` (sin `--apply` es dry-run; guarda `resolvedAt`, `resolvedBy`, `resolutionNote`).
- Límites: no se avisa al sugeridor del resultado; en sitios `verified` la revisa hoy solo el administrador de QHPA (pendiente notificar al dueño verificado); mientras haya una pendiente en el sitio la UI muestra "Sugerencia enviada" en vez del botón (para otro campo, tras resolverse); no hay panel (pendiente). Texto libre de terceros: no aplicar sin comprobar y no copiar datos personales.

## Operación (dry-run por defecto)

```bash
pnpm exec tsx scripts/list-site-claims.ts                                   # lista pendientes
pnpm exec tsx scripts/list-site-claims.ts --approve <id>                    # muestra el cambio
pnpm exec tsx scripts/list-site-claims.ts --approve <id> --apply            # aplica
pnpm exec tsx scripts/list-site-claims.ts --reject <id> --reason "..." --apply
```

Aprobar (una sola transacción):
- reclamo: `approved`, `reviewedAt/By`, y `previousSite` con `author`, `verification` y `publishedAs` anteriores;
- sitio: `verification: 'verified'`, `publishedAs: 'owner'`, `author = { id, displayName, photoURL }` del perfil del reclamante;
- otros reclamos pendientes del sitio: `rejected` con motivo "Otro reclamo aprobado".

Rechazar: `rejected` + `rejectionReason`. Hoy no se notifica a la persona; ella solo vuelve a ver el botón (puede reintentar con mejor evidencia).

## Qué evidencia pedir (guía práctica)

Pide siempre al menos DOS señales independientes; una sola es débil.
- Llamar al teléfono público del negocio (el de Google Maps/Instagram, no el que da el reclamante) y pedir que confirmen quién administra la ficha.
- Que escriban desde el Instagram/Facebook oficial del negocio (o que lo pongan en la bio un código que tú indiques).
- Correo con dominio del negocio, si lo tiene.
- Cámara de Comercio o RUT: basta con verificar nombre y NIT; pide mostrarlo, no que lo suban. Para fincas/lugares sin empresa, un recibo o contrato de arrendamiento o una carta del dueño con teléfono.
- Representante o autorizado: carta de autorización del dueño, y además contactar al dueño.
- Desconfía de: reclamantes con cuenta nueva, evidencia que solo es un enlace sin acceso comprobable, presión por urgencia, correos genéricos que no coinciden con el negocio.

## Qué pasa con la autoría al aprobar (decisión y riesgos)

Se transfiere `site.author` para que el dueño edite desde Studio / Mis sitios. Revisado:
- `author.id` se usa en `findByAuthorId`, `findDetailsByAuthorId`, `isOwner/assertOwner`, el Studio, el perfil público (`profile-sites-<uid>`) y las reglas de lectura de Firestore; todo sigue el campo, así que el cambio es consistente.
- El perfil del autor anterior (tu cuenta admin) deja de listar el sitio.
- La declaración de contenido (`contentDeclarations/site_<id>`) sigue a nombre del autor anterior; el nuevo dueño declara de nuevo en su primera edición (la edición exige declaración).
- Estudio de sitios exige Premium (`isStudioSiteOwner`); un dueño sin Premium puede no poder editar desde el Studio. Verifícalo antes de aprobar o acuerda con él.
- Eventos ya vinculados al sitio (`siteId`) no cambian de autor.

### Cachés (limitación)

El script corre fuera de Next, no puede llamar `updateTag`/`revalidateTag` (`app/actions/sites/_revalidate.ts`). Tras aprobar, estas lecturas cacheadas quedan viejas hasta que venza su TTL: detalle `site-<id>` (horas), tarjetas `site-<id>` en donde-ir/home (semanas), listados `site-list` (días), Studio `sites-<uid>` y perfil `profile-sites-<uid>` de ambos usuarios (minutos). Opciones: esperar el TTL, que el nuevo dueño guarde una edición (eso sí invalida `site-<id>`, `explore`, `site-list`), o un redeploy. Mejora futura: un endpoint/acción admin que llame `revalidateSite` para el sitio y los dos uids.

## Cómo se revierte

No hay comando; hacerlo a mano en Firestore con los datos de `siteClaims/{id}.previousSite`: restaurar `author`, `verification`, `publishedAs` del sitio y poner el reclamo en `rejected` con motivo. Considera un `--revert` si se usa con frecuencia.

## Riesgos y qué debe revisar un abogado

- Disputa entre dos reclamantes: hoy gana el primero aprobado y los demás se rechazan automáticamente. Define un procedimiento (plazo de respuesta, quién decide, apelación) y cómo se comunica.
- Datos personales en la evidencia (nombre, teléfono, correo, RUT/NIT de personas naturales): conservar lo mínimo y poco tiempo. Propuesta: tras resolver, borrar `evidence` y `contactPhone` en 90 días y conservar solo estado, fecha y motivo. Falta implementarlo; definir finalidad, base legal y aviso en la política de privacidad (Ley 1581 de 2012 en Colombia).
- No pedir ni almacenar documentos de identidad ni adjuntos; la UI avisa de no adjuntarlos.
- Responsabilidad por una verificación errónea: el distintivo "verificado" implica una revisión; fija en los términos qué significa y que no es garantía del servicio del negocio.
- Declaración falsa: la casilla enuncia consecuencias (retirar contenido y cuenta); confirmar que esas consecuencias están en los Términos.
- Tu cuenta publica fichas de terceros como comunitarias: revisar con el abogado el deber de retirar una ficha a petición de su dueño y el uso de nombre/fotos del negocio.
