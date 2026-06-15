# Changelog

All notable changes to `@yedoma-labs/tierde-mail` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

---

## [Unreleased]

### Changed
- Replaced `juice` CSS inliner with `@css-inline/css-inline` (Rust/NAPI). Eliminates the `juice → cheerio → whatwg-encoding` deprecated dependency chain. `@media` at-rules preserved via `keepAtRules: true` for dark mode support.
- Bumped all dependencies to latest: React 19.2.7, Vite 8, Vitest 4, TypeScript 6, Biome 2.5, and runtime deps (`tuuru-chrono-tz`, `html-to-text`, `nodemailer`, etc.).
- Minimum peer dependency tightened to React `>=19.0.0`.

### Added
- TypeScript 6 compiler flags: `erasableSyntaxOnly` (prevents runtime-impacting syntax) and `isolatedDeclarations` (explicit return types and type annotations on all exported symbols).
- GitHub Actions CI workflow.
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
