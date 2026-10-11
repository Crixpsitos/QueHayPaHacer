# Infraestructura, despliegue y operación

## 1. Alojamiento confirmado

El código está preparado para **Firebase App Hosting**, que ejecuta el backend Next.js sobre infraestructura administrada de Google Cloud/Cloud Run.

### Desarrollo

- Backend ID: `quehaypahacerdev`.
- Proyecto: `quehaypahacer-develop`.
- URL configurada: `https://quehaypahacerdev--quehaypahacer-develop.us-central1.hosted.app/`.
- Auth domain: `quehaypahacer-develop.firebaseapp.com`.
- Storage: `quehaypahacer-develop.firebasestorage.app`.
- Run config: 1 CPU, 1024 MiB, `minInstances: 0`.

### Producción

- Proyecto: `quehaypahacer-prod`.
- URL configurada: `https://quehaypahacer.web.app`.
- Auth domain: `quehaypahacer-prod.firebaseapp.com`.
- Storage: `quehaypahacer-prod.firebasestorage.app`.
- `apphosting.production.yaml` no declara capacidad de Cloud Run; debe confirmarse qué defaults o configuración de consola aplica.

### Código fuente

- GitHub: `Crixpsitos/QueHayPaHacer`.
- CI versionado desde el **2026-10-10** en `.github/workflows/ci.yml` (sin deploy). Ver §11.
- La vinculación exacta entre rama y backend App Hosting debe confirmarse en Firebase Console.

## 2. Servicios administrados

| Servicio | Uso |
|---|---|
| Firebase Auth / Identity Platform | Email/password, Google, tenant opcional. |
| Firestore `quehaypahacer-db` | Persistencia principal. |
| Firebase/Google Cloud Storage | Avatares, banners y media. |
| Firebase App Hosting / Cloud Run | Ejecución Next.js. |
| Redis/Upstash | Ya no se usa desde el **2026-10-10** (handler y dependencias eliminados). La instancia sigue existiendo; no se tocó. |
| Photon (Komoot) | Geocoding forward/reverse. |
| MapLibre/OpenFreeMap | Mapas de sitios. |
| Firebase Analytics | Cliente, si measurementId y navegador lo permiten. |

Meilisearch aparece solo como metadata/flags heredados; no se encontró un servicio de sincronización operativo. No debe declararse como dependencia de producción activa.

## 3. Variables de entorno

### Públicas

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_AUTH_TENANT_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_AUTH_EMULATOR_HOST`

### Servidor/secretos

- `FIREBASE_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `COOKIE_SECRET_CURRENT`
- `COOKIE_SECRET_PREVIOUS`
- `EVENT_MODERATION_WEBHOOK_SECRET`
- `STUDIO_PIPELINE_MEM_DEBUG`

`REDIS_URL` y `UPSTASH_REDIS_REST_*` dejaron de usarse el **2026-10-10**.

Los valores nunca deben almacenarse en docs, logs, tickets o respuestas de IA.

## 4. Gestión de secretos

App Hosting referencia secretos con nombres:

- `firebaseServiceAccountJson`;
- `cookieSecretCurrent`;
- `cookieSecretPrevious`;
- `eventModerationWebhookSecret`.

`REDIS_URL`/`UPSTASH_*` ya no los usa el código (cache handler eliminado el **2026-10-10**); retirarlos de la consola/ambientes si existen.

Faltan runbooks para:

- rotación de cookie secrets;
- rotación de service account;
- cambio de webhook secret;
- baja/retención de la instancia Redis ya sin uso;
- revocación de un acceso humano.

## 5. Storage y uploads

`FirebaseStorageService` implementa:

- upload directo desde servidor;
- signed URL de lectura por 7 días para contenido privado;
- signed URL V4 de escritura por 15 minutos (`presentation/shared/actions/generateUploadUrl.ts`; desde el **2026-10-10** exige sesión y valida allowlists: entidad `profile`/`support` (solo carpeta del propio uid), `events`/`sessions`/`sites`; `entityId` y subcarpeta permitidos; `contentType` solo `image/*` sin SVG o `video/*`; claves de metadata; `fileName` sanitizado + UUID);
- URL pública `storage.googleapis.com`;
- delete.

El **2026-10-10** se eliminaron `uploadMany`, `TransferManager` y la lógica de archivos temporales (código muerto y con bug de rutas de destino) junto con la dependencia directa `@google-cloud/storage@7.22`. Queda una sola versión, 8.2.0, transitiva vía `firebase-admin`. Ya no hay filesystem temporal en Cloud Run.

Riesgos:

- **sin tope de tamaño** en la URL firmada: `StorageService.generateSignedUrl` no deja pasar `x-goog-content-length-range` (requiere cambio de headers firmados y prueba);
- no hay límites de cantidad a nivel operativo;
- no hay proceso de limpieza de blobs huérfanos;
- contenido privado depende de regenerar URL tras 7 días.

## 6. CORS

`cors.json` permite:

- `http://localhost:3000`;
- URL del ambiente dev;
- GET, POST, PUT, DELETE, HEAD y OPTIONS;
- headers de upload/metadata.

Pendientes:

- añadir/verificar origen de producción;
- confirmar si la URL dev con slash final coincide con la validación del bucket;
- documentar comando de aplicación de CORS;
- probar upload desde cada dominio permitido.

## 7. Redis y caché distribuido

Desde el **2026-10-10** no hay cache handler Redis: `cache-handler.js` y `cacheHandlers` de `next.config.ts` fueron eliminados, igual que las dependencias `redis` y `@upstash/redis`. Motivo: no implementaba invalidación por tags (`updateTag`/`revalidateTag` nunca invalidaban Redis), conectaba al importar sin fallback y `REDIS_URL` no estaba en los YAML de App Hosting.

Estado actual: handler en memoria por defecto de Next, por instancia. Techo: no hay invalidación entre instancias; cada instancia sirve datos viejos hasta expirar (Cloud Run `minInstances: 0`). Reintroducir un handler compartido solo con invalidación real de tags, `refreshTags` y fallback.

Histórico: durante validación local el 2026-09-26 se observó:

```text
ERR DB capacity quota exceeded
Threshold: 268435456 bytes
Usage: 268652334 bytes
```

La instancia Redis no se vació ni se tocó; queda pendiente decidir su baja.

## 8. Moderación externa

`POST /api/events/moderation` usa Bearer secret y comparación `timingSafeEqual`. Aplica decisión, promoción a creator, insignia del primer evento e invalidación.

Faltan:

- idempotency key;
- retries/dead-letter documentados;
- auditoría inmutable de solicitudes;
- allowlist o rate limiting;
- alertas ante 401/500;
- runbook de reenvío seguro.

## 9. Scripts operativos

Hay 31 scripts agrupables en:

- seeds de categorías, eventos, sitios, campañas, usuarios, badges e invitaciones;
- backfills de score, interacción, fechas, slugs y siteIds;
- migraciones de location/categorías;
- limpieza de categorías, likes y eventos de prueba;
- auditorías/verificaciones;
- creación de creador verificado.

Problemas operativos:

- no todos están expuestos como scripts npm/pnpm;
- no existe índice de precondiciones, dry-run, idempotencia y rollback;
- ejecutarlos depende de credenciales locales potentes;
- no hay bitácora central de qué migración corrió en cada ambiente;
- el seed de insignias ya no es accesible por HTTP desde el **2026-10-10** (ver §13).

## 10. Observabilidad

Estado actual:

- `instrumentation.ts` vacío;
- logging mediante `console.log/error/warn` en decenas de archivos;
- logs de depuración y emojis presentes en paths de producción;
- sin Sentry, OpenTelemetry o logger estructurado detectado;
- sin métricas/alertas versionadas;
- Firebase/Cloud Run provee logs de plataforma, pero no hay correlación de request ni error IDs de aplicación.

Mínimo de release:

- logger estructurado con redacción de PII;
- error tracking;
- request/correlation ID;
- dashboards de 5xx, latencia, cold starts, Firestore y Storage;
- alertas de cuota/coste;
- trazas de publicación, registro, moderación y upload.

## 11. CI/CD

Desde el **2026-10-10** existe `.github/workflows/ci.yml` (PR y push a `main`/`develop`):

1. lockfile único (falla si existe `package-lock.json` o `yarn.lock`);
2. grep de secretos commiteados;
3. `pnpm install --frozen-lockfile`;
4. `pnpm typecheck`;
5. `pnpm test`;
6. `lint` con `continue-on-error` hasta cero errores ESLint (P1);
7. Sin `build`: Firebase App Hosting compila en cada rollout; CI solo gatea el PR antes del merge y no necesita secretos.

Secrets requeridos en GitHub: `FIREBASE_SERVICE_ACCOUNT_JSON`, `COOKIE_SECRET_CURRENT`, `COOKIE_SECRET_PREVIOUS`, `EVENT_MODERATION_WEBHOOK_SECRET`, `FIREBASE_API_KEY`. Vars: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_SITE_URL`. Debe configurarlos el owner.

Abierto: el check de lockfile falla mientras `package-lock.json` siga versionado (pendiente acuerdo del owner).

Falta: smoke tests, deploy a dev, aprobación manual para producción, smoke postdeploy y tag/release.

## 12. Backup, recuperación y continuidad

No se encontró configuración versionada para:

- backup programado de Firestore;
- retención de backups;
- restauración probada;
- versionado/lifecycle de Storage;
- rollback de App Hosting;
- disaster recovery;
- RPO/RTO.

Estos datos deben definirse antes de producción. Tener Firebase administrado no sustituye un plan de recuperación.

## 13. Runbooks imprescindibles

1. Setup local y emuladores.
2. Despliegue dev/prod.
3. Rollback.
4. Rotación de secretos.
5. Cache desactualizado entre instancias.
6. Firestore/Storage con cuota excedida.
7. Moderación atascada.
8. Upload/procesamiento de medios fallido.
9. Migración y backfill.
10. Eliminación de cuenta/datos.
11. Incidente de seguridad.
12. Restauración de backup.

### Seed de insignias

```bash
pnpm exec tsx scripts/seed-badges.ts          # dry-run (por defecto)
pnpm exec tsx scripts/seed-badges.ts --apply  # escribe
```

Idempotente. Reemplaza al endpoint `GET /api/admin/seed-badges`, eliminado el **2026-10-10**.

### Reglas e índices Firebase

- `firebase/firestore.rules` y `firebase/storage.rules`: **propuesta**, no cableada en `firebase.json` ni desplegada.
- `firebase/firestore.indexes.json`: export de solo lectura de develop (4 índices).

Antes de desplegar:

1. hacer diff de las reglas propuestas contra las activas en Firebase Console de cada proyecto;
2. probarlas con emulador (`@firebase/rules-unit-testing`, pendiente);
3. tras revisión, cablear en `firebase.json` y desplegar con `firebase deploy --only firestore:rules,storage` contra el proyecto objetivo;
4. índices: `firebase deploy --only firestore:indexes`. Prod (`quehaypahacer-prod/quehaypahacer-db`) tiene 0 índices. Firestore Enterprise (modo nativo) ejecuta consultas sin índice vía table scan (más lento/costoso); la búsqueda por texto sí requiere el índice tokenizado → **bloqueo de release para búsqueda**, riesgo de costo para el resto.

Verificación de solo lectura: `firebase firestore:indexes` y `firebase firestore:databases:list`.

## 14. Costos a controlar

- lecturas/escrituras/índices de Firestore;
- pipelines Enterprise de Studio;
- egress y almacenamiento de media;
- optimización de imágenes;
- instancias y cold starts de App Hosting;
- mapas/geocoding sujetos a políticas externas;
- logs y retención.

No se encontraron presupuestos ni alertas de coste versionados. Deben existir en Google Cloud/Firebase/Upstash y tener responsables.