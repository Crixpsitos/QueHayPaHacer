# PWA y Google Play

QHPA es una PWA instalable (manifest + service worker propio) y se publica en Google Play como **Trusted Web Activity (TWA)** generada con Bubblewrap: la app Android es un Chrome a pantalla completa que abre el sitio. No hay código Android en el repo.

## 0. Estado y decisión

- **Decisión:** lanzar primero como PWA instalable (costo cero, se actualiza con cada deploy). Google Play (cuota única de USD 25) después, cuando haya tracción; todo lo necesario ya está listo en el repo.
- **Listo:** manifest completo (id, scope, `start_url` con `?source=pwa`, íconos 192/512 any + maskable, `screenshots` narrow/wide en `public/screenshots/`, atajos Eventos / Mis inscripciones / ¿Dónde ir?, `lang: es-CO`), metadatos iOS, SW con `/offline`, invitación a instalar (`app/components/pwa/InstallPrompt.tsx`, montada en el footer: botón "Instalar app" en Android/escritorio vía `beforeinstallprompt`, instrucción Compartir → Añadir a pantalla de inicio en iOS Safari; oculta si ya está instalada o descartada, recuerdo en `localStorage`), `assetlinks.json`, y `android/` con `twa-manifest.json` + `README.md` (pasos exactos de Bubblewrap).
- **Pendiente (manual):** probar la instalación en celulares reales (Android e iOS), reemplazar el dominio placeholder en `android/twa-manifest.json`, generar keystore/AAB, cuenta de Play y poner `ANDROID_SHA256_CERT_FINGERPRINTS`.
- Pasos de empaquetado: ver `android/README.md` (resumen en §4).

## 1. Piezas en el repositorio

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Manifest | `app/manifest.ts` → `/manifest.webmanifest` | Nombre, `short_name` QHPA, `start_url` `/?source=pwa`, `display: standalone`, colores, íconos y atajos (Eventos, Mis inscripciones, ¿Dónde ir?) y capturas. |
| Metadatos | `app/layout.tsx` | `viewport.themeColor` (en Next 16 va en `viewport`, no en `metadata`), `appleWebApp`, `apple-touch-icon`. |
| Íconos | `public/icons/*` | 192/512 `any`, 512 `maskable` (glifo dentro de la zona segura), 180 Apple. Se regeneran con `pnpm exec tsx scripts/generate-pwa-icons.ts` (usa el `sharp` que trae Next). |
| Service worker | `public/sw.js` | Caché (ver §2). Comentado en español. |
| Registro | `app/components/pwa/ServiceWorkerRegister.tsx` | Registra `/sw.js?v=<versión>` solo en producción. |
| Página offline | `app/offline/page.tsx` | Estática, precacheada; se muestra si una navegación falla sin copia en caché. |
| Asset Links | `app/.well-known/assetlinks.json/route.ts` | Verifica el dominio para la TWA. Lee `ANDROID_PACKAGE_NAME` y `ANDROID_SHA256_CERT_FINGERPRINTS` en runtime; sin huellas responde `[]`. |
| Headers | `next.config.ts` | `/sw.js` con `Cache-Control: no-cache, no-store, must-revalidate`, `Content-Type` JS y CSP propia. |
| Test | `app/components/pwa/sw.test.ts` | Verifica qué rutas se cachean y cuáles nunca. |

`proxy.ts` no intercepta `/sw.js`, `/manifest.webmanifest` ni `/.well-known/assetlinks.json`: su matcher excluye rutas con punto.

## 2. Qué cachea el service worker y por qué

**Problema:** App Hosting corre en Cloud Run con `minInstances: 0`. Tras un rato sin tráfico, la primera petición paga un cold start de varios segundos.

**Solución:** la primera visita va a la red (fría si toca); en las siguientes el HTML y los assets salen de la caché del dispositivo al instante y la red se consulta en segundo plano para dejar la copia fresca para la próxima vez (**stale-while-revalidate**). El cold start deja de verse en visitas repetidas.

| Recurso | Estrategia |
| --- | --- |
| `/_next/static/*` (JS, CSS, fuentes de `next/font`) e `/icons/*` | Cache-first (archivos con hash, inmutables). |
| Imágenes: `/_next/image`, `firebasestorage.googleapis.com`, `images.unsplash.com` | Stale-while-revalidate, máx. 150 entradas (se borran las más viejas). Respuestas opacas (imágenes externas sin CORS) no se guardan: Chrome les cobra ~7 MB de cuota a cada una. |
| Navegaciones a páginas públicas | Stale-while-revalidate. Si la red devuelve algo no cacheable (redirect, 404, error) se borra la copia. |
| Navegación sin red ni copia | Página `/offline`. |

**Nunca se cachea** (siempre red):

- `/api/*`, `/studio*`, `/profile` (el propio; `/profile/<handle>` sí es público), `/mis-eventos`, `/sites*`, `/eventos/create`, `/eventos/<id>/edit*`, `/eventos/<id>/sessions` (gestor; `/eventos/<id>/sessions/<sessionId>` sí es público), `/login`, `/register`, `/reset-password`, `/dev`, `/__/*`.
- Peticiones RSC / del router (`RSC: 1`, `Next-Router-*`, `?_rsc=`): las navegaciones cliente de Next siempre van a la red.
- Métodos distintos de GET (Server Actions incluidas).
- URLs con query, salvo `?source=pwa` (comparte copia con la URL limpia).
- Respuestas que no sean 200 de mismo origen.

> La lista de rutas privadas vive en `public/sw.js` (`NO_CACHE_PREFIXES`, `PRIVATE_EVENT_PATH`) y debe mantenerse en sincronía con `proxy.ts`. Si se agrega una ruta privada, agregarla en ambos lados y en `sw.test.ts`.

**Notas:**

- Se ignora el `Cache-Control: no-store` de las páginas a propósito: con Cache Components casi todo sale como dinámico y respetarlo anularía el objetivo. La caché vive solo en el dispositivo del usuario.
- Algunas páginas públicas incluyen estado del usuario en el HTML (like/registro en el detalle de evento). En una visita repetida ese estado puede verse una vez desactualizado hasta la siguiente; el navbar no se ve afectado (se hidrata en cliente con `/api/auth/me`). Al cerrar sesión, `AuthFirebaseRepository.logout()` borra las cachés `qhpa-pages-*` para que el siguiente usuario del dispositivo no vea el estado del anterior. `/offline` vive en `qhpa-static-*` y sobrevive a ese borrado.
- El SW no puede ver `Set-Cookie` (el navegador lo oculta), así que la protección de sesiones es la lista de rutas privadas.

### Versión por deploy (cache busting)

`next.config.ts` fija `process.env.NEXT_PUBLIC_SW_VERSION` (timestamp base36) al cargarse en `next build`. Next la inyecta en el bundle del cliente y `ServiceWorkerRegister` registra `/sw.js?v=<versión>`. El SW lee `?v=` y nombra sus cachés `qhpa-{static,pages,images}-<versión>`.

En cada deploy cambia la URL del script → el navegador instala el SW nuevo (`skipWaiting` + `clients.claim`) y en `activate` borra todas las cachés `qhpa-*` de versiones anteriores. Para fijar la versión a mano (p. ej. el SHA del commit): `NEXT_PUBLIC_SW_VERSION=<sha> pnpm build`.

Se descartó `deploymentId` de Next: además de exponer la versión cambia URLs de assets (`?dpl=`), headers de navegación y claves de `use cache`.

## 3. Verificar en Chrome

Solo se registra en producción: `pnpm build && pnpm start` o el dominio desplegado (HTTPS; `localhost` también sirve).

1. DevTools → **Application → Manifest**: sin errores, íconos visibles (incluido el maskable), "Installable".
2. **Application → Service workers**: `sw.js?v=...` activo. "Update on reload" ayuda al depurar.
3. **Application → Cache storage**: `qhpa-static-*` (incluye `/offline`), `qhpa-pages-*`, `qhpa-images-*`.
4. Recargar una página pública → en **Network** el documento sale "(ServiceWorker)" al instante.
5. **Network → Offline** y navegar a una página no visitada → se ve "Sin conexión".
6. **Lighthouse** (modo Navigation, móvil): revisar la categoría PWA/instalabilidad si la versión de Chrome la incluye.
7. Asset Links: `https://<dominio>/.well-known/assetlinks.json` y el validador de Google: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<dominio>&relation=delegate_permission/common.handle_all_urls`.

## 4. Generar el .aab con Bubblewrap

Requisitos: Node ≥ 22 y el dominio de producción desplegado con este código (manifest e íconos accesibles por HTTPS).

1. **Entorno:** `npx @bubblewrap/cli doctor`. La primera vez ofrece descargar JDK 17 y Android SDK (aceptar). Vuelve a correrlo hasta que quede todo OK.
2. **Proyecto TWA** (fuera del repo, o en `twa/`, que está en `.gitignore`):
   ```bash
   mkdir twa && cd twa
   npx @bubblewrap/cli init --manifest https://<dominio>/manifest.webmanifest
   ```
   - Package name (Application ID): `com.quehaypahacer.app` (debe coincidir con `ANDROID_PACKAGE_NAME`; no se puede cambiar después de publicar).
   - App name / launcher name: `Que Hay Pa Hacer?` / `QHPA`. Colores e íconos se leen del manifest.
   - **Signing key:** dejar que cree un keystore nuevo (`android.keystore`). Guardarlo **fuera del repo** (`*.keystore`/`*.jks` están en `.gitignore`), junto con sus contraseñas, en un gestor de secretos, y hacer **copia de seguridad**. Con Play App Signing esta es la *upload key*: si se pierde, se puede pedir reset a Google, pero cuesta días.
3. **Build:** `npx @bubblewrap/cli build` → genera `app-release-bundle.aab` (para Play) y `app-release-signed.apk` (para probar con `adb install`).
4. **Play Console:** crear la app → subir el `.aab` a una pista (prueba interna primero). Aceptar **Play App Signing**.
5. **Huella SHA-256:** Play Console → *Prueba y lanzamiento → Integridad de la app → Firma de apps* → copiar el SHA-256 del **certificado de la clave de firma de apps** (el de Google, no el de tu keystore). Si se prueba con el APK firmado localmente, agregar también la huella del keystore propio (`keytool -list -v -keystore android.keystore`).
6. **Asset Links:** poner las huellas en `ANDROID_SHA256_CERT_FINGERPRINTS` (separadas por coma): descomentar la entrada en `apphosting.yaml` o definirla en Firebase Console → App Hosting → Environment variables. Redeploy y verificar `https://<dominio>/.well-known/assetlinks.json`. Si no valida, la TWA muestra la barra de URL de Chrome.
7. **Actualizaciones de la app:** solo hacen falta si cambia el manifest/íconos o lo pide Play. Subir `appVersionCode` en `twa-manifest.json`, `bubblewrap update` y `bubblewrap build`. El contenido se actualiza solo con cada deploy web.

### Requisitos de Google Play

- **Política de privacidad:** `https://<dominio>/privacidad`.
- **Target API level:** lo maneja Bubblewrap; mantener la CLI actualizada y regenerar (`bubblewrap update`) cuando Play suba el mínimo.
- **Formulario de seguridad de los datos (Data safety):** declarar lo que recoge el sitio (cuenta/correo con Firebase Auth, contenido que sube el usuario, analítica si aplica).
- Ficha: ícono 512×512 (`public/icons/icon-512.png`), gráfico destacado 1024×500, capturas de teléfono, clasificación de contenido y público objetivo.
- Cuentas personales nuevas de Play deben pasar una prueba cerrada (p. ej. 12 testers durante 14 días) antes de producción.

### Alternativa sin instalar nada

[PWABuilder.com](https://www.pwabuilder.com/): pegar la URL del sitio → *Package for stores → Android*. Genera el `.aab`, el keystore y un `assetlinks.json` de ejemplo (usa Bubblewrap por dentro). Mismo cuidado con el keystore y con poner la huella de Play App Signing en `ANDROID_SHA256_CERT_FINGERPRINTS`.
