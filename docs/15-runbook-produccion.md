# 15. Runbook de lanzamiento a producción

Proyecto prod: `quehaypahacer-prod` · Firestore `quehaypahacer-db` (Enterprise, nam5) · bucket `quehaypahacer-prod.firebasestorage.app` (US-EAST1) · backend App Hosting `que-hay-pa-hacer` (us-east4, rama `main`). Develop: `quehaypahacer-develop`, backend `quehaypahacerdev`.

Leyenda: **[U]** lo corre el usuario con `! comando` (muta la nube o pide login/valores) · **[A]** lo puede correr el asistente (solo lectura) · **[?]** no se pudo verificar. Ningún valor secreto aparece en este doc.

Regla: no pasar al paso N+1 sin que la verificación del paso N dé OK. Verificación global en cualquier momento: `scripts/prod/preflight.sh quehaypahacer-prod` **[A]**.

## 0. Hallazgos previos (2026-10-11)

- Prod apunta hoy a la cuenta de facturación **01AA9E-5C1D58-6CA5D8 (cerrada)**; facturación desactivada. Nada de Secret Manager, Functions, Monitoring ni deploys funciona hasta resolverlo.
- Prod: faltan APIs `cloudscheduler` y `eventarc` (necesarias para `expirePremiumPlans` y los triggers de Storage/Firestore). Faltan además `cloudbilling` y `clouderrorreporting` (recomendadas).
- Prod: 0 índices Firestore (develop: 4, el repo también tiene 4 → sin desfase repo/develop en cantidad; la búsqueda por texto en prod no funciona sin ellos).
- Prod: bucket sin CORS. Develop tiene `*` (abierto; no copiar). `cors.json` del repo solo lista orígenes de develop y tiene `/` final en el origen (un origen CORS no lleva `/` final: probablemente no coincide). Se crea `scripts/prod/cors.prod.json`.
- `firebase/firestore.rules`, `firebase/storage.rules` y `firebase/firestore.indexes.json` **existen en el repo**, pero **ningún `firebase.json` los referencia** (el de `../` solo tiene `functions`; el del repo solo `apphosting` con `backendId: quehaypahacerdev`). Bloque a añadir en la sección 3c.
- Reglas: deny-all para escritura; lectura cliente solo del autor en `events`, `events/*/sessions`, `sites` (onSnapshot del editor). Storage: deny-all (se sube con URLs firmadas). Coincide con docs/14 y 05. No pude leer las reglas activas de develop con gcloud (sin comando de lectura): **[?]** compáralas en consola (Firestore > Reglas) antes de desplegar.
- `apphosting.production.yaml`: `NEXT_PUBLIC_SITE_URL` vale `https://quehaypahacer.web.app`, que no es la URL real del backend (`https://que-hay-pa-hacer--quehaypahacer-prod.us-east4.hosted.app`) ni un dominio propio. Corregir en el paso 9 al decidir dominio.
- Variables que el código usa y **ningún yaml declara** (en develop se inyectan fuera del yaml; existen secretos `firebaseApiKey`, `firebaseAppId`, `firebaseMeasurementId`, `firebaseMessagingSenderId`): `FIREBASE_API_KEY` (servidor), `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Sin ellas el login falla en prod.
- `apphosting.production.yaml` no declara `ANDROID_PACKAGE_NAME` (sí `apphosting.yaml`); de eso se ocupa docs/12.
- Functions: 18 en develop (11 en us-central1, 7 de Storage en us-east1). El bucket de prod está en US-EAST1, igual que develop: la región de los triggers Storage es consistente.
- Auth `cristianpee2609@gmail.com` tiene acceso de lectura a prod; falta confirmar que es Owner para facturación **[?]**.

## 1. Vincular facturación **[U]**

```
! gcloud billing projects link quehaypahacer-prod --billing-account=01451D-24E793-0A6800
```
Verificar **[A]**: `gcloud billing projects describe quehaypahacer-prod --format='value(billingEnabled,billingAccountName)'` → `True  billingAccounts/01451D-24E793-0A6800`.
Rollback: `! gcloud billing projects unlink quehaypahacer-prod` (apaga servicios de pago; los datos se conservan unos días, no es destructivo inmediato pero detiene la app). Requiere rol Billing Account User en la cuenta 01451D y Owner del proyecto **[?]**.

## 2. Habilitar APIs **[U]**

```
! gcloud services enable cloudscheduler.googleapis.com eventarc.googleapis.com cloudbilling.googleapis.com clouderrorreporting.googleapis.com --project quehaypahacer-prod
```
Ya habilitadas (no repetir): firestore, firebaserules, firebasestorage, firebaseapphosting, run, cloudbuild, artifactregistry, secretmanager, cloudfunctions, pubsub, identitytoolkit, monitoring, logging, iam.
Verificar **[A]**: `scripts/prod/preflight.sh quehaypahacer-prod` sin FALTA en APIs. Rollback: `gcloud services disable <api>` (no necesario).

## 3. Firestore, Storage y CORS

### 3a. Reglas e índices (CLI)
Añadir primero la sección `firestore`/`storage` a un `firebase.json` (3c). Después, **[U]** desde `QueHayPaHacer-copilot/`:
```
! firebase deploy --only firestore:rules,firestore:indexes,storage --project quehaypahacer-prod
```
Verificar **[A]**: `gcloud firestore indexes composite list --database=quehaypahacer-db --project quehaypahacer-prod` → 4 índices `READY` (la construcción puede tardar minutos; con la base vacía es rápido). Reglas: consola > Firestore > Reglas debe mostrar el deny-all del repo.
Rollback reglas: consola > Reglas > historial > restaurar versión anterior. Índices: `gcloud firestore indexes composite delete <id> --database=quehaypahacer-db`.

### 3b. CORS del bucket **[U]**
Editar primero `scripts/prod/cors.prod.json` si hay dominio propio (origen sin `/` final).
```
! gcloud storage buckets update gs://quehaypahacer-prod.firebasestorage.app --cors-file=scripts/prod/cors.prod.json
```
Verificar **[A]**: `gcloud storage buckets describe gs://quehaypahacer-prod.firebasestorage.app --format='value(cors_config)'`. Rollback: `--clear-cors`.

### 3c. Bloque para firebase.json (no editado: fuera del repo)
La base se llama `quehaypahacer-db`, por eso `firestore` es un array con `database`. Si se pone en `../firebase.json` (junto a `functions`), las rutas llevan el prefijo del repo; si se pone en el `firebase.json` del repo (recomendado, versionado), van sin prefijo. Variante para `../firebase.json`:
```json
  "firestore": [
    {
      "database": "quehaypahacer-db",
      "rules": "QueHayPaHacer-copilot/firebase/firestore.rules",
      "indexes": "QueHayPaHacer-copilot/firebase/firestore.indexes.json"
    }
  ],
  "storage": [
    { "bucket": "quehaypahacer-prod.firebasestorage.app", "rules": "QueHayPaHacer-copilot/firebase/storage.rules" }
  ],
```
Variante para el `firebase.json` del repo: mismas claves con `"firebase/firestore.rules"`, `"firebase/firestore.indexes.json"`, `"firebase/storage.rules"`. El bucket de `storage` depende del proyecto (`--project`), usar el de prod al desplegar a prod y el de develop al desplegar a develop (o dejar `"rules"` sin `bucket` para el bucket por defecto).

## 4. Secretos de App Hosting **[U]** (valores: los pone el usuario, nunca en chat)

Nombres exigidos por `apphosting.production.yaml` (los 4 primeros existen en develop; `siteRevalidateWebhookSecret` es nuevo, ver `docs/17-notificaciones.md`):
`firebaseServiceAccountJson` (JSON de cuenta de servicio de **prod**, no la de develop), `cookieSecretCurrent`, `cookieSecretPrevious` (generar valores nuevos, no reutilizar develop), `eventModerationWebhookSecret`, `siteRevalidateWebhookSecret` (el mismo valor va como secreto `SITE_REVALIDATE_WEBHOOK_SECRET` de las Cloud Functions de prod). **Después de crearlo y darle acceso, descomenta su bloque en `apphosting.production.yaml`** (hoy está como comentario "PENDIENTE": en develop ya está activo).
```
! firebase apphosting:secrets:set firebaseServiceAccountJson --project quehaypahacer-prod
! firebase apphosting:secrets:set cookieSecretCurrent --project quehaypahacer-prod
! firebase apphosting:secrets:set cookieSecretPrevious --project quehaypahacer-prod
! firebase apphosting:secrets:set eventModerationWebhookSecret --project quehaypahacer-prod
! firebase apphosting:secrets:set siteRevalidateWebhookSecret --project quehaypahacer-prod
! firebase apphosting:secrets:grantaccess firebaseServiceAccountJson,cookieSecretCurrent,cookieSecretPrevious,eventModerationWebhookSecret,siteRevalidateWebhookSecret --backend que-hay-pa-hacer --project quehaypahacer-prod
```
(el CLI pide el valor de forma interactiva; `set` también ofrece añadir la referencia al yaml: decir que NO, ya están). Verificar **[A]**: preflight (secretos por nombre). Rollback: `firebase apphosting:secrets:destroy <nombre>` / nueva versión con `set`.
Variantes de develop `firebaseAdminClientEmail`/`firebaseAdminPrivateKey` no las usa ningún yaml: no crear en prod.

## 5. Config web Firebase pública

Consola Firebase de `quehaypahacer-prod` > Configuración > App web (crear la app web si no existe) → copiar `apiKey`, `appId`, `messagingSenderId`, `measurementId`. Son públicas pero se mantienen fuera del repo como variables. **[U]** (copiar valores); **[?]** no pude comprobar si la app web de prod existe.

## 6. Variables de entorno del backend (Environment production / rama main) **[U]**

Consola > App Hosting > `que-hay-pa-hacer` > Settings > Environment (rama `main`), o añadirlas al `apphosting.production.yaml` (las públicas, vía PR). Lista:

| Variable | Valor | Disponibilidad |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `quehaypahacer-prod` (ya en yaml) | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `quehaypahacer-prod.firebaseapp.com` (ya) | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `quehaypahacer-prod.firebasestorage.app` (ya) | BUILD+RUNTIME |
| `NEXT_PUBLIC_SITE_URL` | URL final (paso 9) | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | paso 5 | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | paso 5 | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | paso 5 | BUILD+RUNTIME |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | paso 5 | BUILD+RUNTIME |
| `FIREBASE_API_KEY` | misma apiKey (servidor) | RUNTIME |
| `ANDROID_PACKAGE_NAME`, `ANDROID_SHA256_CERT_FINGERPRINTS` | docs/12 | RUNTIME |

No definir `NEXT_PUBLIC_AUTH_EMULATOR_HOST` en prod. `NEXT_PUBLIC_FIREBASE_AUTH_TENANT_ID` y `NEXT_PUBLIC_API_URL` no son necesarias. Verificar: el build del rollout no falla por variables faltantes y `/login` carga.

## 7. Cloud Functions a prod **[U]** (desde `../` = `QueHayPaHacerPruebas/`)

`functions/.env.quehaypahacer-prod` contiene solo `STORAGE_BUCKET` (leído por nombre; el valor debe ser `quehaypahacer-prod.firebasestorage.app` **[?]** confirmar). Requiere pasos 1 y 2.
```
! firebase deploy --only functions --project quehaypahacer-prod
```
(Hace lint + build por `predeploy`.) Verificar **[A]**: `gcloud functions list --project quehaypahacer-prod` → 18 ACTIVE (esperadas: las de develop). Primera vez en un proyecto puede fallar por permisos de Eventarc/Pub/Sub o de la cuenta de servicio de compilación: reintentar a los pocos minutos. Rollback: `firebase functions:delete <nombre> --project quehaypahacer-prod` o redeploy de la versión previa.

## 8. Alerta de reportes **[U]** (requiere functions + monitoring)
```
! scripts/setup-report-alert.sh quehaypahacer-prod quehaypahacer6@gmail.com
```
Idempotente. Verificar **[A]**: preflight (fila "Alerta de reportes"). Prueba real: paso 12 (reporte → correo). Rollback: `gcloud beta monitoring policies delete <id> --project quehaypahacer-prod`.

## 9. Dominio, SITE_URL, Auth y OAuth **[U]**

1. Consola App Hosting > Settings > Domains > añadir dominio propio y seguir los DNS. **[?]** dominio aún no definido.
2. Actualizar `NEXT_PUBLIC_SITE_URL` con la URL final (sin `/` final recomendada) en el Environment (paso 6) y en `apphosting.production.yaml`; añadir el dominio a `scripts/prod/cors.prod.json` y reaplicar 3b.
3. Authentication > Settings > Dominios autorizados: añadir dominio propio y `que-hay-pa-hacer--quehaypahacer-prod.us-east4.hosted.app` (y `quehaypahacer-prod.firebaseapp.com` ya viene).
4. Authentication > Sign-in method: habilitar los proveedores usados (correo, Google). Google: crear/usar un cliente OAuth Web en Google Cloud Console (APIs y servicios > Credenciales) del proyecto prod; orígenes JS autorizados = dominios del punto 3; URI de redirección `https://quehaypahacer-prod.firebaseapp.com/__/auth/handler` (y `https://<dominio propio>/__/auth/handler` si `AUTH_DOMAIN` apunta ahí). Pantalla de consentimiento OAuth publicada (no "Testing") **[?]**.
5. Plantillas de correo de Auth (verificación/restablecer) revisadas en la consola.

## 10. Seeds seguros

Solo scripts con `--apply`; todos hacen dry-run por defecto y usan `quehaypahacerAccountService.json` (la cuenta de servicio activa en el repo). **Antes de correr cualquier seed en prod, confirmar a qué proyecto apunta esa credencial** (`project_id` del JSON, sin mostrar la clave): si es de develop, hay que apuntar a una credencial de prod.

| Script | En prod |
|---|---|
| `seed-categories.ts` | SÍ (catálogo base) |
| `seed-badges.ts` | SÍ (idempotente) |
| `seed-campaigns.ts` | NO por defecto (campañas de ejemplo con Unsplash; crear reales desde el admin) |
| `seed-bulk-events.ts`, `seed-bulk-sites.ts`, `seed-event-analytics.ts`, `seed-events-with-collaborators.ts`, `seed-fake-users.ts`, `seed-invitations.ts`, `seed-site-events.ts`, `seed-site-interactions.ts`, `seed-site-new-fields.ts`, `seed-first-event-badge.ts` | **NO** (datos de prueba/ficticios) |
| `qa-elevate-user.ts`, `create-verified-creator.ts`, `cleanup-test-events.ts`, `reschedule-events.ts` | **NO** (QA/develop) |
| `backfill-*`, `migrate-*`, `repair-event-geopoints.ts`, `cleanup-*`, `deactivate-extra-categories.ts`, `link-events-to-site.ts` | NO: migraciones de datos de develop; prod arranca limpio |
| `set-user-plan.ts` | Solo bajo demanda (dar Premium manual) |
| `list-reports.ts` | SÍ, lectura/resolución de reportes |

```
! pnpm exec tsx scripts/seed-categories.ts            # dry-run
! pnpm exec tsx scripts/seed-categories.ts --apply
! pnpm exec tsx scripts/seed-badges.ts --apply
```
Verificar: colecciones `categories` y `badges` pobladas en consola. Rollback: borrar documentos creados desde la consola.

## 11. Rollout a main **[U]**

Pre-requisitos: pasos 1-9 en OK y `preflight.sh quehaypahacer-prod` sin FALTA. Integrar la rama de trabajo a `main` (PR, CI verde: `pnpm typecheck`, `pnpm test`, lint). El push a `main` dispara el rollout en `que-hay-pa-hacer`; o manual:
```
! firebase apphosting:rollouts:create que-hay-pa-hacer --git-branch main --project quehaypahacer-prod
```
Verificar **[A]**: `firebase apphosting:backends:get que-hay-pa-hacer --project quehaypahacer-prod` y abrir la URL. Rollback: consola App Hosting > Rollouts > redirigir tráfico al rollout anterior (o `git revert` + nuevo rollout). Datos y secretos no se tocan.

## 12. Prueba de humo (15 comprobaciones, en la URL de prod)

1. Home carga sin errores en consola; `/eventos`, `/explorar`, `/donde-ir` listan (vacíos o con seed de categorías).
2. Registro con correo: las casillas legales (términos/tratamiento de datos) son obligatorias y quedan guardadas.
3. Verificación de correo llega y funciona.
4. Login con Google (dominio autorizado + OAuth).
5. Cerrar sesión / sesión persiste tras recargar (cookies firmadas; secretos OK).
6. Crear evento: wizard sube imagen (URL firmada + CORS) y se optimiza (functions Storage).
7. Publicar evento exige la declaración de responsabilidad y la guarda.
8. Moderación del evento: webhook `POST /api/events/moderation` con el Bearer correcto responde 2xx; el evento cambia de estado.
9. Búsqueda por texto devuelve resultados (índices tokenizados READY).
10. Inscripción a un evento y QR de check-in funciona en un evento con control de asistencia.
11. Reportar un contenido → llega correo a quehaypahacer6@gmail.com en ≤ 5 min.
12. Equipo/roles: invitar a un colaborador, aceptar, verificar permisos por rol en Studio.
13. Crear un sitio (Mis Sitios) y verlo en `/donde-ir`.
14. PWA: Lighthouse/Chrome muestra "instalable"; `manifest.webmanifest` y service worker sirven desde prod; `/.well-known/assetlinks.json` responde (docs/12).
15. `sitemap.xml` y `robots.txt` apuntan al dominio de prod (SITE_URL correcto); sin referencias a develop en el HTML.
Y: `gcloud functions logs read notifyNewReport --project quehaypahacer-prod --limit 5` **[A]** sin errores.

## 13. Presupuesto, copias y monitoreo **[U]**

- Presupuesto con alertas de gasto (al 50/90/100 %) sobre la cuenta 01451D (compartida con develop; idealmente filtrar por proyecto):
```
! gcloud billing budgets create --billing-account=01451D-24E793-0A6800 --display-name="QHPA prod" --budget-amount=<USD> --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 --filter-projects=projects/quehaypahacer-prod
```
  (necesita la API billingbudgets; `<USD>` lo decide el usuario **[?]**.)
- Copias de seguridad Firestore (export programado, diario con retención 7 días; Enterprise soporta backup schedules):
```
! gcloud firestore backups schedules create --database=quehaypahacer-db --recurrence=daily --retention=7d --project quehaypahacer-prod
```
  Verificar: `gcloud firestore backups schedules list --database=quehaypahacer-db --project quehaypahacer-prod`. Alternativa: `gcloud firestore export gs://<bucket-de-backups>`. Habilitar también PITR si se desea (`gcloud firestore databases update --database=quehaypahacer-db --enable-pitr`). **[?]** comandos no probados en este proyecto.
- Monitoreo: alerta de reportes (paso 8); añadir alerta de errores 5xx de Cloud Run y de fallos de Functions; revisar Error Reporting y Logs semanalmente.
- Cloud Run: `minInstances: 0` (cold start aceptable; ver docs/05).

## Estado al 2026-10-11 (salida de `scripts/prod/preflight.sh`, solo lectura)

**quehaypahacer-develop: todo OK** (facturación 01451D, 28 comprobaciones OK: APIs, base, 4/4 índices READY, bucket, CORS, backend `quehaypahacerdev`, 4 secretos, 18/18 functions, alerta).

**quehaypahacer-prod: hay FALTA**
- FALTA: facturación (cuenta cerrada 01AA9E-5C1D58-6CA5D8, billingEnabled=False)
- FALTA: APIs `cloudscheduler`, `eventarc`
- FALTA: índices Firestore (0/4)
- FALTA: CORS del bucket
- FALTA: Cloud Functions (ninguna)
- FALTA: alerta de reportes
- N/D: secretos (Secret Manager exige facturación)
- OK: APIs restantes, base `quehaypahacer-db`, bucket, backend `que-hay-pa-hacer`.

No verificable: reglas activas en develop, app web y OAuth de prod, rol de la cuenta sobre la facturación 01451D, dominio propio, valor de `STORAGE_BUCKET` en el `.env` de prod.

## Notas del despliegue real (2026-10-18)

Lo que pasó al ejecutar los pasos 2, 3 y 7 en `quehaypahacer-prod`, para no repetir los tropiezos:

- **Índices de búsqueda:** `firebase-tools` 14.9.0 no entiende `searchConfig` (falla con "Must contain exactly one of order,arrayConfig,vectorConfig"). Se desplegaron con `npx -y firebase-tools@latest deploy --only firestore:quehaypahacer-db:indexes ...` (15.34.0). **Nunca usar `--force`** ahí: dice que hay 4 índices "que no están en el archivo" (la comparación no reconoce los de búsqueda) y se ofrece a borrarlos.
- **Reglas de Firestore por separado:** repetir el despliegue de `firestore:...:rules` con el archivo de índices presente da 409 (índices ya existen). Para soltar solo las reglas, usar un `firebase.json` temporal sin la clave `indexes`.
- **Storage:** con la versión nueva hay que poner `"bucket": "quehaypahacer-prod.firebasestorage.app"` en el bloque `storage` solo para desplegar (en el repo queda sin bucket para no atarlo a prod).
- **Reglas de Firestore anteriores de prod:** cualquier usuario con sesión podía leer toda la base. Las del repo lo cierran.
- **Cloud Functions (20):** exigen `--force` (siete funciones nuevas con reintentos). La primera vez hay que dar estos roles al proyecto: `roles/pubsub.publisher` a `service-<n>@gs-project-accounts`, `roles/iam.serviceAccountTokenCreator` a `service-<n>@gcp-sa-pubsub`, `roles/run.invoker` y `roles/eventarc.eventReceiver` a `<n>-compute@developer`; y crear las identidades (`gcloud beta services identity create --service=pubsub.googleapis.com` y `eventarc.googleapis.com`). Tras crear el agente de Eventarc, **esperar ~3 min** antes de desplegar (si no, "Permission denied while using the Eventarc Service Agent").
- **`optimizeProfileMedia`** falló una vez por escritura concurrente de metadatos del bucket y quedó como función HTTP rota: se borró (`firebase functions:delete optimizeProfileMedia --region us-east1 --force`) y se volvió a desplegar solo esa.
- **URL temporal:** `REVALIDATE_APP_URL` y el CORS apuntan a `https://que-hay-pa-hacer--quehaypahacer-prod.us-east4.hosted.app`. Al tener dominio propio: cambiar `functions/.env.quehaypahacer-prod`, redesplegar `notifySiteModeration` y `notifyEventChanges`, añadir el origen a `scripts/prod/cors.prod.json` y reaplicarlo, y poner `NEXT_PUBLIC_SITE_URL`.
- **Secretos de prod:** además de los 5 de hosting, existen `firebaseApiKey`, `firebaseAppId`, `firebaseMeasurementId` y `firebaseMessagingSenderId` (declarados en `apphosting.production.yaml`) y `SITE_REVALIDATE_WEBHOOK_SECRET` (functions).
