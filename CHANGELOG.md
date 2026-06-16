# Changelog

All notable changes to `@yedoma-labs/tierde-mail` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

---

## [Unreleased]

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

**CLI**
- `tierde eject --list` — prints all available template names (one per line, pipe-friendly)
- `tierde eject --all <dir>` — ejects all 41 templates into a directory with PascalCase filenames (e.g. `password-reset` → `PasswordReset.tsx`)

**Preview server**
- Live reload via SSE (`/api/events`) — browser auto-refreshes current email when the server restarts; works with `nodemon` / `tsx watch`; green "live" badge appears on connect
- Dark mode toggle — injects `color-scheme:dark` CSS into the iframe, forcing `@media (prefers-color-scheme: dark)` to match without modifying template source
- Compare mode — splits the preview pane into two iframes with an independent email selector; labels show which template is in each pane

**Integration tests**
- `providers.integration.test.ts` covers all six providers (resend, sendgrid, postmark, smtp, mailpit, ses); each suite is skipped unless the required env vars are present — safe to run in CI without credentials

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
