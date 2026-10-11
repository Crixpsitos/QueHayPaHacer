#!/usr/bin/env bash
# Crea (si no existen) un canal de correo y una alerta de Cloud Monitoring que te escribe cuando
# entra un reporte de contenido. La Cloud Function `notifyNewReport` (repo functions) deja el log
# `alert=qhpa_new_report`; la alerta filtra por él.
#
# Uso:  scripts/setup-report-alert.sh <project-id> <correo>
#   scripts/setup-report-alert.sh quehaypahacer-develop tu@correo.com
#   scripts/setup-report-alert.sh quehaypahacer-prod    tu@correo.com
set -euo pipefail

PROJECT="${1:?Falta el id del proyecto}"
EMAIL="${2:?Falta el correo}"
CHANNEL_NAME="QHPA reportes ($EMAIL)"
POLICY_NAME="QHPA: nuevo reporte de contenido"

CHANNEL="$(gcloud beta monitoring channels list --project "$PROJECT" \
  --filter="displayName=\"$CHANNEL_NAME\"" --format='value(name)' | head -1)"
if [ -z "$CHANNEL" ]; then
  CHANNEL="$(gcloud beta monitoring channels create --project "$PROJECT" \
    --display-name="$CHANNEL_NAME" --type=email \
    --channel-labels="email_address=$EMAIL" --format='value(name)')"
  echo "canal creado: $CHANNEL"
fi

if [ -n "$(gcloud beta monitoring policies list --project "$PROJECT" \
  --filter="displayName=\"$POLICY_NAME\"" --format='value(name)' | head -1)" ]; then
  echo "la alerta ya existe; nada que hacer"
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
      "displayName": "Log de nuevo reporte",
      "conditionMatchedLog": { "filter": "jsonPayload.alert=\"qhpa_new_report\"" }
    }
  ],
  "alertStrategy": { "notificationRateLimit": { "period": "300s" } },
  "notificationChannels": ["$CHANNEL"],
  "documentation": {
    "mimeType": "text/markdown",
    "content": "Entró un reporte de contenido. Revísalo y atiéndelo lo antes posible:\n\n\`pnpm exec tsx scripts/list-reports.ts\`\n\nPara marcarlo resuelto: \`--resolve <id> --apply\`."
  }
}
JSON

gcloud beta monitoring policies create --project "$PROJECT" --policy-from-file="$POLICY_FILE" --format='value(name)'
echo "alerta creada. Te avisará a $EMAIL (máx. un correo cada 5 min)."
