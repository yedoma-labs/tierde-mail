# @yedoma-labs/tierde-mail

<picture>
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized-mobile.png">
  <img src="https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png" alt="Project Header">
</picture>

[![CI](https://github.com/yedoma-labs/tierde-mail/actions/workflows/ci.yml/badge.svg)](https://github.com/yedoma-labs/tierde-mail/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@yedoma-labs/tierde-mail.svg)](https://www.npmjs.com/package/@yedoma-labs/tierde-mail)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **тиэрдэ** (*tierde*) — Yakutian (Sakha) for "deliver / forward"

Modern email library for Node.js — JSX templates, multi-provider sending, TypeScript-first.

```
pnpm add @yedoma-labs/tierde-mail react react-dom
```

React 19+ required as a peer dependency.

---

## Quick start

```tsx
import { createMailer, defineEmail, EmailTemplate, Heading, Text, Button } from '@yedoma-labs/tierde-mail';
import { resend } from '@yedoma-labs/tierde-mail/providers/resend';

// 1. Define a template
const WelcomeEmail = defineEmail<{ name: string; url: string }>({
  subject: ({ name }) => `Welcome, ${name}!`,
  component: ({ name, url }) => (
    <EmailTemplate preview={`Welcome, ${name}!`}>
      <Heading>Welcome, {name}!</Heading>
      <Text>Your account is ready.</Text>
      <Button href={url}>Get Started</Button>
    </EmailTemplate>
  ),
});

// 2. Create a mailer
const mailer = createMailer({
  provider: resend({ apiKey: process.env.RESEND_API_KEY! }),
  from: { email: 'hello@example.com', name: 'Acme' },
});

// 3. Send — TypeScript enforces the right props
await mailer.send(WelcomeEmail, {
  to: 'user@example.com',
  props: { name: 'Alice', url: 'https://example.com/start' },
});
```

---

## Providers

Import each provider from its subpath:

```ts
import { resend }      from '@yedoma-labs/tierde-mail/providers/resend';
import { smtp }        from '@yedoma-labs/tierde-mail/providers/smtp';
import { mailpit }     from '@yedoma-labs/tierde-mail/providers/mailpit';
import { ses }         from '@yedoma-labs/tierde-mail/providers/ses';
import { sendgrid }    from '@yedoma-labs/tierde-mail/providers/sendgrid';
import { postmark }    from '@yedoma-labs/tierde-mail/providers/postmark';
import { mailgun }     from '@yedoma-labs/tierde-mail/providers/mailgun';
import { brevo }       from '@yedoma-labs/tierde-mail/providers/brevo';
import { mailersend }  from '@yedoma-labs/tierde-mail/providers/mailersend';
import { sparkpost }   from '@yedoma-labs/tierde-mail/providers/sparkpost';
import { mandrill }    from '@yedoma-labs/tierde-mail/providers/mandrill';
```

### Resend

```ts
resend({ apiKey: 're_...' })
```

### SMTP / Nodemailer

```ts
smtp({ host: 'smtp.example.com', port: 587, auth: { user: '...', pass: '...' } })
```

`nodemailer` is an optional peer dependency — install it separately:

```
pnpm add nodemailer
```

### Mailpit / MailHog (local dev)

```ts
mailpit()                                    // localhost:1025 (defaults)
mailpit({ host: 'mailpit', port: 1025 })    // custom host/port
```

Spins up no extra services — just point at a running [Mailpit](https://mailpit.axllent.org/) or MailHog instance. TLS is disabled by default; `rejectUnauthorized` is `false` so self-signed certs work out of the box.

### AWS SES

```ts
ses({ region: 'us-east-1' })
```

Requires `@aws-sdk/client-ses` installed separately and AWS credentials configured via environment or IAM role.

### SendGrid

```ts
sendgrid({ apiKey: 'SG...' })
```

### Postmark

```ts
postmark({ serverToken: '...' })
```

### Mailgun

```ts
mailgun({ apiKey: 'key-...', domain: 'mg.example.com' })
mailgun({ apiKey: 'key-...', domain: 'mg.example.com', region: 'eu' })  // EU region
```

```bash
TIERDE_PROVIDER=mailgun  MAILGUN_API_KEY=key-...  MAILGUN_DOMAIN=mg.example.com
```

### Brevo (formerly Sendinblue)

```ts
brevo({ apiKey: 'xkeysib-...' })
```

```bash
TIERDE_PROVIDER=brevo  BREVO_API_KEY=xkeysib-...
```

### MailerSend

```ts
mailersend({ apiToken: 'mlsn.abc...' })
```

```bash
TIERDE_PROVIDER=mailersend  MAILERSEND_API_TOKEN=mlsn.abc...
```

### SparkPost

```ts
sparkpost({ apiKey: 'sp-key' })
sparkpost({ apiKey: 'sp-key', baseUrl: 'https://api.eu.sparkpost.com' })  // EU tenant
sparkpost({ apiKey: 'sp-key', sandbox: true })                             // sandbox
```

```bash
TIERDE_PROVIDER=sparkpost  SPARKPOST_API_KEY=sp-key
```

### Mandrill (Mailchimp Transactional)

```ts
mandrill({ apiKey: 'mc-key' })
```

```bash
TIERDE_PROVIDER=mandrill  MANDRILL_API_KEY=mc-key
```

---

## Local development

> **Contributors** (working on this repo): build first, then run `node dist/bin/tierde.js` instead of `npx tierde`. `npx tierde` always fetches the published package and will not reflect local changes.
>
> ```bash
> pnpm build
> node dist/bin/tierde.js send welcome --to test@example.com --props '{"name":"Alice","loginUrl":"https://example.com"}'
> ```
>
> **Users** (consuming the package): use `npx tierde` as shown throughout this guide.

A `docker-compose.yml` is included at the repo root. It runs [Mailpit](https://mailpit.axllent.org/) — a catch-all SMTP sink that accepts every outbound email without delivering anything.

**Start:**

```bash
docker compose up -d
```

**Stop:**

```bash
docker compose down
```

| Service | Endpoint | Purpose |
|---|---|---|
| Mailpit SMTP | `localhost:1025` | catch-all SMTP sink |
| Mailpit UI | `http://localhost:8025` | browse captured emails |
| WireMock | `http://localhost:8080` | HTTP mock — Resend, SendGrid, Postmark |
| LocalStack | `http://localhost:4566` | AWS SES API mock |

Every address you send to is accepted — no DNS, no deliverability concerns.

### Mailpit provider (direct SMTP)

```ts
import { createMailer } from '@yedoma-labs/tierde-mail';
import { mailpit } from '@yedoma-labs/tierde-mail/providers/mailpit';

const mailer = createMailer({
  provider: mailpit(),   // defaults: host localhost, port 1025
  from: 'dev@example.com',
});
```

Or via environment variables:

```bash
TIERDE_PROVIDER=mailpit
TIERDE_FROM_EMAIL=dev@example.com
```

**Smoke-test via CLI:**

```bash
docker compose up -d

# users (uses published package from npmjs)
TIERDE_PROVIDER=mailpit \
TIERDE_FROM_EMAIL=dev@example.com \
  npx tierde send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'

# contributors (uses local package, build first: pnpm build)
TIERDE_PROVIDER=mailpit \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# open http://localhost:8025 to see the email
```

### Resend / SendGrid / Postmark (via WireMock)

[WireMock](https://wiremock.org) stubs the HTTP APIs for Resend, SendGrid, and Postmark — calls succeed and return a mock message ID without touching the real provider. Stub mappings live in `scripts/wiremock/mappings/`.

Use `*_BASE_URL` to redirect each provider at WireMock:

```ts
import { resend }   from '@yedoma-labs/tierde-mail/providers/resend';
import { sendgrid } from '@yedoma-labs/tierde-mail/providers/sendgrid';
import { postmark } from '@yedoma-labs/tierde-mail/providers/postmark';

resend({   apiKey: 'test',  baseUrl: 'http://localhost:8080' })
sendgrid({ apiKey: 'test',  baseUrl: 'http://localhost:8080' })
postmark({ serverToken: 'test', baseUrl: 'http://localhost:8080' })
```

Or via environment variables:

```bash
# resend
RESEND_BASE_URL=http://localhost:8080

# sendgrid
SENDGRID_BASE_URL=http://localhost:8080

# postmark
POSTMARK_BASE_URL=http://localhost:8080
```

**Smoke-test via CLI:**

```bash
docker compose up -d

# resend — users
TIERDE_PROVIDER=resend RESEND_API_KEY=test RESEND_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  npx tierde send welcome --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'

# resend — contributors (pnpm build first)
TIERDE_PROVIDER=resend RESEND_API_KEY=test RESEND_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
```

Swap `TIERDE_PROVIDER` and the matching `*_API_KEY` / `*_BASE_URL` pair for SendGrid or Postmark.

### SES provider (via LocalStack)

[LocalStack](https://localstack.cloud) mocks the SES API locally. The free community tier requires a one-time signup:

1. Create a free account at [app.localstack.cloud](https://app.localstack.cloud)
2. Go to **Workspace → Auth Token** in the dashboard
3. Copy the token and export it:

```bash
export LOCALSTACK_AUTH_TOKEN=your-token-here
```

LocalStack accepts SES API calls but does not deliver emails. SMTP relay to Mailpit requires LocalStack Pro — with the community tier, use the Mailpit provider directly to preview email content.

**Sender identity is verified automatically on startup** via `scripts/localstack/init-ses.sh`. The verified address defaults to `$TIERDE_FROM_EMAIL` (or `dev@example.com`). To verify a different address, export `TIERDE_FROM_EMAIL` before `docker compose up -d`.

**Credentials:** pass explicit mock credentials to prevent the AWS SDK from picking up ambient SSO session tokens from your environment:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_SESSION_TOKEN=   # clear any real SSO session token
```

```ts
import { ses } from '@yedoma-labs/tierde-mail/providers/ses';

const mailer = createMailer({
  provider: ses({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  }),
  from: 'dev@example.com',
});
```

**Smoke-test via CLI:**

```bash
export LOCALSTACK_AUTH_TOKEN=your-token-here
docker compose up -d

# users (uses published package from npmjs)
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_SESSION_TOKEN= \
TIERDE_PROVIDER=ses SES_REGION=us-east-1 SES_ENDPOINT=http://localhost:4566 \
TIERDE_FROM_EMAIL=dev@example.com \
  npx tierde send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'

# contributors (uses local package, build first: pnpm build)
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_SESSION_TOKEN= \
TIERDE_PROVIDER=ses SES_REGION=us-east-1 SES_ENDPOINT=http://localhost:4566 \
TIERDE_FROM_EMAIL=dev@example.com \
  node dist/bin/tierde.js send welcome \
  --to anyone@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# exits 0 = LocalStack accepted the call
```

---

## Retry / backoff

`createMailer` retries transient HTTP errors with exponential backoff. Disabled by default (`maxRetries: 0`).

```ts
const mailer = createMailer({
  provider: resend({ apiKey: '...' }),
  from: 'hello@example.com',
  maxRetries: 3,              // max attempts after the first failure
  initialRetryDelayMs: 500,   // first retry after 500 ms; doubles each attempt
});
```

Default retry predicate retries HTTP 429 (rate-limited), 502, 503, 504 responses. Override with `retryOn`:

```ts
const mailer = createMailer({
  provider: sendgrid({ apiKey: '...' }),
  from: 'hello@example.com',
  maxRetries: 2,
  retryOn: (err) => err instanceof Error && err.message.includes('429'),
});
```

In failover mode, each provider is retried independently before the next failover target is tried.

---

## Multi-provider strategies

```ts
// Failover — tries each provider in order, falls back on error
const mailer = createMailer({
  providers: [primary, backup],
  strategy: 'failover',
  from: 'hello@example.com',
});

// Round-robin — distributes sends across providers
const mailer = createMailer({
  providers: [provider1, provider2],
  strategy: 'round-robin',
  from: 'hello@example.com',
});
```

---

## Middleware

`middleware` is an ordered array of transform functions that run on the fully-rendered `EmailMessage` before it reaches the provider. Each function receives the message and returns a (possibly modified) copy.

```ts
import type { MailMiddleware } from '@yedoma-labs/tierde-mail';

const mailer = createMailer({
  provider: smtp({ ... }),
  from: 'hello@example.com',
  middleware: [myMiddleware],
});
```

### Type

```ts
type MailMiddleware = (message: EmailMessage) => EmailMessage | Promise<EmailMessage>;
```

### Tracking pixels

Providers like Resend, SendGrid, and Postmark handle open/click tracking automatically via their dashboards. For SMTP or self-hosted setups you can inject tracking yourself via middleware:

```ts
import type { MailMiddleware } from '@yedoma-labs/tierde-mail';
import { randomUUID } from 'node:crypto';

// Open tracking — 1×1 pixel appended to HTML body
export const trackOpens = (baseUrl: string): MailMiddleware =>
  (msg) => ({
    ...msg,
    html: msg.html + `<img src="${baseUrl}/${randomUUID()}" width="1" height="1" alt="" />`,
  });

// Click tracking — rewrites href attributes through a redirect
export const trackClicks = (baseUrl: string): MailMiddleware =>
  (msg) => ({
    ...msg,
    html: msg.html.replace(
      /href="(https?:[^"]+)"/g,
      (_, url) => `href="${baseUrl}?url=${encodeURIComponent(url)}"`,
    ),
  });

const mailer = createMailer({
  provider: smtp({ ... }),
  from: 'hello@example.com',
  middleware: [
    trackOpens('https://track.example.com/open'),
    trackClicks('https://track.example.com/click'),
  ],
});
```

**Notes:**
- **tierde-mail ships zero tracking.** The middleware pipeline is a user-supplied hook — the library has no knowledge of or control over what you inject. Any open/click tracking you implement is your code, running under your own GDPR, CASL, and CAN-SPAM obligations; tierde-mail is not the data controller or processor for that data.
- Middleware runs per-recipient — each send gets its own pixel URL.
- Keep middleware synchronous when possible. Async middleware (e.g., DB writes) adds latency per send and is felt at batch scale. Record tracking events in `onResult` after the send confirms instead.
- Middleware does not run on the plain-text part. Link rewriting applies to HTML only.
- Order matters: pixel injection before link rewriting is the conventional order.
- The subject and all attachments are re-validated **after** middleware runs (CR/LF in the subject and unsafe attachment filenames/content-types/CIDs throw `TypeError`). If your middleware adds attachments, validate them yourself with the exported `validateAttachment` to surface errors early:

  ```ts
  import { validateAttachment } from '@yedoma-labs/tierde-mail';
  ```

### Inline image embedding

`embedImages` is a built-in middleware that fetches remote images and embeds them as CID inline attachments. Email clients that block remote image loading will still display inline-embedded images.

```ts
import { createMailer, embedImages } from '@yedoma-labs/tierde-mail';

const mailer = createMailer({
  provider: smtp({ ... }),
  from: 'hello@example.com',
  middleware: [
    embedImages([
      'https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png',
    ]),
  ],
});
```

Reference the image in your JSX template by its original URL — `embedImages` replaces the `src` with `cid:<filename>` and attaches the image inline before sending:

```tsx
const MyEmail = defineEmail<{}>({
  subject: () => 'Hello',
  component: () => (
    <EmailTemplate>
      <Image
        src="https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png"
        alt="Banner"
        width={600}
      />
    </EmailTemplate>
  ),
});
```

Pass no argument to embed **all** remote `https://` images found in the rendered HTML:

```ts
middleware: [embedImages()]
```

**Provider support:**

| Provider | CID inline |
|---|---|
| SMTP / Mailpit | ✅ native (nodemailer) |
| SendGrid | ✅ `disposition: inline` |
| Postmark | ✅ `ContentID` |
| Resend | ✅ `inline: true` |
| SES | ❌ `SendEmailCommand` does not support attachments — use `SendRawEmailCommand` directly |

**Notes:**
- Each unique URL is fetched once per send, even if it appears multiple times in the HTML.
- Fetched images are cached per `embedImages` instance, keyed by URL. In a batch send the same banner is fetched once and reused for every recipient instead of re-fetched per send. Failed fetches are not cached, so a transient error retries on the next send. To pick up an image changed at its URL, create a fresh mailer (or call `embedImages()` again).
- The server-supplied `Content-Type` is clamped to a raster `image/*` type (case-insensitive); anything else — including `text/html` and `image/svg+xml` — falls back to `image/png`, so a misbehaving CDN cannot inject active-content inline attachments.
- Existing `attachments` on the message are preserved.
- **SSRF warning**: when called without a URL list (`embedImages()`), every remote `src` in the rendered HTML is fetched server-side. Do not use with templates whose `src` values come from untrusted user input.

---

## Attachments

Pass file attachments via the `attachments` option on `send` or `sendBatch`.

```ts
await mailer.send(InvoiceEmail, {
  to: 'customer@example.com',
  props: { ... },
  attachments: [
    {
      filename: 'invoice-2026-01.pdf',
      content: pdfBuffer,          // Buffer or base64 string
      contentType: 'application/pdf',
    },
  ],
});
```

### Allowed content types

| Category | Types |
|---|---|
| Documents | `application/pdf`, `application/zip`, `application/octet-stream` |
| Images | `image/png`, `image/jpeg`, `image/gif`, `image/webp`, any `image/*` |
| Text | `text/plain`, `text/csv`, `text/html` |

Any other content type throws a `TypeError` at send time (before the provider is called).

### Batch attachments

```ts
await mailer.sendBatch(InvoiceEmail, {
  // Shared: every recipient gets this
  attachments: [
    { filename: 'terms.pdf', content: termsBuffer, contentType: 'application/pdf' },
  ],
  recipients: [
    {
      to: 'alice@example.com',
      props: { ... },
      // Per-recipient: appended after shared attachments
      attachments: [
        { filename: 'invoice-alice.pdf', content: alicePdf, contentType: 'application/pdf' },
      ],
    },
    {
      to: 'bob@example.com',
      props: { ... },
      attachments: [
        { filename: 'invoice-bob.pdf', content: bobPdf, contentType: 'application/pdf' },
      ],
    },
  ],
});
```

### Inline attachments (CID)

Set `cid` on an attachment to embed it inline. Reference it in JSX via `src="cid:<cid>"`. See [Inline image embedding](#inline-image-embedding) for the built-in `embedImages` middleware that handles this automatically.

```ts
attachments: [
  {
    filename: 'logo.png',
    content: logoBuffer,
    contentType: 'image/png',
    cid: 'logo.png',
  },
]
// In JSX: <img src="cid:logo.png" alt="Logo" />
```

### Security

**Email addresses** are validated against RFC 5321 before any provider call. The full `atext` character class is enforced in the local part; domain labels must start and end with a letter or digit (hyphens allowed in the middle); bare hostnames (`localhost`, `mailpit`) and address literals (`[127.0.0.1]`, `[IPv6:...]`) are accepted. Control characters (including CR and LF) are rejected to prevent header injection regardless of where they appear in the address.

**Attachments:**
- Filenames: no `..`, `/`, `\`, or control characters.
- CID values: no CR/LF or control characters (MIME header injection prevention).
- Content type is compared against an allowlist before the provider is called — disallowed types throw `TypeError` without a network request.
- `image/svg+xml` is blocked even though it matches `image/*` — SVG is active content.
- Attachments are re-validated after middleware runs, so middleware-generated attachments cannot bypass these checks.

---

## Environment-based setup

For twelve-factor apps, configure via environment variables:

```ts
import { createMailerFromEnv } from '@yedoma-labs/tierde-mail';
const mailer = createMailerFromEnv();
```

Required variables:

| Variable | Values |
|---|---|
| `TIERDE_PROVIDER` | `resend` \| `smtp` \| `mailpit` \| `ses` \| `sendgrid` \| `postmark` |
| `TIERDE_FROM_EMAIL` | sender address |
| `TIERDE_FROM_NAME` | sender display name (optional) |

Provider-specific variables:

| Provider | Variables |
|---|---|
| resend | `RESEND_API_KEY` |
| smtp | `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` |
| mailpit | `MAILPIT_HOST` (default `localhost`), `MAILPIT_PORT` (default `1025`) |
| ses | `SES_REGION` or `AWS_REGION`, `SES_ENDPOINT` (optional — setting this auto-uses dummy creds for mock servers), `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (optional override) |
| sendgrid | `SENDGRID_API_KEY` |
| postmark | `POSTMARK_SERVER_TOKEN` |

---

## Components

All components read colors, typography, and spacing from the active theme via React context.

| Component | Description |
|---|---|
| `<EmailTemplate>` | Root wrapper — sets `<html>`, `<head>`, `<body>`, accent bar, dark mode CSS |
| `<Heading level={1–4}>` | Headings h1–h4 |
| `<Text size="sm\|md\|lg" muted>` | Body text |
| `<Button href variant="primary\|secondary\|outline">` | Table-based button (Outlook-safe) |
| `<Footer>` | Footer with top border |
| `<Hr>` | Horizontal rule |
| `<Section>` | Padded content block, optional background color |
| `<Image>` | Responsive image |
| `<Link>` | Inline anchor |
| `<Preview>` | Hidden preview text for email clients |
| `<LogoHeader>` | Branded logo block (uses `theme.logo` by default) |
| `<Row>` / `<Column>` | Table-based columns for multi-column layout |

---

## Theming

### Default theme

Every email uses `defaultTheme` (indigo/slate palette) unless overridden.

### Custom theme

```ts
import { createTheme } from '@yedoma-labs/tierde-mail';
import type { Theme } from '@yedoma-labs/tierde-mail';

const myTheme = createTheme({
  primary: '#e11d48',       // rose-600
  accentBar: '#e11d48',
  borderRadius: '4px',
  logo: 'https://cdn.example.com/logo.png',
  logoAlt: 'Acme',
  logoWidth: 120,
});
```

Pass to any template or component:

```tsx
<Welcome name="Alice" loginUrl="..." theme={myTheme} />

// or to EmailTemplate directly:
<EmailTemplate theme={myTheme}>
  ...
</EmailTemplate>
```

### Theme shape

| Field | Default | Description |
|---|---|---|
| `primary` | `#4f46e5` | CTA button background, accent bar |
| `primaryText` | `#ffffff` | CTA button text |
| `primaryHover` | `#4338ca` | Hover color (for preview server) |
| `secondary` | `#f1f5f9` | Secondary button background |
| `secondaryText` | `#334155` | Secondary button text |
| `background` | `#f8fafc` | Page background |
| `cardBackground` | `#ffffff` | Email card background |
| `accentBar` | `#4f46e5` | 4px top stripe color |
| `textPrimary` | `#0f172a` | Heading color |
| `textSecondary` | `#334155` | Body text color |
| `textMuted` | `#64748b` | Muted / fine-print color |
| `border` | `#e2e8f0` | Hr and footer border |
| `fontFamily` | system stack | Font family string |
| `borderRadius` | `12px` | Card corner radius |
| `buttonBorderRadius` | `8px` | Button corner radius |
| `maxWidth` | `600px` | Email card max width |
| `logo` | — | Logo image URL (auto-rendered in header) |
| `logoAlt` | — | Logo alt text |
| `logoWidth` | `140` | Logo pixel width |

### Dark mode

Dark mode is automatic — a `@media (prefers-color-scheme: dark)` block is injected into every email using class-based overrides (`tierde-card`, `tierde-text-primary`, `tierde-footer`, etc.). Email clients that support dark mode apply it; others ignore it.

---

## Built-in templates

Import from `@yedoma-labs/tierde-mail/templates`:

```ts
import {
  Welcome, PasswordReset, EmailVerification, TwoFactorAuth,
  MagicLink, PasswordlessOtp, Invoice, OrderConfirmation,
  ShippingUpdate, PaymentFailed, Subscription, TeamInvite,
  AccountDeactivated, Notification, AbandonedCart, SecurityAlert,
  ReviewRequest, PolicyUpdate, WeeklyDigest, OnboardingProgress,
  CommentMention, RefundConfirmation, UsageAlert, BackInStock,
  MaintenanceNotification, ExportReady, WinBack, SupportTicket,
  Referral, FeatureAnnouncement, AccountLocked, AccountUnlocked,
  RegistrationConfirmation, EmailChangeVerification, PhoneVerification,
  ProfileUpdated, PasswordChangedConfirmation, LoginActivity,
  DataExportRequest, AccountDeletionConfirmation, NewsletterConfirmation,
  AppointmentReminder, EventInvitation, ApiKeyCreated, GiftCard,
} from '@yedoma-labs/tierde-mail/templates';
```

All templates accept `theme?: Theme`, `locale?: string`, `dir?: 'ltr' | 'rtl'`, and a `strings?` prop for overriding every piece of copy.

| Template | Required props |
|---|---|
| `Welcome` | `name`, `loginUrl` |
| `PasswordReset` | `username`, `resetUrl` |
| `EmailVerification` | `name`, `verifyUrl` |
| `TwoFactorAuth` | `username`, `code` |
| `MagicLink` | `email`, `loginUrl` |
| `PasswordlessOtp` | `code` |
| `Invoice` | `customerName`, `invoiceNumber`, `items` |
| `OrderConfirmation` | `name`, `orderNumber`, `items`, `orderUrl` |
| `ShippingUpdate` | `name`, `orderNumber`, `status`, `trackingUrl` |
| `PaymentFailed` | `name`, `updateUrl` |
| `Subscription` | `name`, `event`, `planName`, `actionUrl` |
| `TeamInvite` | `inviterName`, `teamName`, `inviteUrl` |
| `AccountDeactivated` | `name`, `reactivateUrl` |
| `AbandonedCart` | `name`, `cartUrl`, `items[]` |
| `SecurityAlert` | `name`, `event`, `reviewUrl` |
| `ReviewRequest` | `name`, `reviewUrl` |
| `PolicyUpdate` | `policyType`, `effectiveDate`, `policyUrl` |
| `WeeklyDigest` | `name`, `weekOf`, `dashboardUrl` |
| `OnboardingProgress` | `name`, `steps[]`, `dashboardUrl` |
| `CommentMention` | `name`, `event`, `actorName`, `contextName`, `commentUrl` |
| `RefundConfirmation` | `name`, `refundAmount` |
| `UsageAlert` | `name`, `resource`, `used`, `limit`, `percentUsed`, `severity`, `upgradeUrl` |
| `BackInStock` | `name`, `productName`, `productUrl` |
| `MaintenanceNotification` | `type` |
| `ExportReady` | `name`, `exportName`, `downloadUrl` |
| `WinBack` | `name`, `returnUrl`, `daysSince` |
| `SupportTicket` | `name`, `event`, `ticketId`, `ticketTitle`, `ticketUrl` |
| `Referral` | `name`, `event`, `referrerName`, `actionUrl` |
| `FeatureAnnouncement` | `name`, `featureName`, `description`, `ctaUrl` |
| `AccountLocked` | `name`, `reason`, `unlockUrl` |
| `AccountUnlocked` | `name`, `loginUrl` |
| `RegistrationConfirmation` | `name`, `dashboardUrl` |
| `EmailChangeVerification` | `name`, `newEmail`, `verifyUrl` |
| `PhoneVerification` | `name`, `phone`, `code` |
| `ProfileUpdated` | `name`, `changes[]`, `accountUrl` |
| `PasswordChangedConfirmation` | `name`, `securityUrl` |
| `LoginActivity` | `name`, `events[]`, `securityUrl` |
| `DataExportRequest` | `name`, `event`, `actionUrl` |
| `AccountDeletionConfirmation` | `name`, `event` |
| `NewsletterConfirmation` | `email`, `confirmUrl` |
| `AppointmentReminder` | `name`, `providerName`, `appointmentDate`, `appointmentTime` |
| `EventInvitation` | `name`, `eventName`, `eventDate`, `eventTime`, `registerUrl` |
| `ApiKeyCreated` | `keyName`, `event` (`created`\|`revoked`\|`expiring`), `manageUrl` |
| `GiftCard` | `recipientName`, `senderName`, `amount`, `code`, `redeemUrl` |
| `Notification` | `title`, `body` |

### String overrides (i18n)

Every template exports a `TEMPLATE_STRINGS` constant and a `Strings` interface:

```ts
import { Welcome, WELCOME_STRINGS } from '@yedoma-labs/tierde-mail/templates';
import type { WelcomeStrings } from '@yedoma-labs/tierde-mail/templates';

const es: WelcomeStrings = {
  ...WELCOME_STRINGS,
  heading: (name) => `¡Bienvenido, ${name}!`,
  ctaLabel: 'Comenzar',
  footer: (year, app) => `© ${year} ${app}. Todos los derechos reservados.`,
};

await mailer.send(Welcome, {
  to: 'user@example.com',
  props: { name: 'Carlos', loginUrl: '...', strings: es, dir: 'ltr', locale: 'es' },
});
```

---

## CLI

### `tierde dev`

Start the preview server with all 45 built-in templates and sample data:

```bash
npx tierde dev
npx tierde dev --port 3001
```

Opens at `http://localhost:3000`. Includes dark mode toggle, compare view, and live reload on server restart.

### `tierde render`

Render a template to HTML (or plain text) without running the preview server:

```bash
# Render to stdout
npx tierde render welcome --props '{"name":"Alice","loginUrl":"https://example.com"}'

# Write to file
npx tierde render invoice --props '{"customerName":"Acme","invoiceNumber":"INV-001","items":[]}' -o out.html

# Render plain-text version
npx tierde render welcome --props '{"name":"Alice","loginUrl":"https://example.com"}' --text
```

### `tierde send`

Send a template via your configured provider — useful for smoke-testing credentials:

```bash
TIERDE_PROVIDER=resend RESEND_API_KEY=re_... TIERDE_FROM_EMAIL=you@example.com \
  npx tierde send welcome \
  --to recipient@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
```

Reads the same env vars as `createMailerFromEnv()`. Prints the message ID on success.

### `tierde eject`

Copy any built-in template to your project for full customisation:

```bash
# Eject a single template
npx tierde eject --template welcome ./emails/Welcome.tsx

# List all available template names
npx tierde eject --list

# Eject all templates at once
npx tierde eject --all ./emails/
```

Available template names: `welcome`, `password-reset`, `email-verification`, `two-factor-auth`, `magic-link`, `passwordless-otp`, `invoice`, `order-confirmation`, `shipping-update`, `payment-failed`, `subscription`, `team-invite`, `account-deactivated`, `abandoned-cart`, `security-alert`, `review-request`, `policy-update`, `weekly-digest`, `onboarding-progress`, `comment-mention`, `refund-confirmation`, `usage-alert`, `back-in-stock`, `maintenance-notification`, `export-ready`, `win-back`, `support-ticket`, `referral`, `feature-announcement`, `account-locked`, `account-unlocked`, `registration-confirmation`, `email-change-verification`, `phone-verification`, `profile-updated`, `password-changed-confirmation`, `login-activity`, `data-export-request`, `account-deletion-confirmation`, `newsletter-confirmation`, `notification`.

The ejected file imports only from `@yedoma-labs/tierde-mail` — no internal paths.

---

## Batch sending

Send one template to many recipients with concurrency control:

```ts
const result = await mailer.sendBatch(WelcomeEmail, {
  recipients: [
    { to: 'alice@example.com', props: { name: 'Alice', url: '...' } },
    { to: 'bob@example.com',   props: { name: 'Bob',   url: '...' } },
  ],
  concurrency: 5,    // max parallel sends per chunk (default 5)
  delayMs: 200,      // pause between chunks (default 0)
  onResult: (r) => console.log(r.to, r.result?.id ?? r.error?.message),
});

console.log(`${result.sent} sent, ${result.failed} failed`);
```

Individual failures are isolated — a single bounce does not abort the batch.

### Rate limiting

Use `maxPerSecond` to stay within provider rate limits (e.g. Resend free tier: 2 req/s):

```ts
await mailer.sendBatch(NewsletterEmail, {
  recipients: [...],
  maxPerSecond: 2,    // token-bucket: ≤2 sends per second
  concurrency: 2,     // max concurrent in-flight
});
```

`maxPerSecond` and `delayMs` are mutually exclusive — `maxPerSecond` takes precedence when both are set.

### Large batches — `collectResults`

By default `sendBatch` returns a `results` array holding one entry (with its `props`) per recipient. For very large batches that retention is `O(n)` heap. Set `collectResults: false` to skip it — `sent`/`failed` counts stay accurate, and you consume each result through `onResult` as it completes:

```ts
let sent = 0;
await mailer.sendBatch(NewsletterEmail, {
  recipients: hundredsOfThousands,
  maxPerSecond: 10,
  collectResults: false,        // results array stays empty; no per-recipient retention
  onResult: (r) => {
    if (r.result) sent++;
    else logBounce(r.to, r.error);
  },
});
```

---

## Webhooks

Verify and parse inbound event payloads from Resend, Postmark, and SendGrid:

```ts
import {
  createResendWebhookHandler,
  createPostmarkWebhookHandler,
  createSendGridWebhookHandler,
} from '@yedoma-labs/tierde-mail/webhooks';

// Resend (Svix HMAC-SHA256)
const resendWebhooks = createResendWebhookHandler({ secret: process.env.RESEND_WEBHOOK_SECRET! });

// Postmark (HMAC-SHA256)
const postmarkWebhooks = createPostmarkWebhookHandler({ token: process.env.POSTMARK_WEBHOOK_TOKEN! });

// SendGrid (ECDSA P-256) — public key from SendGrid Dashboard → Settings → Mail Settings → Event Webhook
const sendgridWebhooks = createSendGridWebhookHandler({ publicKey: process.env.SENDGRID_WEBHOOK_PUBLIC_KEY! });

// In your HTTP handler (use express.raw() / Next.js route with { bodyParser: false }):
const event = resendWebhooks.verify(rawBody, req.headers);
// event.type: 'email.sent' | 'email.delivered' | 'email.bounced' | ...
// event.email: { id, to[], from, subject, timestamp }
// event.raw: original payload

// SendGrid delivers events as a batch array — use verifyBatch() to get all events:
const events = sendgridWebhooks.verifyBatch(rawBody, req.headers);
for (const event of events) { ... }
```

`WebhookVerificationError` is thrown on invalid signature or expired timestamp. Default tolerance is 300 seconds (configurable via `toleranceSeconds`).

---

## Unsubscribe headers

Add RFC 8058 one-click unsubscribe headers to any send:

```ts
import { unsubscribeHeaders } from '@yedoma-labs/tierde-mail';

await mailer.send(Newsletter, {
  to: 'subscriber@example.com',
  props: { ... },
  headers: unsubscribeHeaders({
    url: `https://example.com/unsubscribe?token=${token}`,
    email: 'unsub@example.com',  // optional mailto fallback
    oneClick: true,              // default — adds List-Unsubscribe-Post header
  }),
});
```

---

## Testing

```ts
import { captureEmails } from '@yedoma-labs/tierde-mail/testing';

const { mailer, inbox, clear } = captureEmails();

await mailer.send(WelcomeEmail, { to: 'test@example.com', props: { ... } });

expect(inbox[0].subject).toBe('Welcome, Alice!');
expect(inbox[0].html).toContain('Get Started');

clear();
```

---

## Building custom templates

Use `defineEmail` to build your own type-safe templates:

```tsx
import { defineEmail, EmailTemplate, Heading, Text, Button, Footer } from '@yedoma-labs/tierde-mail';

interface OrderConfirmationProps {
  orderNumber: string;
  total: number;
  trackingUrl: string;
  theme?: Theme;
}

export const OrderConfirmation = defineEmail<OrderConfirmationProps>({
  subject: ({ orderNumber }) => `Order #${orderNumber} confirmed`,
  component: ({ orderNumber, total, trackingUrl, theme }) => (
    <EmailTemplate preview={`Order #${orderNumber} confirmed`} theme={theme}>
      <Heading>Order confirmed</Heading>
      <Text>Order #{orderNumber} — ${total.toFixed(2)}</Text>
      <Button href={trackingUrl}>Track your order</Button>
      <Footer>© {new Date().getFullYear()} Acme Inc.</Footer>
    </EmailTemplate>
  ),
});
```

The value `defineEmail` returns has the type `DefinedEmail<Props>` — use it when you need to annotate a template (e.g. a function that accepts any template):

```ts
import type { DefinedEmail } from '@yedoma-labs/tierde-mail';

function describe<P>(tmpl: DefinedEmail<P>, props: P): string {
  return tmpl.subject(props);
}
```

> The older `EmailTemplateType` export is a deprecated alias of `DefinedEmail` and still works.

---

## Building custom providers

Implement the `EmailProvider` interface:

```ts
import type { EmailProvider, EmailMessage, SendResult } from '@yedoma-labs/tierde-mail';

export function myProvider(): EmailProvider {
  return {
    name: 'my-provider',
    async send(message: EmailMessage): Promise<SendResult> {
      // call your email API here
      return { id: '...', provider: 'my-provider' };
    },
  };
}
```

---

## React integration

The `/react` subpath exports an `<EmailPreview>` component and `renderEmailHtml()` for embedding email previews in your Next.js admin or Storybook:

```tsx
import { EmailPreview, renderEmailHtml } from '@yedoma-labs/tierde-mail/react';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

// Server component (Next.js App Router)
export default function PreviewPage() {
  const html = renderEmailHtml(WelcomeEmail, { name: 'Alice', url: '...' });
  return <EmailPreview html={html} style={{ height: '700px' }} />;
}
```

`renderEmailHtml` must be called server-side (Node.js). `<EmailPreview>` renders the HTML in an isolated `<iframe srcDoc>` so styles don't leak.

---

## Preview server

The built-in preview server lets you browse all templates with live reload, dark mode toggle, and side-by-side comparison:

```ts
import { startPreviewServer } from '@yedoma-labs/tierde-mail/preview';
import * as templates from './src/templates/index.js'; // your templates

startPreviewServer({ templates, port: 3001 });
```

Features:
- **Live reload** — server restart is detected via SSE; the browser refreshes automatically
- **Dark mode** — toggle in the toolbar injects `color-scheme: dark` CSS and forces `@media (prefers-color-scheme: dark)` in the iframe
- **Compare** — split view with a second template dropdown for side-by-side comparison
- **Mobile preview** — resize the iframe to 375px to simulate narrow viewports

For a quick look at a single built-in template, use `tierde render`:

```bash
npx tierde render welcome --props '{"name":"Alice","loginUrl":"https://example.com"}' -o preview.html
open preview.html
```

---

## License

MIT
