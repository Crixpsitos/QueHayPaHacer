# Handoff y contexto de trabajo reciente

## 1. Propósito

Este documento captura el contexto que todavía vive en el árbol local y en la conversación de implementación. No sustituye Git: indica qué debe revisarse, separarse y promoverse antes de considerar el trabajo entregado.

Fecha de corte: **2026-10-10**.

## 2. Punto de partida Git

- Rama: `develop`.
- Commit base observado: `3b2521c`.
- Mensaje: `feat: update creator profiles and event workflows`.
- Fecha: 2026-09-19.

Ese commit contiene trabajo previo relacionado con la migración de perfiles/creadores. Los cambios descritos abajo aparecen todavía como modificaciones o archivos nuevos en el workspace y no deben asumirse desplegados.

“Implementado” en este handoff significa que el código existe y fue ejecutado en el workspace local. “Integrado” significa commit/PR presente en la historia Git compartida. ProfileTimeline, Membresía y componentes relacionados están implementados y conectados localmente, pero varios siguen como archivos no rastreados y por tanto no están integrados en el commit base.

## 3. Decisiones consolidadas

### Modelo de usuario

- Participación: `consumer | creator`.
- Plan: `basic | premium`.
- Verificación de creador independiente.
- Username único y transaccional.
- Sin roles heredados `professional`, `business`, `organizer`, etc.

### Membresía

- Básico/Premium.
- Sin precio definido.
- Sin pagos ni checkout.
- Conversión Premium por contacto comercial.
- Soporte prioritario marcado como próximo.

### Perfil

- Nombre antes de `@username`.
- Avatar/banner/bio/web/redes.
- Participación, plan y verificación separados.
- Navbar compartido con Home.
- Avatar del dropdown prioriza `profile.photoURL`.

### Trayectoria

- Timeline enriquecida, no red social.
- Agrupación por día calendario `America/Bogota`.
- Orden por timestamp de actividad.
- Cards de evento/sitio/badge.
- Creador real del evento cuando está disponible.
- Cards al ancho de su columna.
- Imágenes con variante/resolución y `sizes` adecuados.

## 4. Cambios locales funcionales observados

### Navegación y perfil

- `app/(profile)/profile/layout.tsx` usa el Navbar de Home.
- `Navbar.tsx` ajusta CTA consumidor/creador.
- `NavbarAccountMenu.tsx` muestra foto, nombre, username, participación, plan y verificación.
- `ProfileLayoutHeader.tsx` fue eliminado para evitar duplicación.
- `ProfileHeader.tsx` muestra redes sociales y jerarquía de identidad.
- `SettingsCenter.tsx` conserva deep-link `?ajustes=1` y corrige drawer móvil.

### Membresía

Archivos nuevos:

- `presentation/profile/components/MembershipSection.tsx`.
- `presentation/profile/lib/membership.ts`.
- `presentation/profile/lib/membership.test.ts`.

### Trayectoria

Archivos nuevos/modificados:

- `ProfileTimeline.tsx`.
- `TimelineRelatedContent.tsx`.
- `profileTimeline.ts`.
- `profileTimeline.test.ts`.
- mapper/repository/read-model de perfil para contenido relacionado.
- `ProfileFirebaseMapper.test.ts` para variantes de imagen.

### API y capa de perfil

Hay cambios locales en:

- `/api/profile/me`;
- `ProfileService`;
- puerto, adaptador, DTO, mapper y repositorio de perfil;
- caché del perfil.

Objetivo: cargar una cantidad limitada de actividad reciente por tipo y enriquecer eventos/autores sin N+1 por actividad.

## 5. Validaciones realizadas

### Tests

- Suite completa observada: **50/50 aprobados**.
- Incluye agrupación temporal y selección de imagen de timeline.

### Lint

- Lint focalizado de los cambios recientes: sin errores.
- Advertencia conocida en `SettingsCenter` por `watch()` de React Hook Form y React Compiler.
- Lint global: 159 problemas (66 errores, 93 warnings) preexistentes/distribuidos.

### Typecheck/build

- Turbopack compiló la aplicación.
- Typecheck y build se detienen por incompatibilidad entre Storage 7.22 y 8.2.

### Visual

Se validaron con Playwright:

- timeline desktop/móvil sin overflow;
- card ocupa ancho disponible;
- imagen controlada (112px móvil, 192px desktop en el fixture validado);
- Navbar desktop/móvil;
- CTA `Crear evento` para creator;
- dropdown con imagen real, nombre, username, Creador, Premium y verificación.

Algunas verificaciones usaron interceptación local de `/api/auth/me` o `/api/profile/me` con datos sintéticos. No escribieron en Firestore.

## 6. Incidentes/limitaciones observados

1. Redis/Upstash excedió cuota de 256 MiB durante desarrollo.
2. Build bloqueado por dos versiones de `@google-cloud/storage`.
3. `/profile` requiere autenticación; las pruebas visuales aisladas usaron mocks de red locales.
4. Studio conserva mocks/fallbacks.
5. Lint global no está limpio.
6. Cambios locales no están divididos en commits ni PRs.

## 7. Estado local a revisar antes de commit

El workspace tenía cambios en:

- navegación Home/Profile;
- perfil y Settings;
- API/servicios/repositorios de perfil;
- timeline/membresía/tests;
- documentación;
- dos archivos de snippets ya modificados en el árbol.

No revertir automáticamente `docs/javascript-snippets.md` ni `docs/typescript-snippets.md`: son cambios locales previos o paralelos y deben revisarse con su autor.

## 8. Secuencia inmediata recomendada

1. Revisar `git diff` por módulo y separar cambios ajenos.
2. Resolver Storage 7/8 y recuperar typecheck/build.
3. Reejecutar 50 tests, lint focalizado y luego global.
4. Probar `/profile` con sesión real en dev.
5. Verificar datos reales de timeline, imágenes y autores.
6. Revisar seguridad del endpoint seed y rules Firebase.
7. Commit/PR por unidades:
   - perfil/modelo;
   - membresía;
   - timeline/read-model;
   - navbar/dropdown;
   - documentación.
8. Desplegar primero a development y ejecutar smoke.

## 9. No hacer durante el cierre

- No reintroducir cuenta profesional.
- No añadir pagos antes de decisión comercial/legal.
- No refactorizar toda la arquitectura mientras el build está rojo.
- No mezclar limpieza de naming con fixes P0.
- No desplegar Studio con métricas mock como si fueran reales.
- No asumir que los cambios locales ya están en Firebase App Hosting.

## 10. Próximo handoff

La siguiente persona debe reportar:

- commit/PR revisado;
- validaciones con resultados reales;
- ambiente desplegado;
- migraciones/scripts ejecutados;
- riesgos abiertos y owners;
- diferencias entre este snapshot y el estado nuevo.

## 11. Handoff sesión 2026-10-10 (P0)

### Qué quedó cerrado

- **P0-1 Storage (código):** eliminados `uploadMany`/`TransferManager`/archivos temporales y la dependencia directa `@google-cloud/storage@7.22`; corregidas dependencias fantasma (`framer-motion` → `motion/react`, `dompurify` → `isomorphic-dompurify`, `@google-cloud/firestore@^9.2.0` declarado); `Outfit` variable en `app/layout.tsx`; scripts `typecheck` y `test`, devDep `tsx`.
- **P0-2:** eliminados `GET /api/admin/seed-badges`, `app/actions/admin/seed-badges.action.ts` y `app/api/revalidation/events/route.ts`; nuevo `scripts/seed-badges.ts`. Corregido IDOR crítico en Server Actions con `app/actions/_session.ts` (`getSessionUid`, `isSessionEventOwner`) y test `app/actions/_session.test.ts`.
- **P0-4:** retirados `MOCK_STUDIO_OVERVIEW`, mocks muertos de Studio/sitios y el campo falso `trend`.
- **P0-5:** eliminados `cache-handler.js`, `cacheHandlers` y las dependencias `redis`/`@upstash/redis`; ahora handler en memoria por instancia de Next.

### Qué quedó abierto

- **P0-1:** `pnpm build` completo bloqueado: el prerender de `/` falla con `7 PERMISSION_DENIED ... billing ... quehaypahacer-develop`. Riesgo: `UserFirebaseRepository.findAll` lee toda la colección `users` desde `VerifiedCreatorsSection`.
- **P0-3 (parcial):** `firebase/firestore.rules` y `firebase/storage.rules` son propuesta, no cableadas en `firebase.json` ni desplegadas; `firebase/firestore.indexes.json` exportado de develop. Prod tiene 0 índices: en Enterprise las consultas hacen table scan (costo), pero la búsqueda por texto sí requiere el índice tokenizado (bloqueo para búsqueda). Sin tests de emulador.
- **P0-6 (parcial):** `.github/workflows/ci.yml` creado; el check de lockfile falla mientras `package-lock.json` siga versionado; faltan secrets/vars en GitHub.
- `/api/profile/{badges,events,sites,stats}?uid=` pendiente de revisar en la matriz de autorización P1. No existe rol/claim admin.
- `getFormResponses` y `getAudienceSummary` sin implementar (sin UI consumidora).

Decisiones del owner: habilitar billing en `quehaypahacer-develop` (o apuntar el build local a un ambiente con billing); borrar `package-lock.json`; revisar/desplegar rules tras diff con consola; desplegar índices a prod. CI ya no necesita secrets (sin build; App Hosting compila en cada rollout).

### Validaciones

| Validación | Antes | Después |
|---|---|---|
| Typecheck | 14 errores | PASS |
| Tests | 50/50 | 51/51 PASS |
| ESLint archivos tocados | — | 0 errores nuevos (hallazgos restantes preexistentes) |
| Build | Falla | Compile + TypeScript PASS; prerender bloqueado por billing de develop |

Entorno: Node 22.17.0, pnpm 12.6.0, Next 16.3.5, `pnpm install --frozen-lockfile`.

### Cambios locales/commits

Sin commits. Todo el trabajo está local y sin commit en `develop`.

### Migraciones ejecutadas

Ninguna. No hubo escrituras en Firestore; `scripts/seed-badges.ts` no se ejecutó con `--apply`. Redis no se vació ni se tocó.

### Ambiente afectado

Ninguno desplegado. Solo comandos de lectura `firebase firestore:indexes` y `firebase firestore:databases:list` contra develop y prod.

### Próximo paso exacto

1. El owner habilita billing en `quehaypahacer-develop` → reejecutar `pnpm build`.
2. Decidir el borrado de `package-lock.json`.
3. P1-1 matriz de autorización (reutilizar `app/actions/_session.ts`) y P1-4 cero errores ESLint.

### Bloque 2 (misma sesión, 2026-10-10)

Cerrado:

- `next.config.ts`: `output: "standalone"` explícito (App Hosting ya lo fuerza; se deja por si cambia el adaptador).
- CI sin `build` (App Hosting compila en cada rollout); no requiere secrets en GitHub.
- Costo Firestore: `getVerifiedCreators` ya no lee toda la colección `users` → nueva query `findVerifiedCreators(limit)` (`isPublic`, `participation == creator`, `creatorVerified`) en las 4 capas. `resolvePublicUser` ya no escanea `users` buscando por `displayName`: `findByUsername` prueba el valor normalizado y luego el exacto (perfiles legados). `UserService.getAllUsers` eliminado. Eliminado archivo basura versionado `application/services/user/UserService.ts.tmp.80410.b54639164dfa`.
- `app/error.tsx` (prop `retry`, API de Next 16.3) y `app/global-error.tsx`; el log solo registra `digest`.
- Logs: eliminados 12 `console.log` de depuración con PII/payloads (email en `EmailVerificationWatcher`, uid en `ProfileTabs`, eventos completos en actions/EventForm, "probandooooo"). `getEventRegistrations` usa `console.error` sin parámetros de consulta.
- `/api/profile/{badges,events,sites}?uid=`: ahora exigen perfil público o sesión propia (`canViewProfile` en `app/actions/_session.ts`), si no 404. `sites` ya no expone borradores (`publicationStatus === "published"`). Eliminados `/api/profile/stats` y `fetchUserStats` (sin callers).

Validación: typecheck PASS; tests 51/51; ESLint global 64 errores / 89 warnings (sin errores nuevos); build compila + TypeScript OK con `standalone`, prerender sigue bloqueado por billing de develop.

Abierto (requiere decisión/acceso del owner): billing develop; borrar `package-lock.json`; índice de búsqueda de texto en prod; diff+deploy de reglas; backups (PITR/export programado) y rollback probado de App Hosting; baja de la instancia Redis; rate limiting (sin Redis: Cloud Armor o contador en Firestore — decidir); E2E Playwright (necesita ambiente con billing).

Próximo paso: auditoría página por página (frontend, lógica redundante/inconsistente) y cierre de ESLint en los archivos que toque esa auditoría.

### Bloque 3 (misma sesión, 2026-10-10): auditoría página por página + arreglos

Auditoría read-only en 4 frentes (descubrimiento público, perfil/auth, Studio, creación/edición de eventos y sitios). Se corrigió todo lo de severidad alta verificable en código:

- **Seguridad eventos/sesiones:** create-draft ya no acepta `status: published` (bypass de moderación); acciones de sesión exigen autor + multi-date + Premium (`app/actions/events/lib/sessionOwnership.ts`); update/publish no dejan cambiar `eventType` ni `promotion` desde el cliente (autopromoción gratis); campos del servidor (analytics, createdAt, moderación, slug, author) preservados (`withServerOwnedFields`), ya no se resetea el score; validación de publicación aplicada en el servidor; borrar evento borra sus sesiones; sesiones borrador solo visibles al autor; OG image no filtra borradores; `/eventos/:id/edit` y `/sessions` exigen login.
- **Seguridad sitios:** `updateDraft/publishExisting/updateSite` exigen dueño (antes cualquiera sobrescribía cualquier sitio); `/donde-ir/[id]` y el sitio vinculado en detalle de evento solo muestran sitios publicados+aprobados+activos (`fetchPublicSiteDetail`, cacheado); schema valibot `application/dto/sites/SiteDto.ts`.
- **Datos:** editar un sitio ya no borra ciudad/departamento/país; `socialMedia/temporarilyClosed/bookingUrl` ya no se pierden; slug de sitio se regenera al publicar si quedó vacío.
- **Seguridad perfil/auth/uploads:** avatar/banner solo aceptan rutas propias del bucket (antes permitía borrar archivos ajenos con credenciales admin); cambio de contraseña exige reautenticación reciente verificada en servidor (`auth_time`); `generateUploadUrl` con allowlist de entidad/MIME/subcarpeta y `fileName` saneado; open redirect corregido (`app/lib/utils/safeRedirect.ts`); delete-account borra cookies; logout cierra también el SDK cliente (Navbar y Studio); URLs de website/redes validadas en servidor; perfil público: nombre antes de @username, `generateMetadata`, noindex en privados/login/registro/perfil propio; `/mis-eventos` ahora con Navbar (`app/(profile)/layout.tsx`) y sin tope de 6 eventos.
- **Studio:** Premium y dueño verificados en cada página de detalle y en las acciones (`getPremiumSessionUid`, `isStudioEventOwner`, `isStudioSiteOwner` en `app/actions/_session.ts`), no solo en el layout; colaboradores: quitar es bidireccional, invitaciones toman datos del invitado desde el servidor (no se puede falsear "verificado"), dedupe bidireccional, tope 20; búsqueda no expone correos ajenos; clicks de registro externo no tocan `updatedAt`; itinerario de sitio solo eventos publicados; CSV neutraliza fórmulas; quitar inscritos pide confirmación y reporta fallos; KPIs con etiquetas honestas ("… de eventos creados este mes"), "Eventos activos" = publicados que no han terminado; bordes de mes y fechas en hora de Colombia; `loading.tsx`/`error.tsx` y estados vacíos en gráficas.
- **Caché:** tags corregidos (`user-events` inexistente → `profile-events`/`profile-stats`; `profile-sites` en `_revalidate.ts`; `updateTag` en acciones del propio usuario); el webhook de moderación usaba `updateTag` (solo válido en Server Actions) y fallaba con 500 → `revalidateTag(tag, { expire: 0 })`.
- **Limpieza:** ~20 archivos muertos eliminados (ProfileTabs y cadena, componentes de verificación de email, mocks, PaginationBar/ListToolbar/usePagedList, HomeSiteCard, get-site-likes, /api/profile/likes, /api/profile/stats); footer sin links rotos `/privacy` `/terms` (no existen páginas legales).

Validación: `pnpm typecheck` PASS; `pnpm test` 58/58; ESLint global 53 errores / 88 warnings (antes 66/93); build compila + TypeScript OK, prerender bloqueado por billing de develop. **Nada probado en navegador ni contra Firestore** (billing): probar en develop flujos de login, crear/editar/publicar evento y sesión, crear/editar sitio, subir avatar/banner, cambiar contraseña, Studio (overview, inscritos, colaboradores).

Pendiente (código, no hecho): colaboradores siguen guardándose con el save del evento (viola contrato de ops atómicas; refactor); tope de tamaño en uploads (requiere header firmado nuevo, no probado); rate limiting; login/register con SDK cliente dentro de Server Actions; deuda pública de rendimiento/SEO listada en `docs/06`.
Pendiente (decisión del owner): qué muestra un perfil privado; cascada al borrar cuenta; si quien responde una invitación de colaboración debe ser Premium; páginas legales.

### Actualización billing (2026-10-10, 14:10)

Causa real del bloqueo: `quehaypahacer-develop` estaba vinculado a la cuenta de facturación `01A8DE-40B3CC-111C0C`, que estaba **cerrada** (`open: false`); la consola de Firebase mostraba Blaze igual. El owner la reabrió. Resultado: `pnpm build` **PASS completo** (44 páginas generadas contra Firestore develop, sin errores ni warnings).
Pendiente: `quehaypahacer-prod` tiene `billingEnabled: false` y su cuenta `01AA9E-5C1D58-6CA5D8` está cerrada → revisar antes de cualquier release.

### Bloque 4 (2026-10-10, 14:10–18:15): QA de punta a punta en navegador (develop)

Cuentas de prueba creadas en **develop** por la UI de registro (credenciales solo en el scratchpad local de la sesión, no en el repo): `qa.mvp.…@example.com` (elevada a Premium con `scripts/qa-elevate-user.ts`, dry-run por defecto) y `qa.asistente.…@example.com` (basic). Datos de prueba creados: evento estándar "QA MVP Concierto de prueba", evento multi-fecha "QA MVP Festival multi-fecha" (2 sesiones), sitio "QA Parque Centenario" (pendiente de moderación).

Flujos verificados OK: registro → username normalizado; perfil propio con Navbar; logout/login con `redirect_to`; Studio overview (gate Premium, KPIs honestos, estados vacíos); crear/editar/publicar evento estándar; moderación por webhook (401 con secreto inválido, 200 al aprobar, marca creador + insignia "Primer Evento"); inscripción de un segundo usuario; usuario no dueño/no Premium bloqueado en Studio; organizador ve, confirma y quita inscritos (con confirmación); crear y editar sitio conservando ciudad/departamento/país/coordenadas; banner y avatar; cambio de contraseña (rechaza la actual incorrecta, acepta la correcta, login posterior con la nueva); evento multi-fecha con 2 sesiones, sincronización de rango de fechas y publicación.

Bugs encontrados y corregidos durante el QA:
1. **Coordenadas de eventos se borraban**: `removeUndefinedProperties` copiaba `GeoPoint` como map plano (`{_latitude,_longitude}`) → al leer daba 0,0 y la aprobación lo persistía. Fix en la función compartida (solo recorre objetos planos) + lectura tolerante en `EventsFirebaseMapper.toLatLng`. Script `scripts/repair-event-geopoints.ts` (dry-run por defecto): en develop reparó 3; **39 eventos de develop quedaron sin coordenadas recuperables** (corregir a mano o re-editar). **Correr el script en prod antes del release.**
2. `{coordinates.lat && …}` pintaba un "0" suelto y ocultaba el mapa → `Boolean(...)`.
3. Dirección duplicada en el detalle ("…Ibagué, Tolima, Ibagué, Tolima") → se omiten partes ya incluidas.
4. Link al autor del sitio iba a `/profile/undefined` / displayName → `buildProfileHref` por uid.
5. **Carrera imagen principal**: el autosave del cliente reescribía `mainImage` en `processing` después de que la Cloud Function la dejaba `ready`, y `cleanupOldMediaFiles` borraba la optimizada → `withServerOwnedFields` conserva la versión `ready` de la misma imagen (`optimizedPathFor`, con test).
6. Checks de Studio leían Firestore sin caché fuera de Suspense → `getCachedUserPlan` / `fetchEventDetailById`; segmentos privados con `export const instant = false`.
7. Copy/UX: tildes en login/registro, calendario en español, títulos de `/login` y `/register`, "herramientas avanzadas".

Fuera de este repo (`../functions`, **sin commit ni deploy**):
- `optimizeProfileMedia` no tenía guarda `optimized_` → se re-disparaba sobre su propia salida (~17 ejecuciones por avatar/banner, archivos `optimized_optimized_…`). Fix de 1 línea aplicado.
- `event.onDelete.cascadeDeleteInteractions.ts` tenía un JSDoc corrupto que impedía compilar functions. Corregido; `npm run lint` y `npm run build` PASS.
- **Deploy pendiente (owner):** `firebase deploy --only functions:optimizeProfileMedia --project quehaypahacer-develop` desde `QueHayPaHacerPruebas/` (el agente no tiene permiso de deploy).

Observaciones de entorno (no son bugs de código): la red local tuvo caídas DNS/QUIC; tras ellas el cliente Admin de Firestore del dev server quedó colgado (E1181) hasta reiniciar, y el caché de Turbopack (`.next/dev`) se corrompió una vez (404 en todas las rutas) → `rm -rf .next/dev`. Con la ventana del navegador en segundo plano, `requestAnimationFrame` cae a ~2 fps y los wizards con `AnimatePresence mode="wait"` parecen trabados.

Facturación: develop quedó vinculado a la cuenta abierta `01451D-24E793-0A6800`; la cuenta anterior `01A8DE…` se cerró dos veces (posible pago rechazado). Prod sigue sin billing.

Validación final: `pnpm typecheck` PASS; `pnpm test` 60/60; ESLint 53 errores / 88 warnings (sin nuevos); `pnpm build` PASS (44/44 páginas).

### Bloque 5 (2026-10-10, 18:25–18:50): rediseño UI y bugs de sesión

Dirección de diseño "Cartelera de Ibagué" dentro del design system (crimson/dorado/tinta, Outfit + Inter). Elemento distintivo: la **boleta** (talón perforado con bloque de fecha) en el detalle de evento.
- **Detalle de evento (estándar y multi-fecha)** rediseñado: hero 21:9, `h1` único, boleta sticky (fecha, horario, lugar, precio, CTA, cupo, estados de inscripción/dueño), "Cuándo y dónde" con mapa, galería, organizador, compartir con `SITE_URL`; multi-fecha con cada sesión como talón y CTA "Elegir fecha"; barra fija en móvil. Fechas siempre en America/Bogota (`presentation/events/components/detail/format.ts`, con tests); descripción renderizada en el HTML del servidor; piezas compartidas en `presentation/events/components/detail/`. Pendiente menor: `EventDetailSkeleton` y `SocialShareBar` (label en mayúsculas) aún con estilo anterior.
- **Mis eventos**: tarjetas con portada, estado, fecha/lugar, métricas (vistas, me gusta, inscritos, conversión), filtros con conteo, resumen; `/profile` y `/mis-eventos` usan el shell del Home (Navbar + Footer).
- **Studio overview**: KPIs sobrios, "¿Qué eventos convierten mejor?" (top 10 por vistas, sin registro externo), "Eventos con mejor rendimiento" (top 5), inscripciones por día, interacción en small multiples (top 6) y "Qué hacer ahora" con sugerencias derivadas de los datos; tema de gráficos común (`charts/chartTheme.tsx`); todas las consultas con límite y orden determinista.

Bugs corregidos:
- **Bucle de redirecciones** (`ERR_TOO_MANY_REDIRECTS`): con una cookie de sesión irrecuperable (refresh token revocado al cambiar la contraseña), `proxy.ts` redirigía a `/login` y `/login` volvía a fallar. Ahora `handleError` borra las cookies, deja pasar rutas públicas y solo manda a login las privadas.
- Tras cambiar la contraseña, `SettingsCenter` reabre la sesión con la nueva (SDK cliente + `loginAction`) para no dejar una cookie muerta.

Entorno local: **IPv6 no funciona en la red del owner** y Node lo intenta primero → "fetch failed" intermitente (Firestore, Google certs, imágenes). Correr `pnpm dev` con `NODE_OPTIONS=--dns-result-order=ipv4first`. No afecta Cloud Run.

Validación: typecheck PASS; tests 68/68; ESLint 50 errores / 86 warnings (bajó de 53); `pnpm build` PASS (44/44).
