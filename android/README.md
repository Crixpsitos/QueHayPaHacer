# Android (TWA con Bubblewrap)

Empaqueta la PWA como app Android (Trusted Web Activity). No hay código Android: solo `twa-manifest.json`. Decisión y contexto: `docs/12-pwa-y-google-play.md`.

## Antes de empezar
- El dominio de producción debe estar desplegado con HTTPS y servir `/manifest.webmanifest`, `/icons/*` y `/.well-known/assetlinks.json`.
- En `twa-manifest.json` reemplazar **todas** las ocurrencias de `REEMPLAZAR_DOMINIO_PRODUCCION.com` (campo `host` y las URLs) por el dominio real.
- Package: `com.quehaypahacer.app` (no cambia tras publicar).

## Pasos
1. Instalar y revisar el entorno (Node ≥ 22; ofrece descargar JDK 17 y Android SDK):
   ```bash
   npm i -g @bubblewrap/cli
   bubblewrap doctor
   ```
2. Crear el proyecto fuera del repo (o en `twa/`, ignorado por git), partiendo de este manifest:
   ```bash
   mkdir -p ~/qhpa-twa && cd ~/qhpa-twa
   cp <repo>/android/twa-manifest.json .
   bubblewrap init --manifest https://<dominio>/manifest.webmanifest
   ```
   `init` pregunta los datos y propone los del manifest web; confirmar que coincidan con `twa-manifest.json` (packageId, colores, notificaciones desactivadas). Si prefieres usar el archivo tal cual: `bubblewrap update --manifest=./twa-manifest.json`.
3. Keystore: `init` crea `android.keystore`. **No se commitea** (`*.keystore`, `*.jks`, `*.aab`, `*.apk` están en `.gitignore`). Guardarlo con sus contraseñas en un gestor de secretos y hacer copia de seguridad.
4. Compilar:
   ```bash
   bubblewrap build
   ```
   Genera `app-release-bundle.aab` (para Play) y `app-release-signed.apk` (para probar con `adb install`).
5. Obtener el SHA-256:
   - Local: `keytool -list -v -keystore android.keystore -alias android` → línea `SHA256`.
   - Play (el que importa en producción): Play Console → Prueba y lanzamiento → Integridad de la app → Firma de apps → certificado de la clave de firma de apps.
6. Ponerlo en la variable de entorno **`ANDROID_SHA256_CERT_FINGERPRINTS`** (varias huellas separadas por coma): descomentar la entrada en `apphosting.yaml` o definirla en Firebase Console → App Hosting → Environment variables. Redeploy y verificar `https://<dominio>/.well-known/assetlinks.json`. Sin huella válida la app muestra la barra de URL de Chrome.
7. Subir el `.aab` a Play Console (prueba interna primero) y aceptar Play App Signing.

## Actualizaciones
El contenido se actualiza solo con cada deploy web. Solo hace falta nueva versión de la app si cambian manifest/íconos o Play lo exige: subir `appVersionCode`, `bubblewrap update`, `bubblewrap build`.
