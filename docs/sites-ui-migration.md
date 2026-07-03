# Migración UI — Módulo "Mis Sitios" (v0.dev → QueHayPaHacer)

> Doc vivo. Origen: proyecto v0.dev en `~/Descargas/diseno-de-sitio-web`.
> Objetivo: replicar la UI en este repo **adaptándola a la arquitectura DDD existente**
> (`domain/entities/sites`, `infraestructure/firebase/...`), no copiar tal cual.
> Última actualización: 2026-07-01.

## 1. Qué es

Módulo de gestión de "Mis sitios" (puntos de interés en Ibagué): mapa persistente a la
izquierda + panel intercambiable a la derecha (lista ↔ formulario) + modal de detalle
estilo Airbnb. El usuario crea/edita sitios que pasan por moderación.

Layout general (`app/page.tsx` → `SitesModule`):

```
┌───────────────────────────┬──────────────────────┐
│                           │  Panel (420–480px)   │
│   Mapa MapLibre           │  ┌────────────────┐  │
│   (persistente,           │  │ list  ↔  form  │  │  ← AnimatePresence
│    flex-1)                │  │ (motion slide) │  │
│                           │  └────────────────┘  │
└───────────────────────────┴──────────────────────┘
   + DetailModal (overlay, estilo Airbnb bento grid)
```

Responsive: en `<lg` el mapa pasa arriba (`h-[38vh]`) y el panel abajo, en columna.

## 2. Stack (coincide con nuestro repo ✅)

| Dep | v0 | Nuestro repo | Nota |
|-----|-----|--------------|------|
| next | 16.2.6 | ^16.2.4 | ⚠️ Ver `node_modules/next/dist/docs/` antes de tocar routing/config |
| react | 19 | 19.2.4 | ok |
| tailwindcss | ^4.2.0 | ^4 | ok (config vía `@theme` en CSS, no `tailwind.config`) |
| motion | ^12.42 | ^12.38 | `import { motion } from "motion/react"` |
| maplibre-gl + react-map-gl | 5.24 / 8.1 | 5.24 | mismo |
| swr | ^2.4.2 | (verificar) | usado para `getMySites` |

Extra en v0 no confirmado en repo: `@base-ui/react`, `class-variance-authority`,
`shadcn`, `lucide-react`, `tw-animate-css`. **Verificar antes de importar.**

## 3. Design tokens (globals.css)

Sistema shadcn-style con variables semánticas. **Usa siempre los tokens, no hex sueltos.**

- `--primary: #6366f1` (indigo) / `--primary-foreground: #fff`
- `--accent: #eef2ff` / `--accent-foreground: #4338ca` (chips activos, badges suaves)
- `--muted: #f8fafc` / `--muted-foreground: #64748b`
- `--destructive: #ef4444`, `--success: #10b981`, `--warning: #f59e0b`
- `--border: #e2e8f0`, `--ring: #6366f1`, `--radius: 0.75rem`
- Dark mode definido (`.dark`) — indigo pasa a `#3b82f6`.

⚠️ **Nota anti-regresión:** este diseño NO usa `brand-violet` (el token roto que teníamos).
Todo va por `bg-primary text-primary-foreground`. Mantener esa convención al portar.

### Colores de estado (`lib/sites/constants.ts` → `STATUS_COLORS`)
Estado derivado = publicación + moderación (`getDisplayStatus`):

| Estado | label | hex | uso |
|--------|-------|-----|-----|
| approved | Aprobado | `#10b981` | verde |
| pending | En revisión | `#f59e0b` | ámbar |
| rejected | Rechazado | `#ef4444` | rojo |
| draft | Borrador | `#94a3b8` | gris |

## 4. Inventario de componentes

| Archivo v0 | Rol | Notas de migración |
|------------|-----|--------------------|
| `app/page.tsx` | Entry | Trivial. En nuestro repo será una route/segment. |
| `components/sites-module.tsx` | Orquestador (estado global del módulo, SWR, modos list/create/edit) | Núcleo. Mantiene sincronía mapa↔panel (hover, select, focus/flyTo). |
| `components/sites/list-panel.tsx` | Panel lista: header, buscador, tabs de filtro, paginación, empty/loading states | Presentacional. |
| `components/sites/site-card.tsx` | Card de sitio (thumbnail, badge estado, métricas, CTA contextual, motivo rechazo) | Presentacional + `motion` layout. |
| `components/sites/detail-modal.tsx` | Modal detalle (bento grid de media, métricas, horario, autor) | Portal/overlay, esc-to-close, lock scroll. |
| `components/sites/sites-map.tsx` | Mapa MapLibre. Modo `browse` (markers) / `pick` (pin arrastrable + reverse geocode) | Cliente. `flyTo` on focus. |
| `components/sites/site-marker.tsx` | Pines del mapa (`SiteMarkerPin`, `PickMarkerPin`) | Presentacional. |
| `components/site-creator/form-drawer.tsx` | Contenedor del formulario (4 secciones + footer sticky + overlay éxito) | Presentacional. |
| `components/site-creator/sections/*.tsx` | location / basic-info / media / schedule | 4 secciones del form. |
| `components/site-creator/map-search.tsx` | Buscador flotante (geocoding Photon) | — |
| `components/site-creator/ui-bits.tsx` | Helpers UI | — |
| `components/ui/*` | Primitivos shadcn (button, input, select, badge…) | Ver si ya existen en nuestro repo antes de duplicar. |
| `hooks/use-site-form.ts` | Estado + lógica del form (validación, media cover, schedule, submit) | Lógica cliente. Reutilizable casi tal cual. |

## 5. Capa de datos / dominio — EL PUNTO CLAVE DE LA MIGRACIÓN

v0 define su propio modelo en `lib/sites/types.ts` (`Site`, `SiteFormViewModel`,
`SiteListItem`, etc.) y un `lib/sites/repository.ts` con **stubs `TODO` que devuelven mock**.

Nuestro repo YA tiene el dominio DDD real:
- `domain/entities/sites/Site.ts` + `value-objects/*` (Coordinates, SiteCategory,
  SiteMedia, SiteAnalytics, SiteModerationStatus, SiteAuthor, Schedule, ImageMedia,
  VideoMedia, SitePublicationStatus, SiteLocation)
- `infraestructure/firebase/dto/sites/FirebaseSiteDto.ts`
- `infraestructure/firebase/repositories/sites/ISitesFirebaseRepository.ts`

**Decisión de migración:**
1. NO copiar `lib/sites/types.ts` tal cual → mapear al dominio DDD existente.
2. Reemplazar `lib/sites/repository.ts` (mock) por la implementación Firebase real
   detrás de `ISitesFirebaseRepository`.
3. Conservar los **ViewModels de UI** (`SiteListItem`, `SiteFormViewModel`) como capa
   de presentación, con mappers dominio→VM (equivalente a `lib/sites/mapper.ts`).
4. `getMySites` (mock + `setTimeout`) → query real de sitios del usuario.

Contratos a respetar del repo mock (para no romper la UI):
- `getMySites(): Promise<Site[]>`
- `getSiteById(id): Promise<Site | null>`
- `createSiteDraft(form): Promise<void>`
- `publishSite(form): Promise<void>`
- `uploadMedia(file): Promise<{ url, markerUrl, width, height, ... }>`

## 6. Dependencias externas / servicios

- **Geocoding:** Photon (Komoot) `https://photon.komoot.io` — API pública sin auth,
  sesgada a Ibagué (`IBAGUE_CENTER = 4.4389, -75.2322`). Reverse + forward search.
- **Mapa:** MapLibre con estilo en `lib/sites/map-style.ts`.
- **Media upload:** stub (`uploadMedia`) → conectar a nuestro storage (Firebase).

## 7. Plan de portado (orden sugerido)

1. [ ] Confirmar deps faltantes (`@base-ui/react`, `cva`, `swr`, `lucide-react`, `tw-animate-css`).
2. [ ] Portar tokens de `globals.css` (o fusionar con los nuestros) — sin romper temas.
3. [ ] Portar primitivos `components/ui/*` que no existan ya.
4. [ ] Portar componentes presentacionales (card, list-panel, detail-modal, marker, form sections).
5. [ ] Portar `sites-module` + `use-site-form` (lógica cliente).
6. [ ] Sustituir `lib/sites/types` por adaptadores sobre `domain/entities/sites`.
7. [ ] Implementar repository real (Firebase) tras `ISitesFirebaseRepository`.
8. [ ] Conectar geocoding + media upload reales.
9. [ ] QA responsive (mapa arriba en móvil) + dark mode + estados vacíos/carga.

## 8. Decisiones registradas
<!-- Ir anotando aquí cada decisión que tomemos durante el portado -->
- 2026-07-01: Se conserva la separación ViewModel (UI) vs Entity (dominio DDD). La UI de
  v0 trabaja con VMs; el dominio real vive en `domain/entities/sites`.
