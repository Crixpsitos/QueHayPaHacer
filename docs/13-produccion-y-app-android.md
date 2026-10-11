# Producción y app Android: guía de principio a fin

Runbook en orden. Cada paso dice **quién** lo hace (🧑 tú: requiere tu cuenta/secretos/dinero, 🤖 puede hacerlo Claude con tu visto bueno) y cómo comprobar que quedó bien. El detalle de Bubblewrap y del service worker está en [`12-pwa-y-google-play.md`](./12-pwa-y-google-play.md); aquí se ve el camino completo.

**Orden obligatorio:** facturación → datos y reglas → secretos → backend → functions → dominio → verificación → app Android. El dominio va **antes** de la app: la app Android queda atada al dominio con el que se genera (cambiarlo después obliga a publicar otra versión).

## Estado de partida (verificado el 2026-10-11)

| Pieza | `quehaypahacer-develop` | `quehaypahacer-prod` |
| --- | --- | --- |
| Facturación | cuenta `01451D-24E793-0A6800` ✅ | **desactivada** (cuenta cerrada `01AA9E…`) |
| Firestore `quehaypahacer-db` | ✅ (`nam5`, Enterprise) | existe (`nam5`); confirmar edición |
| Bucket de Storage | us-east1 | `quehaypahacer-prod.firebasestorage.app` (us-east1) ✅ |
| App Hosting | backend `quehaypahacerdev` | por crear / confirmar |
| Cloud Functions | desplegadas | **sin desplegar** |

## 1. Facturación 🧑

Sin facturación Firestore, App Hosting, Functions y Scheduler no funcionan.

```bash
gcloud billing accounts list                     # confirma que 01451D-… está OPEN
gcloud billing projects link quehaypahacer-prod --billing-account=01451D-24E793-0A6800
gcloud billing projects describe quehaypahacer-prod   # billingEnabled: true
```

Ponle un tope de aviso para que una cuenta cerrada o un gasto raro no te sorprenda:

```bash
gcloud billing budgets create --billing-account=01451D-24E793-0A6800 \
  --display-name="QHPA prod" --budget-amount=50USD \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```

(También en consola: Facturación → Presupuestos y alertas.) El presupuesto **avisa, no corta** el gasto.

## 2. Reglas, índices y CORS 🧑 (reglas: revisar antes)

`firebase/firestore.rules` y `firebase/storage.rules` son **propuestas**: léelas antes de desplegarlas. Los índices (`firebase/firestore.indexes.json`) se exportaron de develop; sin ellos el listado y la búsqueda fallan en prod.

El `firebase.json` de la carpeta `QueHayPaHacerPruebas/` solo declara `functions`. Agrega Firestore y Storage (la base no es la `(default)`):

```json
{
  "firestore": [
    {
      "database": "quehaypahacer-db",
      "rules": "QueHayPaHacer-copilot/firebase/firestore.rules",
      "indexes": "QueHayPaHacer-copilot/firebase/firestore.indexes.json"
    }
  ],
  "storage": { "rules": "QueHayPaHacer-copilot/firebase/storage.rules" },
  "functions": [ …lo que ya hay… ]
}
```

```bash
cd QueHayPaHacerPruebas
npx firebase-tools deploy --only firestore,storage --project quehaypahacer-prod
```

**CORS del bucket** (las imágenes se suben directo desde el navegador): copia `cors.json` a `cors.prod.json` y deja solo los orígenes de prod (el dominio del paso 6, con `https://`, y `https://quehaypahacer.web.app` mientras tanto). Sin barra final. Luego:

```bash
gcloud storage buckets update gs://quehaypahacer-prod.firebasestorage.app --cors-file=cors.prod.json
```

✔ Comprobar: `gcloud storage buckets describe gs://quehaypahacer-prod.firebasestorage.app --format="value(cors_config)"`.

## 3. Config web y secretos 🧑

Los valores salen de la consola; **no los pegues en el chat ni en el repo**.

1. **App web de Firebase** (si el proyecto aún no tiene una): `npx firebase-tools apps:create web "QHPA Web" --project quehaypahacer-prod`, y `apps:sdkconfig web <appId>` para ver `apiKey`, `appId`, `messagingSenderId`, `measurementId`.
2. **Cuenta de servicio:** Consola → Configuración del proyecto → Cuentas de servicio → *Generar nueva clave privada*. Es el JSON de `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. **Secretos** (nombres exactos, los que pide `apphosting.production.yaml`):

```bash
P="--project quehaypahacer-prod"
npx firebase-tools apphosting:secrets:set firebaseServiceAccountJson --data-file ruta/al/sa-prod.json $P
openssl rand -base64 32 | npx firebase-tools apphosting:secrets:set cookieSecretCurrent  --data-file=- $P
openssl rand -base64 32 | npx firebase-tools apphosting:secrets:set cookieSecretPrevious --data-file=- $P
openssl rand -base64 32 | npx firebase-tools apphosting:secrets:set eventModerationWebhookSecret --data-file=- $P
shred -u ruta/al/sa-prod.json       # borra la llave local
```

4. Las variables **públicas** y las de la app web (`NEXT_PUBLIC_FIREBASE_API_KEY`, `APP_ID`, `MESSAGING_SENDER_ID`, `MEASUREMENT_ID`, `FIREBASE_API_KEY`, `FIREBASE_CONFIG`) se cargan en Consola → App Hosting → tu backend → *Environment*. El resto ya está en `apphosting.production.yaml`.

## 4. Backend de App Hosting en prod 🧑

```bash
npx firebase-tools apphosting:backends:create --project quehaypahacer-prod --location us-central1
```

El asistente pide: ID del backend (sugerido `quehaypahacer`), conectar el repo `Crixpsitos/QueHayPaHacer` de GitHub, *live branch* **`main`**, directorio raíz `/`. En el backend, en Configuración, pon **Environment name = `production`** (así carga `apphosting.production.yaml` sobre `apphosting.yaml`).

Dale acceso a cada secreto:

```bash
for s in firebaseServiceAccountJson cookieSecretCurrent cookieSecretPrevious eventModerationWebhookSecret; do
  npx firebase-tools apphosting:secrets:grantaccess $s --backend quehaypahacer --project quehaypahacer-prod
done
```

Primer despliegue: push a `main` o `npx firebase-tools apphosting:rollouts:create quehaypahacer --git-branch main --project quehaypahacer-prod`.

Errores ya vistos en develop: `Misconfigured Secret` = el secreto no existe o falta `grantaccess`; `CVE-2025-55182` = `next` debe ir fijo (`16.3.5`) en `package.json`.

> `minInstances: 0` (decisión actual). La primera visita tras un rato sin tráfico paga el arranque; el service worker evita que se repita en visitas siguientes.

## 5. Cloud Functions en prod 🧑 (🤖 hecho el cambio de código)

Las functions tenían el bucket de develop escrito a mano; ahora lo leen del parámetro `STORAGE_BUCKET` (`functions/src/config/bucket.ts`). Develop usa el valor por defecto y prod lo toma de `functions/.env.quehaypahacer-prod`, que Firebase carga solo.

```bash
cd QueHayPaHacerPruebas
npx firebase-tools deploy --only functions --project quehaypahacer-prod
```

- La primera vez puede fallar con permisos de **Eventarc / Pub/Sub** recién habilitados: espera 3–5 minutos y repite.
- Se crea el job `firebase-schedule-expirePremiumPlans` (vencimiento de Premium a las 03:00, hora de Bogotá).
- Los triggers de Storage están en `us-east1`, la misma región que el bucket de prod. ✅

✔ Comprobar: `gcloud functions list --project quehaypahacer-prod` (todas `ACTIVE`).

## 6. Dominio 🧑

1. Compra un dominio propio (`.com` o `.co`).
2. Consola → App Hosting → tu backend → *Configuración → Dominios → Agregar dominio personalizado*. Te muestra los registros DNS (TXT de verificación y A/AAAA o CNAME): créalos en tu proveedor. La verificación y el SSL tardan de minutos a unas horas.
3. En `apphosting.production.yaml` cambia `NEXT_PUBLIC_SITE_URL` a `https://<tu-dominio>` y haz commit + rollout (esa variable se hornea en el build: canonicals, sitemap, manifest).
4. Firebase Authentication → Configuración → **Dominios autorizados**: agrega el dominio (si no, el login con Google falla en el dominio nuevo).
5. Agrega el dominio al CORS del bucket (paso 2).

✔ Comprobar: `https://<dominio>/manifest.webmanifest`, `/sitemap.xml` y `/robots.txt` responden con el dominio correcto.

## 7. Datos iniciales y tu cuenta 🧑 + 🤖

Los scripts leen `.env` (apunta a develop). Para prod, exporta la cuenta de servicio de prod **solo en esa terminal** (las variables ya definidas no se sobrescriben) y revisa que el `projectId` impreso sea `quehaypahacer-prod`:

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat ruta/al/sa-prod.json)"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=quehaypahacer-prod
pnpm exec tsx scripts/seed-categories.ts
pnpm exec tsx scripts/seed-badges.ts
```

- **Sí** en prod: `seed-categories`, `seed-badges`, y `repair-event-geopoints` (primero sin `--apply`) si ya hay eventos.
- **Nunca** en prod: `seed-bulk-*`, `seed-fake-users`, `cleanup-test-events` y demás datos de prueba.
- Tu propia cuenta: regístrate en el sitio de prod y actívate Premium con `scripts/set-user-plan.ts` (modo prueba por defecto; añade `--apply`). Ver `docs/01`, sección *Estado comercial*.

## 8. Verificación de humo en prod 🧑

- [ ] Home, `/eventos`, `/donde-ir`, `/premium`, `/privacidad` y `/terminos` cargan.
- [ ] Registro, login (correo y Google), cierre de sesión.
- [ ] Crear un evento con imagen: la miniatura optimizada aparece (prueba CORS + function de imágenes).
- [ ] Inscribirse a un evento, ver al inscrito en el Estudio, reportar un sitio.
- [ ] `https://<dominio>/.well-known/assetlinks.json` responde (`[]` hasta el paso 9).
- [ ] DevTools → Application: manifest válido y service worker activo (ver `docs/12` §3).
- [ ] Datos legales completos en `LEGAL_ENTITY` (`app/components/layout/shared/LegalDocument.tsx`): nombre, cédula y correo del responsable.

## 9. App Android (Google Play) 🧑

La app es una **TWA**: Chrome a pantalla completa mostrando tu sitio. El contenido se actualiza solo con cada deploy web; solo regeneras la app si cambian el manifest o los íconos.

### 9.1 Cuenta de desarrollador

1. Crea la cuenta en <https://play.google.com/console> (pago único de **USD 25** y verificación de identidad con documento).
2. Como persona natural, tu cuenta es *personal*: Google exige una **prueba cerrada** (hoy, 12 testers durante 14 días) antes de publicar en producción. Verifica el requisito vigente en tu consola; empieza esta prueba cuanto antes porque es lo que más demora.

### 9.2 Generar el `.aab`

Instala JDK 17 y el SDK de Android con `npx @bubblewrap/cli doctor` y sigue `docs/12` §4. Resumen:

```bash
mkdir twa && cd twa
npx @bubblewrap/cli init --manifest https://<dominio>/manifest.webmanifest
#   Package name: com.quehaypahacer.app   (no se puede cambiar después de publicar)
#   Deja que cree el keystore y GUÁRDALO FUERA DEL REPO con su contraseña (copia de seguridad)
npx @bubblewrap/cli build        # → app-release-bundle.aab (para Play) y app-release-signed.apk (para probar)
```

Prueba el APK en un teléfono con `adb install app-release-signed.apk`.

### 9.3 Subir a Play Console

1. *Crear app* → nombre `Que Hay Pa Hacer?`, idioma español, aplicación (no juego), gratuita.
2. *Prueba cerrada* → crear versión → subir el `.aab` → aceptar **Play App Signing**.
3. Copia el **SHA-256 de la clave de firma de apps** (Prueba y lanzamiento → Integridad de la app) y úsalo en `ANDROID_SHA256_CERT_FINGERPRINTS` (varias huellas separadas por coma; añade también la de tu keystore si pruebas el APK local). Está comentada en `apphosting.yaml`: descoméntala, o defínela en la consola del backend, y haz rollout.
4. Verifica `https://<dominio>/.well-known/assetlinks.json`. Si no valida, la app muestra la barra de direcciones de Chrome.

### 9.4 Ficha y formularios

| Qué | Dónde / valor |
| --- | --- |
| Política de privacidad | `https://<dominio>/privacidad` |
| Eliminación de cuenta | La app permite borrarla desde *Perfil → Ajustes*; indica `https://<dominio>/privacidad` como URL informativa |
| Seguridad de los datos | Correo, nombre, teléfono, fotos/contenido que sube el usuario, identificadores; datos cifrados en tránsito; el usuario puede pedir su borrado |
| Acceso a la app | Crea una **cuenta de prueba en prod** y dásela a Google (hay funciones tras el login) |
| Anuncios | No contiene anuncios |
| Clasificación de contenido | Cuestionario IARC; contenido generado por usuarios (por eso existe *Reportar*) |
| Ícono | `public/icons/icon-512.png` (512×512) |
| Gráfico destacado | 1024×500 px |
| Capturas | Mínimo 2 de teléfono (puedes tomarlas con Chrome DevTools en modo móvil) |

### 9.5 Producción

Cuando la prueba cerrada cumpla los requisitos: *Producción → Crear versión* con el mismo `.aab` (o uno nuevo con `appVersionCode` mayor), revisión de Google (horas a días) y publicación.

### 9.6 Alternativa sin instalar nada

[PWABuilder.com](https://www.pwabuilder.com/) → pega la URL → *Package for stores → Android*. Genera el `.aab` y el keystore (mismo cuidado: respaldo y huella de Play App Signing).

## Resumen: qué corre quién

| # | Paso | Quién |
| --- | --- | --- |
| 1 | Vincular facturación + presupuesto | 🧑 (los cambios de facturación los bloquea el permiso automático de Claude) |
| 2 | Reglas, índices, CORS | 🧑 revisa; 🤖 prepara `firebase.json` / `cors.prod.json` |
| 3 | Secretos | 🧑 (valores sensibles) |
| 4 | Backend App Hosting | 🧑 |
| 5 | Functions | 🧑 deploy; 🤖 código ya parametrizado |
| 6 | Dominio + DNS | 🧑; 🤖 actualiza `NEXT_PUBLIC_SITE_URL` |
| 7 | Seeds | 🧑 corre con la llave de prod; 🤖 los scripts |
| 8 | Humo | 🧑 + 🤖 con navegador |
| 9 | Play Console + `.aab` | 🧑 |
