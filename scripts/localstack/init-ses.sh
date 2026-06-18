#!/bin/bash
set -euo pipefail

REGION="${SES_REGION:-us-east-1}"
EMAIL="${TIERDE_FROM_EMAIL:-dev@example.com}"
ENDPOINT="http://localhost:4566"

echo "LocalStack SES: verifying sender identity <${EMAIL}>"
aws ses verify-email-identity \
  --email-address "$EMAIL" \
  --region "$REGION" \
  --endpoint-url "$ENDPOINT"
echo "LocalStack SES: verified <${EMAIL}>"
