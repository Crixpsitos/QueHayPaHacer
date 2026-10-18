# Stack, tamaño y estado del repositorio

## 1. Identificación

- Nombre del paquete: `quehaypahacer`.
- Versión declarada: `0.1.0`.
- Repositorio privado.
- Remoto: `git@github.com:Crixpsitos/QueHayPaHacer.git`.
- Rama observada: `develop`.
- Commit base observado: `3b2521c`, 2026-09-19.
- Sin tags Git observados.
- Sin archivo de licencia en la raíz.

## 2. Stack efectivo observado

Las versiones efectivas provienen de la resolución de pnpm al 2026-10-10; pueden superar los rangos de `package.json`.

Ejemplos: `firebase` declara `^12.11.0` y resuelve 12.19.0; `firebase-admin` declara `^14.0.0` y resuelve 14.4.0. Desde el **2026-10-10** `@google-cloud/storage` ya no es dependencia directa (resuelve una sola versión, 8.2.0, transitiva vía `firebase-admin`) y `@google-cloud/firestore@^9.2.0` se declara directamente (misma versión que usa `firebase-admin`, deduplicada). Para reproducibilidad manda `pnpm-lock.yaml`, no el mínimo escrito en `package.json`.

| Tecnología | Versión efectiva | Uso |
|---|---:|---|
| Node.js | 22.17.0 | Runtime local observado. |
| pnpm | 12.6.0 | Gestor declarado en `packageManager` (`pnpm@12.6.0`); `engines.node >=22`. |
| Next.js | 16.3.5 | App Router, Server Actions, Route Handlers, cache components. |
| React / React DOM | 19.3.0 | UI y Server Components. |
| TypeScript | 5.9.3 | `strict`, `noEmit`, module resolution bundler. |
| Tailwind CSS | 4.x | Estilos vía CSS/tokens. |
| Firebase Web | 12.19.0 | Auth y Firestore cliente. |
| Firebase Admin | 14.4.0 | Auth, Firestore y Storage servidor. |
| next-firebase-auth-edge | 1.12.1 | Cookies, tokens y proxy de autenticación. |
| Valibot | 1.5.0 | Esquemas/validación de DTOs. |
| React Hook Form | 7.88.0 | Formularios complejos. |
| Zustand | 5.0.15 | Estado cliente puntual. |
| Base UI / Radix UI / shadcn | varias | Primitivos de interfaz. |
| Motion | 12.43.0 | Transiciones y animaciones. |
| MapLibre / react-map-gl | 5.24 / 8.1.3 | Mapas de sitios. |
| TipTap | 3.31.3 | Edición y render de contenido enriquecido. |
| Recharts | 3.10.1 | Gráficos de Studio. |
| tsx | devDependency | Runner de tests y scripts (desde **2026-10-10**). |

`redis` y `@upstash/redis` se eliminaron el **2026-10-10** junto con el cache handler (P0-5).

`eslint-config-next` está en 16.2.2 mientras Next efectivo está en 16.3.5. Deben alinearse para evitar reglas y transformaciones desfasadas.

## 3. Métricas de tamaño

Medición sin `.git`, `node_modules` ni `.next`:

- Archivos: **719**.
- Archivos seguidos por Git: **704**.
- Directorios de primer nivel no ocultos: **8**.
- Tamaño lógico (`du -sb`): **4.865.016 bytes**.
- Tamaño en disco observado (`du -sh`): **7,7 MB**.
- Líneas no vacías TypeScript: **21.337**.
- Líneas no vacías TSX: **34.654**.
- Líneas no vacías JavaScript/MJS: **90**.
- Líneas no vacías CSS: **241**.
- Líneas no vacías Markdown antes de esta documentación: **676**.

Total principal TS + TSX: **55.991 líneas no vacías**. Es una medición rápida, con comentarios incluidos, útil para escala y no equivalente a una métrica de complejidad.

## 4. Distribución por capa

| Carpeta | Archivos | Bytes observados | Responsabilidad |
|---|---:|---:|---|
| `app` | 219 | 496.432 | Rutas, acciones, APIs, layouts y UI base. |
| `application` | 26 | 70.417 | Servicios, DTOs y agregaciones. |
| `domain` | 55 | 50.176 | Entidades, puertos y contratos. |
| `infraestructure` | 96 | 275.069 | Firebase, Storage, adaptadores, mappers y DI. |
| `presentation` | 245 | 1.275.458 | Componentes y ViewModels por feature. |
| `scripts` | 31 | 119.079 | Seeds, backfills, limpieza y auditoría. |
| `docs` | 4 | 21.247 | Estado previo a esta documentación. |
| `public` | 7 | 638.047 | Recursos estáticos. |

Otros recuentos:

- 243 archivos TSX entre componentes de `app` y `presentation`.
- 34 archivos de entidades/objetos de dominio.
- 17 puertos de repositorio.
- 15 servicios de aplicación.
- 14 adaptadores.
- 16 archivos de test y 58 casos ejecutados (`pnpm test`, 58/58 en verde al **2026-10-10**).

## 5. Superficie Next.js

- 32 archivos `page.tsx`.
- 11 Route Handlers en `app/api` (4 eliminados el **2026-10-10**: `profile/stats`, `profile/likes`, `revalidation/events`, `admin/seed-badges`).
- 43 páginas + APIs contadas conjuntamente.
- 12 layouts (incluye `app/(profile)/layout.tsx`).
- 70 archivos TypeScript bajo `app/actions`, incluidos helpers/tests.
- 31 scripts manuales más el helper `_loadEnv.ts` (32 archivos en `scripts/`).

El número de páginas incluye slots paralelos de Studio; no equivale a 32 URLs públicas únicas.

## 6. Archivos grandes y concentración de complejidad

Archivos de código destacados por tamaño observado:

| Archivo | Tamaño aproximado | Riesgo |
|---|---:|---|
| `StudioFirebaseRepository.ts` | 73 KB | Repositorio multifunción, TODOs y alto costo de cambio. |
| `SettingsCenter.tsx` | 54 KB | Drawer con múltiples responsabilidades. |
| `EventForm.tsx` | 47 KB | Formulario multistep crítico. |
| `EventDetailClient.tsx` | 41 KB | Detalle con muchas ramas/interacciones. |
| `SiteFormDrawer.tsx` | 39 KB | Formulario y flujo de medios complejo. |
| `SessionForm.tsx` | 31 KB | Edición de sesiones multifecha. |
| `DetailModal.tsx` de sitios | 27 KB | Modal visual y medios. |
| `RegistrationsTable.tsx` | 23 KB | Tabla operativa compleja. |

`ProfileTabs.tsx` (53 KB), `RecentBadges*`, `ProfileNavActions`, `DeleteEventModal`, `HomeSiteCard`, `ProfileLayoutHeader` y los componentes de verificación de email se eliminaron el **2026-10-10** (código muerto); el perfil usa `PublicProfileTabs.tsx` y `TimelineRelatedContent.tsx`.

No deben refactorizarse solo por tamaño. Sí requieren tests de caracterización antes de cambios estructurales.

## 7. Gestor de paquetes y reproducibilidad

Hay dos lockfiles versionados:

- `pnpm-lock.yaml` (438.368 bytes).
- `package-lock.json` (621.786 bytes).

Esto permite resoluciones diferentes entre equipos y despliegues. La práctica observada es pnpm; debe declararse como único gestor mediante:

- eliminación acordada del lockfile no usado;
- ~~campo `packageManager` en `package.json`~~ hecho **2026-10-10** (`pnpm@12.6.0`);
- ~~versión de Node fijada~~ hecho **2026-10-10** (`engines.node >=22`; Storage 8 requiere Node >= 22);
- ~~CI que falle si aparece otro lockfile~~ hecho **2026-10-10**; hoy falla porque `package-lock.json` sigue versionado (borrado pendiente de acuerdo del owner).

## 8. Dependencia duplicada de Storage (resuelta **2026-10-10**)

Había dos versiones de `@google-cloud/storage`: 7.22.0 directa y 8.2.0 transitiva desde `firebase-admin@14.4.0`, lo que rompía typecheck con `TS2345`. El único uso de la directa era `TransferManager` en `uploadMany`, código muerto. Se eliminó ese código y la dependencia directa; queda solo 8.2.0. También se corrigieron dependencias fantasma que fallaban con pnpm estricto (`framer-motion` → `motion/react`, `dompurify` → `isomorphic-dompurify`, `@google-cloud/firestore` declarado). Ver P0-1 en `06-calidad-seguridad-y-deuda.md`.

## 9. Estado Git y entrega

Durante la sesión se observaron:

- 151 commits alcanzables desde HEAD.
- 0 tags.
- múltiples ramas locales/remotas.
- 25 entradas locales sin integrar en un corte anterior: 17 modificadas, 1 eliminada y 7 nuevas.

Implicaciones:

- El workspace documentado no equivale necesariamente al commit remoto.
- Antes de release se debe separar trabajo por commits/PRs y registrar qué cambios están desplegados.
- Deben crearse tags/releases para versiones promovidas.

## 10. Scripts disponibles en `package.json`

```text
pnpm dev    -> next dev
pnpm build  -> next build
pnpm start  -> next start
pnpm lint   -> eslint
pnpm typecheck -> next typegen && tsc --noEmit --pretty false
pnpm test      -> tsx --test "**/*.test.ts" "**/*.test.tsx"
```

`typecheck` y `test` se añadieron el **2026-10-10**. Faltan scripts estándar para:

- `test:watch`;
- `test:e2e`;
- `format`/`format:check`;
- validación predeploy;
- auditoría de dependencias.

## 11. Gobierno del repositorio

Desde el **2026-10-10** existe `.github/workflows/ci.yml` (CI sin deploy; ver `05-infraestructura-despliegue-y-operacion.md` §11).

No se observaron:

- plantilla de PR o issues;
- `CODEOWNERS`;
- changelog;
- tags/releases;
- licencia;
- política de seguridad;
- convención documentada de ramas/commits.

`.github` contiene una definición de agente de Copilot y el workflow de CI.

## 12. Limitaciones de estas métricas

- No incluyen dependencias ni output de build.
- En la segunda medición no existían `node_modules` ni `.next` como directorios físicos, por lo que no se reporta su peso.
- Las versiones efectivas se obtuvieron de pnpm antes de esa limpieza/ausencia.
- No se ejecutó análisis de bundle del cliente.
- No se midió cobertura de tests ni complejidad ciclomática.

Estas mediciones deben automatizarse en CI para evitar que el documento se convierta en una fotografía obsoleta.