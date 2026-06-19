# Contributing to tierde-mail

## Setup

```bash
git clone https://github.com/yedoma-labs/tierde-mail
cd tierde-mail
pnpm install
pnpm build
```

## CLI — local binary

`pnpm exec tierde` and `npx tierde` both fetch the **published** package from npm. To test local changes, use the built binary directly:

```bash
pnpm build
node dist/bin/tierde.js <command>
```

Examples:

```bash
node dist/bin/tierde.js dev
node dist/bin/tierde.js render welcome --props '{"name":"Alice","loginUrl":"https://example.com"}'
node dist/bin/tierde.js send welcome --to test@example.com --props '{"name":"Alice","loginUrl":"https://example.com"}'
```

Run `pnpm dev` (`vite build --watch`) to rebuild on file changes.

## Lint & types

```bash
pnpm lint        # biome check src
pnpm lint:fix    # biome check src --write
pnpm typecheck   # tsc --noEmit
```

The `pre-push` git hook runs `lint`, `typecheck`, `test`, and `build` — run them locally before pushing to avoid a failed hook.

## Tests

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage
pnpm wcag           # WCAG AA audit across all 52 template variants
```

### Middleware / attachment e2e tests

`src/__tests__/middleware.e2e.test.tsx` sends through Mailpit and asserts on the delivered message via the Mailpit REST API. It is skipped unless `TIERDE_TEST_MAILPIT=true`:

```bash
docker compose up -d
TIERDE_TEST_MAILPIT=true pnpm vitest run src/__tests__/middleware.e2e.test.tsx
```

## Local mail stack

`docker-compose.yml` at the repo root starts all mock services:

```bash
docker compose up -d
docker compose down
```

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Mailpit SMTP | `localhost:1025` | catch-all SMTP sink |
| Mailpit UI | `http://localhost:8025` | browse captured emails |
| WireMock | `http://localhost:8080` | HTTP mock — Resend, SendGrid, Postmark |
| LocalStack | `http://localhost:4566` | AWS SES API mock |

### Smoke-test: Mailpit

```bash
docker compose up -d

TIERDE_PROVIDER=mailpit \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# open http://localhost:8025
```

### Smoke-test: Resend / SendGrid / Postmark → WireMock

Stubs live in `scripts/wiremock/mappings/`. Calls succeed and return a mock message ID.

```bash
docker compose up -d

# Resend
TIERDE_PROVIDER=resend RESEND_API_KEY=test RESEND_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'

# SendGrid
TIERDE_PROVIDER=sendgrid SENDGRID_API_KEY=test SENDGRID_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'

# Postmark
TIERDE_PROVIDER=postmark POSTMARK_SERVER_TOKEN=test POSTMARK_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
```

### Smoke-test: SES → LocalStack

LocalStack community requires a one-time signup at [app.localstack.cloud](https://app.localstack.cloud) to get an auth token.

```bash
export LOCALSTACK_AUTH_TOKEN=your-token-here
docker compose up -d

AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_SESSION_TOKEN= \
TIERDE_PROVIDER=ses SES_REGION=us-east-1 SES_ENDPOINT=http://localhost:4566 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# exits 0 = LocalStack accepted the call
```

**Sender identity is verified automatically on startup** via `scripts/localstack/init-ses.sh`. To verify a different address, set `TIERDE_FROM_EMAIL` before `docker compose up -d`.

Always pass explicit mock credentials (`AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test`) to prevent the AWS SDK from picking up ambient SSO tokens.

## WCAG audit

```bash
pnpm wcag
```

Audits all 52 template variants for WCAG AA contrast. Also runs in CI via `src/__tests__/wcag.test.tsx`.

## Releasing

Releases are managed via `pnpm version` + npm publish from CI. Do not publish manually.
