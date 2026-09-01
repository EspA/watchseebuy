#!/usr/bin/env bash
set -euo pipefail

gcloud run deploy coming-soon \
  --project=waitseebuy \
  --region=us-east1 \
  --source="$(cd "$(dirname "$0")" && pwd)" \
  --allow-unauthenticated \
  --port=8080
