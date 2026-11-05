# Spec: Secciones desplegables en fichas de sitios (punto 4)

## Objective
La ficha de la Cascada La Plata tiene una descripción de 5.194 caracteres (~4 min de lectura, 8.463 px en móvil). Casi todo es dato de consulta (qué incluye, cómo llegar, qué llevar, planes, fuentes). Meta: la descripción vuelve a ser un pitch corto y el resto vive en **secciones con título que se abren y cierran** (acordeón), cerradas por defecto.
Usuario final: visitante de `/donde-ir/<slug>` en celular. Dueño: el usuario (carga por script en prod).
Diseño origen: `future-features-backlog` (memoria), campo `sections: { title, body }[]`.

## Assumptions
1. Versión **recortada** (acordada en memoria 2026-11-01): `sections` en modelo + validación + ficha de detalle + carga por script. SIN formulario de edición (`SiteFormDrawer` tiene 1.157 líneas) y SIN tarjetas `facts` ni etiquetas (van aparte).
2. Campo **opcional**: sitios existentes sin `sections` se ven idénticos a hoy.
3. Texto plano (no HTML/markdown), `whitespace-pre-line` como la descripción hoy. Emojis dentro del texto permitidos; sin iconos por sección (YAGNI, `icon?` queda fuera).
4. Componente Accordion de shadcn sobre `radix-ui` (ya instalado, incluye Accordion). Falta generar `app/components/ui/accordion.tsx`.
5. Varias secciones pueden estar abiertas a la vez (`type="multiple"`), todas cerradas al cargar.
6. Los textos de las secciones NO alimentan `og:description` ni SEO de listados (siguen usando `description`). Contenido cerrado queda en el HTML (Radix lo renderiza `hidden`), así que sigue indexable.
7. `DetailModal.tsx` (modal viejo en listados) no se toca: solo la página de detalle `SiteDetailContainer`.
8. Tests: `pnpm test` (tsx --test), `pnpm typecheck`, `pnpm build`. Rama `develop`.

## Commands
- Test: `pnpm test`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Dev: `NODE_OPTIONS=--dns-result-order=ipv4first pnpm dev` (si 404 masivo: `rm -rf .next/dev`)

## Project Structure (archivos a tocar, ~7)
- `app/components/ui/accordion.tsx` — nuevo (shadcn)
- `application/dto/sites/SiteDto.ts` — `sections` opcional en `fields`: máx. 12 secciones, título ≤ 60, cuerpo ≤ 3000, total ≤ 8000 caracteres; trim; sin secciones vacías
- `infraestructure/firebase/dto/sites/FirebaseSiteDto.ts` — `sections?: SiteSection[]`
- `infraestructure/firebase/mappers/sites/SiteFirebaseMapper.ts` — `toViewModel` (normaliza `undefined`→`[]`) y `toDto` (no pierde el campo al re-guardar un sitio)
- view-model del sitio (el que usa `SiteDetailContainer`) — `sections: SiteSection[]`
- `app/actions/sites/buildSiteInput.ts` — pasar `sections` (y preservarlas al editar con el form que no las conoce)
- `presentation/sites/components/detail/SiteDetailContainer.tsx` — bloque acordeón tras "Sobre este lugar"
- Tipo `SiteSection` + normalizador puro en `domain/entities/sites/` (patrón de `normalizeRecommendations`), con test

## Code Style
Patrón existente: normalizadores puros con test (`siteCompleteness.test.ts`), validación valibot con `text(max, label)`, Tailwind con tokens del proyecto, sin colores crudos. Referencia: `normalizeRecommendations`/`RecommendationsSection`.

## UI (design contract)
- Trabajo del bloque: consultar un dato en 5 s sin leer 4 minutos. Acción primaria de la página no cambia.
- Estructura: `<h2>` "Más información" (sentence case), debajo el acordeón; cada ítem = fila con título (peso medio, 16 px), chevron a la derecha en slot fijo, separadores finos, sin cajas ni sombras (información en superficie, no en cajas).
- Estados: cerrado (default), abierto (chevron gira; motion 150–200 ms, respeta `prefers-reduced-motion`), foco visible por teclado, objetivo táctil ≥ 44 px de alto, sin `sections` → el bloque no se renderiza (sin vacío).
- Accesibilidad: Radix da `aria-expanded`/`aria-controls`, Enter/Espacio, flechas ↑↓. Contraste del texto igual al de la descripción.
- Verificar a 320, 390, 768, 1024, 1440 px. Rechazar: tarjetas por sección, gradientes, iconos decorativos, numeración (no es secuencia).
- Sin panel "Tweak": la spec no tiene variaciones de diseño reales que alternar (decisión: omitir).

## Testing Strategy
- Unitarios (RED primero): normalizador de secciones (recorta, descarta vacías, tope), esquema valibot (límites, acepta ausente), mapper round-trip (`toDto` conserva `sections`; `toViewModel` pone `[]` si falta).
- Componente: render con 0 secciones = nada; con N = N disparadores cerrados (patrón de tests de componentes del repo si existe; si no, solo lógica pura + verificación en navegador).
- Navegador (Playwright local contra build de prod): abrir/cerrar con clic y teclado, sin errores de consola, capturas a 390 px.

## Boundaries
- Always: TDD, un commit por tarea, `develop` solo, tests+typecheck+build antes de cada checkpoint.
- Ask first: `git push origin develop` (dispara rollout de develop), cualquier escritura en Firestore/Storage de prod o develop, tocar `Cascada La Plata` real, índices de Firestore.
- Never: tocar `main`/prod sin orden explícita; migrar sitios existentes; recortar la descripción de la Cascada en prod sin tu texto aprobado; añadir dependencias.

## Success Criteria
1. Sitio sin `sections` → ficha idéntica a hoy.
2. Sitio con `sections` → acordeón cerrado por defecto, abre/cierra con ratón, toque y teclado.
3. Guardar/editar un sitio con el formulario actual NO borra sus `sections`.
4. Valores fuera de límite se rechazan con mensaje claro en español (tú/usted).
5. `pnpm test`, `pnpm typecheck`, `pnpm build` verdes; verificado en navegador a 390 px.
6. Entregable de contenido: borrador del texto reorganizado de la Cascada (pitch ≤ ~1.300 car. + secciones) para que lo apruebes; carga en develop primero por script, prod solo con tu orden.

## Open Questions (necesito tu respuesta)
A. **Alcance:** ¿versión recortada (recomendada: ~7 archivos, formulario después) o completa con editor en el formulario ahora?
B. **Secciones iniciales de la Cascada:** propongo "Qué incluye", "Cómo llegar", "Qué llevar", "Planes y precios", "Datos que no coinciden", "Fuentes". ¿Ajustas la lista?
C. **Abiertas por defecto:** ¿todas cerradas (recomendado) o la primera abierta?
D. **Carga:** ¿ensayo en develop con un sitio de prueba (necesita que me dejes escribir en Firestore develop) o directo a prod después de aprobar el texto?
