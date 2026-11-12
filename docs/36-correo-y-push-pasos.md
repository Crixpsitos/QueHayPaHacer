# Correo (Resend) y avisos push: lo que falta configurar

El código está listo y **apagado** hasta que existan estas variables. Sin ellas no se envía nada y las pantallas lo dicen.

## Variables (solo NOMBRES; nunca pegues valores en chats ni en git)
| Variable | Qué es | Dónde |
|---|---|---|
| `RESEND_API_KEY` | clave de la API de Resend | secreto de App Hosting |
| `EMAIL_FROM` | remitente, p. ej. `Qué Hay Pa Hacer <avisos@yquehaypahacer.com>` | variable normal |
| `EMAIL_UNSUBSCRIBE_SECRET` | secreto de la baja con un clic (`openssl rand -base64 32`) | secreto de App Hosting |
| `EMAIL_DAILY_CAP` | tope de correos por día (por defecto 100 = plan gratis de Resend) | variable normal |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | clave pública VAPID de Firebase Cloud Messaging | variable normal (se compila) |

## Resend (correo)
1. Crear cuenta en resend.com (plan gratis: 100 correos/día, 3.000/mes).
2. Domains → Add Domain → un subdominio como `avisos.yquehaypahacer.com` (más seguro que usar el dominio raíz).
3. Resend muestra registros DNS (SPF `TXT`, DKIM y DMARC recomendado). Copiarlos en el panel DNS del registrador y esperar a que Resend marque **Verified**.
4. API Keys → Create (permiso «Sending access», solo ese dominio). Copiar la clave UNA vez.
5. Guardar secretos (develop primero): `firebase apphosting:secrets:set resendApiKey --project quehaypahacer-develop` y lo mismo con `emailUnsubscribeSecret`. Dar acceso: `firebase apphosting:secrets:grantaccess resendApiKey --backend quehaypahacerdev --project quehaypahacer-develop`.
6. En `apphosting.yaml` descomentar las líneas del final (RESEND, secreto de baja, `EMAIL_FROM`, `EMAIL_DAILY_CAP`) y hacer push a `develop`.
7. Probar: «Mis avisos» → activar «Qué hacer esta semana» + casilla. Forzar la corrida: `gcloud scheduler jobs run firebase-schedule-sendActivityReminders-us-central1 --location=us-central1 --project=quehaypahacer-develop`. Revisar que no caiga en spam (Gmail y Outlook).

## Push web (FCM)
1. Firebase Console → Configuración del proyecto → Cloud Messaging.
2. «Configuración web» → Generar par de claves (Web Push certificates). Copiar la **clave pública**.
3. Ponerla como `NEXT_PUBLIC_FIREBASE_VAPID_KEY` en `apphosting.yaml` (redeploy: se compila).
4. Confirmar que «Firebase Cloud Messaging API (V1)» está habilitada en Google Cloud.
5. Probar en Android (Chrome) y escritorio: «Mis avisos» → activar push → aceptar el permiso → reservar una actividad → llega el aviso. iPhone: solo con la app instalada (Compartir → Añadir a pantalla de inicio).

## Producción
Repetir con el proyecto `quehaypahacer-prod` (backend `que-hay-pa-hacer`) y `apphosting.production.yaml`.
