#!/usr/bin/env bash
# Preflight de despliegue. SOLO LECTURA (describe/list/get). No muta nada.
# Uso: scripts/prod/preflight.sh <project-id> [backend-id]
#   scripts/prod/preflight.sh quehaypahacer-prod
#   scripts/prod/preflight.sh quehaypahacer-develop quehaypahacerdev
# Imprime una tabla OK/FALTA/N/D (N/D = no se pudo verificar). Sale 1 si hay algún FALTA.
set -uo pipefail

P="${1:?Falta el id del proyecto}"
DB="quehaypahacer-db"
case "$P" in
  quehaypahacer-prod) BACKEND="${2:-que-hay-pa-hacer}" ;;
  *) BACKEND="${2:-quehaypahacerdev}" ;;
esac
BUCKET="$P.firebasestorage.app"
FAIL=0
row() { printf '%-6s %-44s %s\n' "$1" "$2" "$3"; [ "$1" = FALTA ] && FAIL=1; return 0; }

# --- facturación
B="$(gcloud billing projects describe "$P" --format='value(billingEnabled)' 2>/dev/null)"
ACC="$(gcloud billing projects describe "$P" --format='value(billingAccountName)' 2>/dev/null)"
if [ "$B" = "True" ]; then row OK "Facturación activa" "$ACC"
elif [ -z "$B" ]; then row N/D "Facturación" "sin permiso/auth"
else row FALTA "Facturación activa" "desactivada (cuenta actual: ${ACC:-ninguna})"; fi

# --- APIs
ENABLED="$(gcloud services list --enabled --project "$P" --format='value(config.name)' 2>/dev/null)"
if [ -z "$ENABLED" ]; then row N/D "APIs" "no se pudo listar"; else
  for api in firestore firebaserules firebasestorage firebaseapphosting run cloudbuild artifactregistry \
    secretmanager cloudfunctions cloudscheduler eventarc pubsub identitytoolkit monitoring logging iam; do
    if grep -qx "$api.googleapis.com" <<<"$ENABLED"; then row OK "API $api" ""; else row FALTA "API $api" "gcloud services enable $api.googleapis.com"; fi
  done
fi

# --- Firestore
DBS="$(gcloud firestore databases list --project "$P" --format='value(name)' 2>/dev/null)"
if grep -q "/databases/$DB\$" <<<"$DBS"; then row OK "Firestore $DB" ""; else row FALTA "Firestore $DB" "no existe"; fi
IDX="$(gcloud firestore indexes composite list --database="$DB" --project "$P" --format='value(state)' 2>/dev/null)"
N=$(grep -c . <<<"$IDX"); NR=$(grep -c '^READY$' <<<"$IDX")
if [ "$N" -ge 4 ] && [ "$N" = "$NR" ]; then row OK "Índices Firestore READY" "$NR/$N (repo espera 4)"
else row FALTA "Índices Firestore READY" "$NR/$N listos (repo espera 4: firebase deploy --only firestore:indexes)"; fi

# --- Storage
if gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then
  row OK "Bucket $BUCKET" ""
  CORS="$(gcloud storage buckets describe "gs://$BUCKET" --format='value(cors_config)' 2>/dev/null)"
  if [ -n "$CORS" ]; then row OK "CORS del bucket" ""; else row FALTA "CORS del bucket" "ver docs/15 paso 3"; fi
else row FALTA "Bucket $BUCKET" "no existe/sin acceso"; fi

# --- App Hosting
BL="$(firebase apphosting:backends:list --project "$P" 2>/dev/null)"
if grep -q " $BACKEND " <<<"$BL"; then row OK "Backend App Hosting $BACKEND" ""; else row FALTA "Backend App Hosting $BACKEND" "no existe"; fi

# --- Secretos por nombre (sin leer valores)
SEC="$(gcloud secrets list --project "$P" --format='value(name.basename())' 2>/dev/null)"
if [ -z "$SEC" ]; then row N/D "Secretos" "no se pudo listar (¿sin facturación/permisos?)"; else
  for s in firebaseServiceAccountJson cookieSecretCurrent cookieSecretPrevious eventModerationWebhookSecret; do
    if grep -qx "$s" <<<"$SEC"; then row OK "Secreto $s" ""; else row FALTA "Secreto $s" "firebase apphosting:secrets:set $s"; fi
  done
fi

# --- Functions (esperadas: las 18 de develop)
FN="$(gcloud functions list --project "$P" --format='value(name.basename(),state)' 2>/dev/null)"
if [ -z "$FN" ]; then row FALTA "Cloud Functions desplegadas" "ninguna (o sin acceso)"; else
  NF=$(grep -c . <<<"$FN"); NA=$(grep -c 'ACTIVE' <<<"$FN")
  if [ "$NA" -ge 18 ]; then row OK "Cloud Functions ACTIVE" "$NA/$NF"; else row FALTA "Cloud Functions ACTIVE" "$NA/$NF (esperadas 18)"; fi
  grep -q '^notifyNewReport' <<<"$FN" && row OK "Function notifyNewReport" "" || row FALTA "Function notifyNewReport" ""
fi

# --- Alerta de reportes
AL="$(gcloud beta monitoring policies list --project "$P" --format='value(displayName)' 2>/dev/null)"
if grep -q 'QHPA: nuevo reporte de contenido' <<<"$AL"; then row OK "Alerta de reportes" ""; else row FALTA "Alerta de reportes" "scripts/setup-report-alert.sh $P <correo>"; fi

echo; [ "$FAIL" = 0 ] && echo "RESULTADO: todo OK" || echo "RESULTADO: hay FALTA"
exit "$FAIL"
