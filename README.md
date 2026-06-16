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
| `TIERDE_PROVIDER` | `resend` \| `smtp` \| `ses` \| `sendgrid` \| `postmark` |
| `TIERDE_FROM_EMAIL` | sender address |
| `TIERDE_FROM_NAME` | sender display name (optional) |

Provider-specific variables:

| Provider | Variables |
|---|---|
| resend | `RESEND_API_KEY` |
| smtp | `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` |
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
  ShippingUpdate, PaymentFailed, Subscription,
  TeamInvite, AccountDeactivated, Notification,
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

## Ejecting templates

Copy any built-in template to your project for full customisation:

```
npx tierde eject --template welcome ./emails/Welcome.tsx
npx tierde eject --template password-reset ./emails/PasswordReset.tsx
```

Available template names: `welcome`, `password-reset`, `email-verification`, `two-factor-auth`, `magic-link`, `passwordless-otp`, `invoice`, `order-confirmation`, `shipping-update`, `payment-failed`, `subscription`, `team-invite`, `account-deactivated`, `notification`.

The ejected file imports only from `@yedoma-labs/tierde-mail` — no internal paths.

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

## Previewing templates

Build the library and render a template to an HTML file:

```bash
# Build first (required for Vite ?raw imports)
pnpm build

# Preview any template by name
pnpm preview Welcome
pnpm preview OrderConfirmation
pnpm preview ShippingUpdate
pnpm preview PasswordlessOtp
# etc — any template name works
```

This generates an HTML file in the `preview/` directory that can be opened in any browser. Templates are rendered with sample data and can be inspected for layout, styling, and dark mode support.

---

## License

MIT
