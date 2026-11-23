#!/usr/bin/env bash
# Crea (si no existe) una alerta de Cloud Monitoring que te escribe por correo cuando entra algo que hay que atender en el
# panel de administración: un mensaje de Contáctanos, un ticket de soporte o un reclamo de sitio. Las Cloud Functions
# `notifyNewContact`, `notifyNewSupportTicket` y `notifyNewSiteClaim` (repo functions) dejan el log `alert=qhpa_new_inbox`.
# Reutiliza el canal de correo de la alerta de reportes (scripts/setup-report-alert.sh).
#
# Uso:  scripts/setup-inbox-alert.sh <project-id> <correo>   (idempotente)
set -euo pipefail

PROJECT="${1:?Falta el id del proyecto}"
EMAIL="${2:?Falta el correo}"
CHANNEL_NAME="QHPA reportes ($EMAIL)"
POLICY_NAME="QHPA: algo nuevo que atender en el panel"

CHANNEL="$(gcloud beta monitoring channels list --project "$PROJECT" \
  --filter="displayName=\"$CHANNEL_NAME\"" --format='value(name)' | head -1)"
if [ -z "$CHANNEL" ]; then
  CHANNEL="$(gcloud beta monitoring channels create --project "$PROJECT" \
    --display-name="$CHANNEL_NAME" --type=email \
    --channel-labels="email_address=$EMAIL" --format='value(name)')"
  echo "canal creado: $CHANNEL"
fi

EXISTING="$(gcloud beta monitoring policies list --project "$PROJECT" \
  --filter="displayName=\"$POLICY_NAME\"" --format='value(name)' | head -1)"
if [ -n "$EXISTING" ]; then
  gcloud beta monitoring policies update "$EXISTING" --project "$PROJECT" --set-notification-channels="$CHANNEL"
  echo "la alerta ya existía; ahora avisa a $EMAIL"
  exit 0
fi

POLICY_FILE="$(mktemp)"
trap 'rm -f "$POLICY_FILE"' EXIT
cat > "$POLICY_FILE" <<JSON
{
  "displayName": "$POLICY_NAME",
  "combiner": "OR",
  "enabled": true,
  "conditions": [
    {
      "displayName": "Log de bandeja de entrada",
      "conditionMatchedLog": { "filter": "jsonPayload.alert=\"qhpa_new_inbox\"" }
    }
  ],
  "alertStrategy": { "notificationRateLimit": { "period": "300s" } },
  "notificationChannels": ["$CHANNEL"],
  "documentation": {
    "mimeType": "text/markdown",
    "content": "Entró un mensaje de Contáctanos, un ticket de soporte o un reclamo de sitio. Ábrelo en el panel de administración (qhpa-admin.web.app) y respóndelo."
  }
}
JSON

gcloud beta monitoring policies create --project "$PROJECT" --policy-from-file="$POLICY_FILE" --format='value(name)'
echo "alerta creada. Te avisará a $EMAIL (máx. un correo cada 5 min)."
