#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-name-chain-439816}"
GCLOUD_ACCOUNT="${CLOUDSDK_CORE_ACCOUNT:-fashionfriend@name-chain-439816.iam.gserviceaccount.com}"
ENV_PATH="${ENV_PATH:-backend/.env}"

if [[ ! -f "${ENV_PATH}" ]]; then
  echo "[secrets] env file not found: ${ENV_PATH}" >&2
  exit 1
fi

python3 - "${ENV_PATH}" <<'PY' > /tmp/frigi-secrets.json
import json
import sys
from pathlib import Path

env = {}
for line in Path(sys.argv[1]).read_text().splitlines():
    stripped = line.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        continue
    key, value = stripped.split("=", 1)
    env[key] = value

print(json.dumps(env))
PY

for ENV_KEY in DATABASE_URL SECRET_KEY OPENAI_API_KEY; do
  case "${ENV_KEY}" in
    DATABASE_URL) SECRET_NAME="frigi-database-url" ;;
    SECRET_KEY) SECRET_NAME="frigi-secret-key" ;;
    OPENAI_API_KEY) SECRET_NAME="frigi-openai-api-key" ;;
    *) echo "[secrets] unknown env key: ${ENV_KEY}" >&2; exit 1 ;;
  esac
  VALUE="$(
    python3 - /tmp/frigi-secrets.json "${ENV_KEY}" <<'PY'
import json
import sys
data = json.load(open(sys.argv[1]))
print(data.get(sys.argv[2], ""))
PY
  )"

  if [[ -z "${VALUE}" ]]; then
    echo "[secrets] skipping ${ENV_KEY}; no value in ${ENV_PATH}"
    continue
  fi

  if CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    :
  else
    CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" \
    gcloud secrets create "${SECRET_NAME}" \
      --project="${PROJECT_ID}" \
      --replication-policy="automatic"
  fi

  printf '%s' "${VALUE}" | CLOUDSDK_CORE_ACCOUNT="${GCLOUD_ACCOUNT}" \
    gcloud secrets versions add "${SECRET_NAME}" \
      --project="${PROJECT_ID}" \
      --data-file=-
  echo "[secrets] synced ${SECRET_NAME}"
done

rm -f /tmp/frigi-secrets.json
