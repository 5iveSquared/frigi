#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-name-chain-439816}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-frigi-api}"
RUNTIME_SERVICE_ACCOUNT="${RUNTIME_SERVICE_ACCOUNT:-fashionfriend@name-chain-439816.iam.gserviceaccount.com}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/run"
IMAGE_NAME="${SERVICE_NAME}"
IMAGE_TAG="${1:-$(date +%Y%m%d-%H%M%S)}"
IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
GCLOUD_ACCOUNT="${CLOUDSDK_CORE_ACCOUNT:-fashionfriend@name-chain-439816.iam.gserviceaccount.com}"
INCLUDE_OPENAI_API_KEY="${INCLUDE_OPENAI_API_KEY:-false}"
USE_SECRET_MANAGER="${USE_SECRET_MANAGER:-false}"
INCLUDE_OPENAI_API_KEY_LC="$(printf '%s' "${INCLUDE_OPENAI_API_KEY}" | tr '[:upper:]' '[:lower:]')"
USE_SECRET_MANAGER_LC="$(printf '%s' "${USE_SECRET_MANAGER}" | tr '[:upper:]' '[:lower:]')"

ENV_FILE="$(mktemp)"
cleanup() {
  rm -f "${ENV_FILE}"
}
trap cleanup EXIT

python3 <<'PY' > "${ENV_FILE}"
import json
import os
from pathlib import Path

env = {}
for line in Path("backend/.env").read_text().splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        continue
    key, value = stripped.split("=", 1)
    env[key] = value

deploy_env = {
    "DATABASE_URL": env["DATABASE_URL"],
    "DB_SCHEMA": env.get("DB_SCHEMA", "frigi"),
    "REDIS_URL": env.get("REDIS_URL", "redis://localhost:6379/0"),
    "SECRET_KEY": env["SECRET_KEY"],
    "ACCESS_TOKEN_EXPIRE_MINUTES": env.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"),
    "DEBUG": "false",
    "LOG_LEVEL": env.get("LOG_LEVEL", "info"),
}

if os.environ.get("INCLUDE_OPENAI_API_KEY", "").lower() in {"1", "true", "yes"}:
    deploy_env["OPENAI_API_KEY"] = env.get("OPENAI_API_KEY", "")

for key, value in deploy_env.items():
    print(f"{key}: {json.dumps(value)}")
PY

echo "[deploy] building ${IMAGE}"
BUILD_ID="$(
  CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" \
  gcloud builds submit \
    --project="${PROJECT_ID}" \
    --tag "${IMAGE}" \
    --async \
    --format='value(id)' \
    backend/
)"

echo "[deploy] build id: ${BUILD_ID}"
while true; do
  BUILD_STATUS="$(
    CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" \
    gcloud builds describe "${BUILD_ID}" \
      --project="${PROJECT_ID}" \
      --format='value(status)'
  )"

  case "${BUILD_STATUS}" in
    QUEUED|PENDING|WORKING)
      sleep 5
      ;;
    SUCCESS)
      break
      ;;
    *)
      echo "[deploy] build failed with status: ${BUILD_STATUS}" >&2
      exit 1
      ;;
  esac
done

echo "[deploy] deploying ${SERVICE_NAME}"
DEPLOY_ARGS=(
  run deploy "${SERVICE_NAME}"
  --project="${PROJECT_ID}"
  --region="${REGION}"
  --platform=managed
  --allow-unauthenticated
  --service-account="${RUNTIME_SERVICE_ACCOUNT}"
  --image="${IMAGE}"
  --port=8080
)

if [[ "${USE_SECRET_MANAGER_LC}" == "true" || "${USE_SECRET_MANAGER}" == "1" ]]; then
  DEPLOY_ARGS+=(
    --remove-env-vars=DATABASE_URL,SECRET_KEY,OPENAI_API_KEY
    --update-secrets=DATABASE_URL=frigi-database-url:latest
    --update-secrets=SECRET_KEY=frigi-secret-key:latest
  )
  if [[ "${INCLUDE_OPENAI_API_KEY_LC}" == "true" || "${INCLUDE_OPENAI_API_KEY}" == "1" ]]; then
    DEPLOY_ARGS+=(--update-secrets=OPENAI_API_KEY=frigi-openai-api-key:latest)
  fi
  DEPLOY_ARGS+=(--set-env-vars=DB_SCHEMA=frigi,REDIS_URL=redis://localhost:6379/0,ACCESS_TOKEN_EXPIRE_MINUTES=10080,DEBUG=false,LOG_LEVEL=info)
else
  DEPLOY_ARGS+=(
    --remove-secrets=DATABASE_URL,SECRET_KEY,OPENAI_API_KEY
    --env-vars-file="${ENV_FILE}"
  )
fi

CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" gcloud "${DEPLOY_ARGS[@]}"

echo "[deploy] service url:"
CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" \
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)'
