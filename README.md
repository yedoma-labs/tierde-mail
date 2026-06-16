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
import { resend }    from '@yedoma-labs/tierde-mail/providers/resend';
import { smtp }      from '@yedoma-labs/tierde-mail/providers/smtp';
import { mailpit }   from '@yedoma-labs/tierde-mail/providers/mailpit';
import { ses }       from '@yedoma-labs/tierde-mail/providers/ses';
import { sendgrid }  from '@yedoma-labs/tierde-mail/providers/sendgrid';
import { postmark }  from '@yedoma-labs/tierde-mail/providers/postmark';
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
| ses | `SES_REGION` or `AWS_REGION` |
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

---

## Webhooks

Verify and parse inbound event payloads from Resend and Postmark:

```ts
import {
  createResendWebhookHandler,
  createPostmarkWebhookHandler,
} from '@yedoma-labs/tierde-mail/webhooks';

// Resend (Svix HMAC-SHA256)
const resendWebhooks = createResendWebhookHandler({ secret: process.env.RESEND_WEBHOOK_SECRET! });

// Postmark (HMAC-SHA256)
const postmarkWebhooks = createPostmarkWebhookHandler({ token: process.env.POSTMARK_WEBHOOK_TOKEN! });

// In your HTTP handler:
const event = resendWebhooks.verify(rawBody, req.headers);
// event.type: 'email.sent' | 'email.delivered' | 'email.bounced' | ...
// event.email: { id, to[], from, subject, timestamp }
// event.raw: original payload
```

`WebhookVerificationError` is thrown on invalid signature or expired timestamp. Resend uses a ±300 second tolerance by default (configurable via `toleranceSeconds`).

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
