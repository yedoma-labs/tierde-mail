# Changelog

All notable changes to `@yedoma-labs/tierde-mail` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

---

## [Unreleased]

### Added

- **Brevo provider** (formerly Sendinblue) — `brevo({ apiKey, baseUrl? })` sends via the Brevo v3 SMTP API. Supports attachments and inline (CID) attachments (`inlineAttachment` field). Available as `@yedoma-labs/tierde-mail/providers/brevo`. Env var: `BREVO_API_KEY`.
- **MailerSend provider** — `mailersend({ apiToken, baseUrl? })` sends via the MailerSend v1 API (202 Accepted; message ID in `X-Message-Id` header). Headers serialised as `[{ name, value }]` array per API spec. Available as `@yedoma-labs/tierde-mail/providers/mailersend`. Env var: `MAILERSEND_API_TOKEN`.
- **SparkPost provider** — `sparkpost({ apiKey, baseUrl?, sandbox? })` sends via the SparkPost Transmissions API. Supports EU region override (`baseUrl: 'https://api.eu.sparkpost.com'`), sandbox mode, cc/bcc as `header_to` recipients, inline images. Available as `@yedoma-labs/tierde-mail/providers/sparkpost`. Env var: `SPARKPOST_API_KEY`.
- **Mandrill provider** (Mailchimp Transactional) — `mandrill({ apiKey, baseUrl? })` sends via the Mandrill messages/send API. Key in request body per Mandrill convention. Throws on `rejected`/`invalid` status. Available as `@yedoma-labs/tierde-mail/providers/mandrill`. Env var: `MANDRILL_API_KEY`.
- **Mailgun provider** — `mailgun({ apiKey, domain, region?, baseUrl? })` sends via the Mailgun v3 REST API using FormData. Supports US (default) and EU regions, attachments, inline (CID) attachments, cc/bcc/replyTo, and custom headers. Available as `@yedoma-labs/tierde-mail/providers/mailgun`.
- **`createMailerFromEnv()` supports `mailgun`** — set `TIERDE_PROVIDER=mailgun` with `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and optional `MAILGUN_REGION` (`us`|`eu`) / `MAILGUN_BASE_URL`.
- **SendGrid Event Webhook handler** — `createSendGridWebhookHandler({ publicKey })` verifies ECDSA P-256 signatures (`X-Twilio-Email-Event-Webhook-Timestamp` + `X-Twilio-Email-Event-Webhook-Signature`). Accepts raw base64 DER SPKI key or PEM string. `verify()` returns the first event; `verifyBatch()` returns all events in the batch. Both normalise to the shared `WebhookEvent` schema. Exported from `@yedoma-labs/tierde-mail/webhooks`.
- **Retry / exponential backoff** — `createMailer` accepts `maxRetries?`, `initialRetryDelayMs?` (default 1 000 ms), and `retryOn?` on `MailerConfig`. Default predicate retries HTTP 429, 502, 503, 504 responses. Delay formula: `initialRetryDelayMs × 2ⁿ`. Each provider in failover mode retries independently before the next failover target is tried.
- **New email templates** — `AppointmentReminder`, `EventInvitation`, `ApiKeyCreated`, `GiftCard` (see v0.5.0 for props). All four are included in `tierde eject`.
- **Integration tests for all new providers** — real-API suites (gated by env vars) + WireMock mock suites for all 4 new HTTP providers (Mailgun, Brevo, MailerSend, SparkPost, Mandrill). WireMock stubs cover plain send, PDF attachment, and CID inline image. Run with `TIERDE_TEST_WIREMOCK=true` after `docker compose up -d`. SparkPost and Mandrill are WireMock-only (no free tier).
- **WireMock stub mappings** — `scripts/wiremock/mappings/{mailgun,brevo,mailersend,sparkpost,mandrill}.json`.

## [0.8.1] — 2026-06-20

### Added

- **Provider integration tests — attachment, CID inline, external image src** — each provider suite (Resend, SendGrid, Postmark, SMTP, Mailpit) now includes three additional integration test cases: PDF attachment, CID inline image, and HTML containing an external `<img src="...">`. SES attachment and CID tests intentionally omitted (`SendEmailCommand` does not support attachments).
- **e2e smoketests — `embedImages` and CID inline** — Mailpit e2e suite now verifies that `embedImages` rewrites remote `src` to `cid:` and delivers the image as an inline attachment, and that a manually set `cid` on an attachment round-trips through to the recipient.

### Fixed

- **RFC 5321-compliant email validation** — `validateEmail` now enforces the full RFC 5321 / RFC 5322 grammar instead of ad-hoc checks. Local part: full `atext` character class (`ALPHA / DIGIT / !#$%&'*+/=?^_\`{|}~-`), quoted-string local parts accepted, consecutive/leading/trailing dots rejected, 64-character limit enforced. Domain: sub-domain labels must start and end with a letter or digit (hyphens allowed in the middle), 63-character label limit and 255-character domain limit enforced, address literals (`[127.0.0.1]`, `[IPv6:...]`) accepted, bare hostnames (no dot) accepted per RFC 5321. Header-injection control-character check is unchanged and still runs first.
- **Bare-hostname email addresses** (`test@localhost`, `inbox@mailpit`) are now accepted. RFC 5321 does not require a dot in the domain, so rejecting them was incorrect and broke `mailpit()` provider e2e tests.
- **Mailpit e2e HTML assertion** — the `/message/{ID}/body.html` API path does not exist in Mailpit; tests now fetch `/message/{ID}` (JSON) and read the `HTML` field, consistent with the attachment tests that already used that endpoint.

### Changed

- Integration test CID and external-image assets now reference `assets/smoketest-resized-mobile.png` from the repo instead of a synthetic 1×1 PNG, exercising real attachment encoding paths.

## [0.8.0] — 2026-06-19

### Added

- **Middleware pipeline** — `middleware?: MailMiddleware[]` option on `createMailer`. An ordered array of transform functions that run on the fully-rendered `EmailMessage` before it reaches the provider. Supports sync and async transforms.
- **`embedImages(urls?)`** — built-in middleware that fetches remote images, attaches them inline via CID, and rewrites `src` attributes so email clients that block remote loading still display embedded images. Supported on SMTP, Resend, SendGrid, and Postmark. SES limitation documented.
- **Inline attachments (CID)** — `cid?: string` field on `Attachment`. When set, providers mark the attachment as inline. All HTTP providers updated: SMTP passes `cid` to nodemailer, SendGrid uses `disposition: inline` + `content_id`, Postmark uses `ContentID`, Resend uses `inline: true` + `content_id`.
- **Batch attachments** — `attachments?: Attachment[]` on `BatchSendOptions` (shared to all recipients) and on `BatchRecipient` (per-recipient, appended after shared). Previously the batch path silently dropped all attachments.
- **`embedImages()` fetch caching** — fetched images are cached per middleware instance, keyed by URL. A batch send now fetches each image once and reuses it for every recipient instead of re-fetching per send. Failed fetches are not cached, so transient errors retry on the next send.
- **`collectResults?: boolean` on `BatchSendOptions`** (default `true`) — set to `false` for very large batches to skip retaining one result (and its `props`) per recipient in memory; `sent`/`failed` counts stay accurate and results are still delivered via `onResult`.
- **`DefinedEmail<Props>` type** — canonical, clearly-named alias for the value returned by `defineEmail`. The previous `EmailTemplateType` export is retained but deprecated (it only existed to avoid clashing with the `EmailTemplate` component).
- **`validateAttachment` is now exported** so authors of custom middleware can validate attachments they generate.

### Security

- `validateAttachment` now validates the `cid` field: rejects empty strings and strings containing CR, LF, or other control characters to prevent MIME header injection.
- `validateAttachment` now rejects `image/svg+xml` (and `image/svg`): SVG is active content that can embed scripts, so it is blocked even though it matches the `image/*` allowlist prefix.
- Attachments are re-validated **after** middleware runs, not only on the caller-supplied `options.attachments`. Closes a gap where a custom `MailMiddleware` could inject attachments with path-traversal filenames, disallowed content types, or malformed CIDs that reached the provider unchecked.
- The subject line is re-validated for CR/LF **after** middleware runs, closing a header-injection gap where a middleware could rewrite the subject to inject extra headers (e.g. `Bcc:`).
- `embedImages()` clamps the server-supplied `Content-Type` to a raster `image/*` type (case-insensitive), falling back to `image/png` otherwise. Prevents a misbehaving or malicious CDN from returning `text/html` (an allowed type) or `Image/SVG+XML` (mixed case) and producing an active-content inline attachment.
- `embedImages()` SSRF risk documented: calling without a URL filter embeds all remote `src` values; do not use with user-controlled image URLs.

### Changed

- Validation and config errors now consistently throw `TypeError` (previously the subject CR/LF check and the "at least one provider" check threw plain `Error`).
- Failover with multiple providers now throws a wrapped error naming how many providers were tried, with the last underlying error preserved as `cause`. A single-provider mailer still rethrows the original provider error unchanged.
- Bumped `nodemailer` to `^9.0.1`, `@aws-sdk/client-ses` to `^3.1072.0`, and `@types/node` to `^26.0.0`.

---

## [0.7.0] — 2026-06-19

### Added

- `X-Mailer: tierde-mail/<version>` header injected automatically on every send via `createMailer`; caller-supplied headers take precedence
- `src/version.ts` — single source of truth for the library version string
- CI smoketest workflow (`.github/workflows/smoketest.yml`) — runs provider integration tests against real APIs on every push to `main`; uses `FeatureAnnouncement` template for a rich HTML payload; skips any provider whose secrets are absent

### Fixed

- SendGrid provider: `text/plain` content entry now placed before `text/html` as required by the SendGrid API (previously caused `400` errors when a plain-text body was supplied)

---

## [0.6.0] — 2026-06-18

### Added

**Local development stack**
- `docker-compose.yml` — one-command local mail stack: Mailpit (SMTP sink + web UI on `:8025`), WireMock (HTTP mock on `:8080`), and LocalStack (SES API mock on `:4566`)
- `scripts/localstack/init-ses.sh` — LocalStack ready-hook that auto-verifies `$TIERDE_FROM_EMAIL` on startup; no manual `aws ses verify-email-identity` step required
- `scripts/wiremock/mappings/` — pre-configured WireMock stubs for Resend (`POST /emails`), SendGrid (`POST /v3/mail/send`), and Postmark (`POST /email`)

**Provider `baseUrl` overrides**
- `SesConfig.endpoint` — redirect the SES provider at any AWS-compatible endpoint (e.g. LocalStack)
- `SendGridConfig.baseUrl` — redirect SendGrid at a local mock
- `PostmarkConfig.baseUrl` — redirect Postmark at a local mock
- `ResendConfig.baseUrl` already existed; now surfaced via `RESEND_BASE_URL` env var

**New `createMailerFromEnv` env vars**
- `RESEND_BASE_URL`, `SENDGRID_BASE_URL`, `POSTMARK_BASE_URL` — point HTTP providers at WireMock or any stub server
- `SES_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — local/CI SES configuration

### Fixed

- SES provider: credentials are now wrapped in an async provider so the AWS SDK cannot fall through to the credential chain and pick up ambient `AWS_SESSION_TOKEN` values (SSO sessions, named profiles)
- `createMailerFromEnv`: setting `SES_ENDPOINT` without `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` now throws a descriptive error instead of silently sending with real credentials

### Changed

- LocalStack container: `SES_EMAIL_BODY_VALIDATION_ENABLED=0` and pre-set `AWS_ACCESS_KEY_ID=test` / `AWS_SECRET_ACCESS_KEY=test` for the init script

---

## [0.5.0] — 2026-06-18

### Added

**New templates**
- `AppointmentReminder` — appointment/booking reminders with date, time, provider, location, and optional reschedule/cancel links
- `EventInvitation` — webinar and event invites with date, time, location, register CTA, and add-to-calendar link
- `ApiKeyCreated` — developer API key lifecycle emails for `created`, `revoked`, and `expiring` events; uses `AlertBox` variant to reflect severity
- `GiftCard` — e-commerce gift card delivery with amount, redemption code, personal message, and expiry

**Design tokens & accessibility**
- 14 new semantic tokens on `Theme`: `surfaceSubtle`, `borderSubtle`, plus `success/danger/warning/info` (bg, border, text) — enables theme-driven component colors
- `PALETTE` const export for fixed system colors (changelog, impact, severity groups)
- WCAG AA enforcement: `pnpm wcag` CLI script audits all 52 template variants; `src/__tests__/wcag.test.tsx` runs 52 tests in CI
- `@media (prefers-color-scheme: dark)` catch-all rules in `EmailTemplate` for unclassed text; elements on light-bg islands (badges, code blocks, status indicators) protected via `tierde-badge` / `tierde-code` / `tierde-positive` / `tierde-negative` class hooks

### Changed

- All 24 templates refactored to derive every color from theme tokens or `PALETTE` — zero hardcoded hex values remain in template source
- `AlertBox` now uses `useTheme()` for status colors instead of hardcoded values
- `UsageAlert` pct% text now uses WCAG-safe severity-specific text color, not the decorative bar color

### Fixed

- Dark mode text invisible in islands (code boxes, badges, refund amounts) — now use token-derived colors with `!important` overrides in media query

---

## [0.4.0] — 2026-06-17

### Added

**`tierde dev`**
- `npx tierde dev [--port 3000]` — starts the built-in preview server with all 41 templates and sample data; no script or boilerplate required
- `src/templates/sample-props.ts` — canonical sample props for every built-in template; consumed by `tierde dev` and available to import in custom preview scripts

**`tierde send`**
- `npx tierde send <name> --to <email> [--props '<json>']` — fires a real send via `TIERDE_PROVIDER` env config; useful for smoke-testing provider credentials and verifying end-to-end delivery

**`sendBatch` rate limiting**
- `maxPerSecond` option on `BatchSendOptions` — token-bucket rate limiter across the entire batch; ensures ≤N sends per second regardless of chunk size (e.g. `maxPerSecond: 2` for Resend free tier)
- When `maxPerSecond` is set, concurrency slots rotate on a `1000/maxPerSecond` ms schedule; result order is always preserved
- `maxPerSecond` takes precedence over `delayMs` when both are provided

---

## [0.3.0] — 2026-06-17

### Added

**Batch send**
- `mailer.sendBatch(template, { recipients, concurrency?, delayMs?, onResult? })` — send one template to many recipients with chunk-based concurrency control and per-item failure isolation
- `concurrency` (default 5) limits parallel sends per chunk; `delayMs` adds a pause between chunks for rate-limited providers
- `onResult` callback fires after each send attempt (success or failure) for streaming progress
- `captureEmails()` test utility supports `sendBatch` via the same interface
- New types: `BatchRecipient<P>`, `BatchSendOptions<P>`, `BatchItemResult<P>`, `BatchSendResult<P>`

**Webhooks** (subpath `@yedoma-labs/tierde-mail/webhooks`)
- `createResendWebhookHandler({ secret })` — verifies Svix HMAC-SHA256 signatures with configurable timestamp tolerance (default 5 min)
- `createPostmarkWebhookHandler({ token })` — verifies HMAC-SHA256 over raw request body
- Both return a normalized `WebhookEvent { type, provider, email, raw }` — consistent event shape across providers; `raw` is the original parsed payload for provider-specific fields
- `WebhookVerificationError` — thrown on invalid signature, missing headers, or expired timestamp
- Constant-time comparison via `node:crypto timingSafeEqual` prevents timing attacks
- Normalized `type` values: `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`, `email.sent`, `email.delivery_delayed`, `email.subscription_changed`

**Local dev provider**
- `mailpit()` — zero-config SMTP provider targeting `localhost:1025`; compatible with both Mailpit (recommended) and MailHog; `tls.rejectUnauthorized: false` set automatically; custom `host`/`port` supported for Docker setups
- Subpath: `@yedoma-labs/tierde-mail/providers/mailpit`
- `createMailerFromEnv()` now accepts `TIERDE_PROVIDER=mailpit` with optional `MAILPIT_HOST` / `MAILPIT_PORT`

**CLI**
- `tierde render <name> --props '<json>'` — renders any template to HTML (or `--text` for plain text) without starting the preview server; `-o <file>` writes output to disk
- `tierde eject --list` — prints all available template names (one per line, pipe-friendly)
- `tierde eject --all <dir>` — ejects all 41 templates into a directory with PascalCase filenames (e.g. `password-reset` → `PasswordReset.tsx`)

**Unsubscribe headers**
- `unsubscribeHeaders({ url, email?, oneClick? })` — generates RFC 8058 `List-Unsubscribe` (and `List-Unsubscribe-Post`) headers; spread directly into `mailer.send()` options

**React integration** (subpath `@yedoma-labs/tierde-mail/react`)
- `<EmailPreview html style? className? title?>` — renders an email HTML string inside an isolated `<iframe srcDoc>`; use in Next.js admin panels, Storybook stories, or any React app
- `renderEmailHtml(template, props)` — server-side helper that renders a typed template to an HTML string for use with `<EmailPreview>`

**Preview server**
- Live reload via SSE (`/api/events`) — browser auto-refreshes current email when the server restarts; works with `nodemon` / `tsx watch`; green "live" badge appears on connect
- Dark mode toggle — injects `color-scheme:dark` CSS into the iframe, forcing `@media (prefers-color-scheme: dark)` to match without modifying template source
- Compare mode — splits the preview pane into two iframes with an independent email selector; labels show which template is in each pane

**Coverage**
- Overall coverage raised from ~51% to 84.66%; component coverage 94.5%, provider coverage 82.64%, template coverage 83.88%
- New unit test suites: provider mocks (resend, sendgrid, postmark, smtp, ses), `Image` / `LogoHeader` / `Row`/`Column` components, 17 additional built-in templates, `unsubscribeHeaders`
- Integration test suite (`providers.integration.test.ts`) covers all six providers — skipped unless env vars are present

### Fixed
- `exactOptionalPropertyTypes` violation in `WebhookEmail.subject` — added explicit `| undefined`
- SMTP integration test: conditional spread for `auth` instead of passing `undefined` directly

---

## [0.2.0] — 2026-06-16

### Added

**Templates** (34 new, 41 total)
- `SecurityAlert` — new-login, password-change, suspicious-activity, and other security events; optional detail table (IP, location, device, timestamp); `AlertBox` callout for high-risk events
- `AccountLocked` — reason-specific body (`too_many_attempts` / `suspicious_activity` / `admin_action`); optional support-email block
- `AccountUnlocked` — account restored confirmation with login CTA
- `PasswordChangedConfirmation` — password change acknowledgement with optional security detail table
- `RegistrationConfirmation` — post-signup confirmation with dashboard link
- `EmailChangeVerification` — OTP/link flow for changing email address
- `PhoneVerification` — OTP code for phone number verification
- `ProfileUpdated` — field-level change log with old→new value table
- `LoginActivity` — multi-row login event table with success/failed status badges
- `DataExportRequest` — `ready` (download link + expiry) and `expired` (re-request) event variants
- `AccountDeletionConfirmation` — `scheduled` (warning box + cancel CTA), `completed` (danger box), and `cancelled` variants
- `NewsletterConfirmation` — double opt-in confirm link; optional unsubscribe link
- `PasswordlessOtp` — standalone OTP code for passwordless login
- `TeamInvite` — team invitation with inviter name and invite URL
- `PaymentFailed` — payment failure alert with optional amount and failure reason
- `RefundConfirmation` — refund detail table (amount, refund ID, payment method, original order)
- `OrderConfirmation` — order summary with line items
- `ShippingUpdate` — shipment status with tracking URL
- `MagicLink` — passwordless magic-link sign-in

**Components**
- `<AlertBox variant icon>` — variant-driven callout box (`danger` / `warning` / `success` / `info`); optional leading icon character
- `<KeyValueTable rows>` — filtered label/value table; auto-skips `null`, `undefined`, `''`, and `false` values; `mono` flag for monospace value cells

**Shared types** (exported from root and `templates` subpath)
- `BaseTemplateProps<S>` — generic base for all template props; carries `appName?`, `locale?`, `dir?`, `theme?`, `strings?`; eliminates boilerplate from every template interface
- `SecurityDetails` — `ipAddress?`, `location?`, `device?`, `timestamp?`; shared by security templates
- `ChangeRecord` — `{ field, oldValue?, newValue }` for profile change entries
- `LoginEvent` — extends `SecurityDetails` with required `timestamp` and `status: 'success' | 'failed'`

**Testing**
- `components.test.tsx` — `AlertBox` variant/icon rendering, `KeyValueTable` filtering (null, undefined, empty string, false, all-filtered), monospace flag, `Link` and `Button` XSS protocol blocking
- Extended `templates.test.tsx` — 35+ tests across all template groups (built-in, security, account lifecycle)
- Extended `validate.test.ts` — CRLF injection, null byte, spaces in local/domain, empty recipient array, absolute path, backslash path, control chars in filename, `image/*` wildcard, CSV acceptance
- Extended `mailer.test.tsx` — round-robin distribution across providers, empty `to` array rejection

### Fixed
- **Security: null byte attachment bypass** — `validateAttachment` now checks for control characters (`\x00–\x1f`) before path-traversal checks; previously `'\x00'` bypassed the `includes('..')` guard
- **Security: empty recipient array silently accepted** — `normalizeAddresses([])` now throws `TypeError('At least one recipient address is required')`
- **Security: `Link` missing URL protocol validation** — `<Link href>` now blocks `javascript:`, `data:`, and `vbscript:` protocols (matching `<Button>` behaviour added in 0.1.0)
- **`KeyValueTable` renders `false` values** — filter now excludes `false` ReactNode in addition to `null`, `undefined`, and `''`

### Changed
- All 41 template `Props` interfaces now extend `BaseTemplateProps<S>` instead of repeating the five shared fields inline
- Replaced `juice` CSS inliner with `@css-inline/css-inline` (Rust/NAPI). Eliminates the `juice → cheerio → whatwg-encoding` deprecated dependency chain. `@media` at-rules preserved via `keepAtRules: true` for dark mode support.
- Bumped all dependencies to latest: React 19.2.7, Vite 8, Vitest 4, TypeScript 6, Biome 2.5, and runtime deps (`tuuru-chrono-tz`, `html-to-text`, `nodemailer`, etc.).
- Minimum peer dependency tightened to React `>=19.0.0`.
- TypeScript 6 compiler flags: `erasableSyntaxOnly` and `isolatedDeclarations`.
- GitHub Actions CI workflow added.
- Explicit `ReactElement` / `ReactElement | null` return type annotations on all component functions.
- Explicit `EmailTemplate<T>` type annotations on all template exports.
- `Context<Theme>` annotation on `ThemeContext`.

---

## [0.1.0] — 2026-06-15

Initial release.

### Added

**Core**
- `defineEmail<Props>()` — phantom-typed template factory; props flow through to `mailer.send()` with full type inference
- `createMailer()` — single-provider and multi-provider (failover / round-robin) mailer
- `createMailerFromEnv()` — zero-config mailer bootstrapped from environment variables
- `renderEmail()` — renders JSX to inlined HTML via `react-dom/server` + `@css-inline/css-inline`; `@media` at-rules preserved for dark mode
- Auto-generation of plain-text from HTML via `html-to-text`
- Input validation: RFC-compliant email address check, attachment filename allowlist (blocks path traversal), content-type allowlist

**Providers** (each a separate subpath export for tree-shaking)
- `resend` — Resend HTTP API
- `smtp` — Nodemailer SMTP (nodemailer is an optional peer dependency)
- `ses` — AWS SES v3 (`@aws-sdk/client-ses` installed separately)
- `sendgrid` — SendGrid HTTP API
- `postmark` — Postmark HTTP API

**Components**
- `<EmailTemplate>` — full HTML document wrapper with 4px accent bar, optional auto-logo header, dark mode CSS block (`@media (prefers-color-scheme: dark)` with `tierde-*` class overrides)
- `<Heading level={1–4}>` — themed headings
- `<Text size muted>` — themed body text
- `<Button href variant>` — table-based button, Outlook-safe, themed
- `<Footer>` — themed footer with top border
- `<Hr>` — themed horizontal rule
- `<Section>` — padded block with optional background
- `<Image>` — responsive image
- `<Link>` — inline anchor
- `<Preview>` — hidden preview text
- `<LogoHeader>` — standalone branded logo block
- `<Row>` / `<Column>` — table-based multi-column layout

**Theming**
- `Theme` interface with 18 design tokens (colors, typography, radii, logo)
- `defaultTheme` — indigo/slate palette
- `createTheme(partial)` — shallow merge over `defaultTheme`
- Theme distributed via React Context; all components consume `useTheme()`
- Dark mode: automatic `@media (prefers-color-scheme: dark)` block in every email

**Built-in templates** (subpath `@yedoma-labs/tierde-mail/templates`)
- `Welcome` — account creation welcome email
- `PasswordReset` — password reset with expiry notice
- `EmailVerification` — email address verification
- `TwoFactorAuth` — OTP code display
- `Invoice` — line-item invoice with `Intl.NumberFormat` currency formatting
- `MagicLink` — passwordless sign-in link
- `Notification` — generic notification with optional CTA

All templates accept `theme?`, `locale?`, `dir?` (`ltr`/`rtl`), and a `strings?` prop for full copy override (i18n).

**CLI** (`npx tierde`)
- `tierde eject --template <name> <output-path>` — copies a built-in template to the user's project; rewrites internal imports to `@yedoma-labs/tierde-mail`; self-contained (template sources embedded at build time via Vite `?raw`)

**Testing utility** (subpath `@yedoma-labs/tierde-mail/testing`)
- `captureEmails()` — returns an in-memory mailer + inbox array for use in unit tests

**Preview server** (subpath `@yedoma-labs/tierde-mail/preview`)
- Local HTTP server rendering templates in the browser

**yedoma-labs ecosystem integrations**
- `@yedoma-labs/bylyt-env-guard` — type-safe env schema for `createMailerFromEnv`
- `@yedoma-labs/suruk-logger` — structured logging in the preview server
- `@yedoma-labs/tuuru-chrono-tz` — locale-aware year formatting in templates
