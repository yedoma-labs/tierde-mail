---
title: Stop Hand-Coding HTML Emails - JSX Templates, Multi-Provider Sending, One TypeScript Library
published: false
description: Email in Node.js is still stuck in table-based HTML and provider lock-in. tierde-mail gives you JSX templates, typed props, and swappable providers behind one API.
tags: typescript, node, email, react
cover_image: 
---

I shipped a SaaS that sent six transactional emails: welcome, password reset, verification, invoice, payment failed, team invite. Every one was a hand-maintained HTML string with inline styles, nested `<table>` tags for Outlook, and a `prefers-color-scheme` block I copy-pasted and always got slightly wrong.

Then we switched from Resend to SES for cost. The send code was tangled into the Resend SDK. I touched twelve files. A week later a designer asked to change the button radius across all emails. Twelve files again.

That is the problem `@yedoma-labs/tierde-mail` solves.

## What problem it solves

**Before** - a password reset email:

```js
const html = `<!DOCTYPE html><html><head><style>
  @media (prefers-color-scheme: dark) { .card { background: #1a1a1a !important; } }
</style></head><body>
  <table width="100%"><tr><td align="center">
    <table class="card" width="600" style="background:#fff;border-radius:12px">
      <tr><td style="padding:32px;font-family:-apple-system,sans-serif">
        <h1 style="color:#0f172a">Reset your password</h1>
        ...nested tables for the button...
`;
await resend.emails.send({ from, to, subject: 'Reset', html });
```

Miss one inline style and Gmail eats it. Change a color and you hand-edit every template. Swap providers and you rewrite the send call everywhere.

**After**:

```tsx
import { defineEmail, EmailTemplate, Heading, Text, Button } from '@yedoma-labs/tierde-mail';

export const PasswordReset = defineEmail<{ username: string; resetUrl: string }>({
  subject: ({ username }) => `Reset your password, ${username}`,
  component: ({ resetUrl }) => (
    <EmailTemplate preview="Reset your password">
      <Heading>Reset your password</Heading>
      <Text>Click below. Link expires in 1 hour.</Text>
      <Button href={resetUrl}>Reset password</Button>
    </EmailTemplate>
  ),
});
```

Dark mode, Outlook-safe buttons, inlined CSS, and plain-text fallback are generated for you. Providers live behind one `send()` call.

## Who needs this

Backend and full-stack devs on Node.js who send transactional email and are tired of:

- Maintaining HTML strings by hand.
- Provider SDKs leaking into business logic.
- No type safety on template props (`{ name }` vs `{ username }` - caught at runtime, in production).

If you send three or more distinct emails, or you might ever switch providers, this pays off. If you send one hard-coded email and never touch it, you don't need this.

## How it works - under the hood

Three design decisions matter.

**Templates are JSX, rendered server-side to HTML.** The library uses React's server-side renderer to transform JSX components into static HTML. Components like `<Button>` and `<Heading>` compile to semantically correct table-based markup with inline styles (Outlook email clients still require tables). CSS is inlined at render time via `@css-inline`, so no external stylesheet requests (email clients block them). A plain-text version is auto-derived with `html-to-text` and sent as the `text/plain` MIME part. React 19 is a peer dependency - you control the version.

**Props are typed end to end.** `defineEmail<Props>()` creates a branded type that ties the subject function, the component, and `mailer.send()` together. The type parameter flows through all call sites: if you pass `{ name: 'Alice' }` to `mailer.send()` but the template expects `{ name, loginUrl }`, TypeScript fails at build time, not inbox time. This catches 90% of template bugs before they ship.

**Providers implement one interface.** Every provider (Resend, SMTP, SES, SendGrid, Postmark, Mailpit) conforms to the same contract: a function returning `{ name: string; send(message: EmailMessage): Promise<SendResult> }`. The mailer only knows that interface. Swapping providers is a one-line change. Failover and round-robin strategies wrap multiple providers, so you can fail over to SMTP if Resend is down.

**Theme context for consistency.** Theme values (colors, radius, fonts, spacing) flow through React context via `<ThemeProvider>`. One `createTheme()` call restyles every email component at render time, so a rebrand means updating theme, not 41 templates.

### Render pipeline

```
defineEmail → JSX component → React SSR → HTML string
                                        ↓
                              @css-inline (inline all CSS)
                                        ↓
                         [HTML + plain-text version ready]
                                        ↓
                           provider.send(message) → API/SMTP
```

Under the hood, the render phase is synchronous - no network I/O. Providers handle async delivery.

## Installation

**Where to get it:**
- npm: [`@yedoma-labs/tierde-mail`](https://www.npmjs.com/package/@yedoma-labs/tierde-mail)
- GitHub: [`yedoma-labs/tierde-mail`](https://github.com/yedoma-labs/tierde-mail)
- Latest version: 0.6.0

**Install core + peer dependencies:**

With **pnpm** (recommended):
```bash
# Minimum (uses built-in test provider)
pnpm add @yedoma-labs/tierde-mail react react-dom

# + Resend (the easy way for SaaS)
pnpm add @yedoma-labs/tierde-mail react react-dom resend

# + SMTP (self-hosted, most control)
pnpm add @yedoma-labs/tierde-mail react react-dom nodemailer

# + AWS SES (high volume, lowest cost)
pnpm add @yedoma-labs/tierde-mail react react-dom @aws-sdk/client-sesv2

# + Postmark (excellent docs, good for transactional)
pnpm add @yedoma-labs/tierde-mail react react-dom postmark

# + SendGrid
pnpm add @yedoma-labs/tierde-mail react react-dom @sendgrid/mail
```

Or with **npm**:
```bash
npm install @yedoma-labs/tierde-mail react react-dom
npm install @yedoma-labs/tierde-mail react react-dom resend
npm install @yedoma-labs/tierde-mail react react-dom nodemailer
npm install @yedoma-labs/tierde-mail react react-dom @aws-sdk/client-sesv2
npm install @yedoma-labs/tierde-mail react react-dom postmark
npm install @yedoma-labs/tierde-mail react react-dom @sendgrid/mail
```

Or with **yarn**:
```bash
yarn add @yedoma-labs/tierde-mail react react-dom
yarn add @yedoma-labs/tierde-mail react react-dom resend
yarn add @yedoma-labs/tierde-mail react react-dom nodemailer
yarn add @yedoma-labs/tierde-mail react react-dom @aws-sdk/client-sesv2
yarn add @yedoma-labs/tierde-mail react react-dom postmark
yarn add @yedoma-labs/tierde-mail react react-dom @sendgrid/mail
```

Or with **bun**:
```bash
bun add @yedoma-labs/tierde-mail react react-dom
bun add @yedoma-labs/tierde-mail react react-dom resend
bun add @yedoma-labs/tierde-mail react react-dom nodemailer
bun add @yedoma-labs/tierde-mail react react-dom @aws-sdk/client-sesv2
bun add @yedoma-labs/tierde-mail react react-dom postmark
bun add @yedoma-labs/tierde-mail react react-dom @sendgrid/mail
```

**Node version:** Node 18+. TypeScript 5.0+ recommended (strict mode works).

## Getting started

Define, wire a provider, send:

```tsx
import { createMailer, defineEmail, EmailTemplate, Heading, Text, Button } from '@yedoma-labs/tierde-mail';
import { resend } from '@yedoma-labs/tierde-mail/providers/resend';

const Welcome = defineEmail<{ name: string; url: string }>({
  subject: ({ name }) => `Welcome, ${name}!`,
  component: ({ name, url }) => (
    <EmailTemplate preview={`Welcome, ${name}!`}>
      <Heading>Welcome, {name}!</Heading>
      <Text>Your account is ready.</Text>
      <Button href={url}>Get Started</Button>
    </EmailTemplate>
  ),
});

const mailer = createMailer({
  provider: resend({ apiKey: process.env.RESEND_API_KEY! }),
  from: { email: 'hello@example.com', name: 'Acme' },
});

await mailer.send(Welcome, {
  to: 'user@example.com',
  props: { name: 'Alice', url: 'https://example.com/start' },
});
```

**Local development** - the repo ships a `docker-compose.yml` that starts a full local mail stack in one command:

```bash
docker compose up -d
```

This starts three services:
- **Mailpit** — SMTP sink + web inbox at `http://localhost:8025` (catches all outgoing mail)
- **WireMock** — HTTP mock at `http://localhost:8080` (stubs Resend, SendGrid, Postmark APIs)
- **LocalStack** — AWS-compatible SES endpoint at `http://localhost:4566`

See the full section below for wiring each provider to its mock.

## Usage examples

**1. Preview every built-in template in the browser.** 41 ready-made templates ship with the package. Start the preview server with sample data:

```bash
npx tierde dev --port 3000
```

```
tierde dev → http://localhost:3000
  41 templates loaded · dark-mode toggle · compare view · live reload
```

Open it, flip dark mode, resize to 375px to check mobile. No boilerplate.

**2. Render a template to HTML from the CLI** - useful in CI or for a quick eyeball:

```bash
npx tierde render welcome \
  --props '{"name":"Alice","loginUrl":"https://example.com"}' \
  -o welcome.html
```

Add `--text` for the plain-text version. Send a real smoke test through your configured provider:

```bash
TIERDE_PROVIDER=resend RESEND_API_KEY=re_... TIERDE_FROM_EMAIL=you@example.com \
  npx tierde send welcome \
  --to me@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# → sent: 0a1b2c3d-...
```

**3. Batch send with rate limiting and failure isolation.** Send a newsletter to thousands without tripping provider limits or aborting on one bounce:

```ts
const result = await mailer.sendBatch(Welcome, {
  recipients: users.map((u) => ({ to: u.email, props: { name: u.name, url: u.link } })),
  maxPerSecond: 2,   // token-bucket - stays under Resend free tier
  concurrency: 2,
  onResult: (r) => console.log(r.to, r.result?.id ?? r.error?.message),
});

console.log(`${result.sent} sent, ${result.failed} failed`);
// → 4821 sent, 3 failed
```

**4. Test sends without hitting a network.** The testing util captures emails in memory:

```ts
import { captureEmails } from '@yedoma-labs/tierde-mail/testing';

const { mailer, inbox } = captureEmails();
await mailer.send(Welcome, { to: 'test@example.com', props: { name: 'Alice', url: '...' } });

expect(inbox[0].subject).toBe('Welcome, Alice!');
expect(inbox[0].html).toContain('Get Started');
```

## Local testing with Docker (0.6.0)

No real provider credentials needed for local work. The repo ships a `docker-compose.yml` with a complete mock stack.

### Prerequisites

- Docker + Docker Compose
- AWS CLI (only if you want to run LocalStack commands manually — the init script handles verification automatically)
- Optional: a [LocalStack auth token](https://app.localstack.cloud/sign-in) if you want LocalStack Pro features (Community edition works for SES without one — set `LOCALSTACK_AUTH_TOKEN=` to an empty string or remove the env var from your `.env`)

### One-command stack

```bash
# from repo root (or copy docker-compose.yml to your project)
docker compose up -d
```

Services and ports:

| Service | Port | Purpose |
|---------|------|---------|
| Mailpit | `1025` (SMTP), `8025` (UI) | Catches all mail; browse at http://localhost:8025 |
| WireMock | `8080` | HTTP stubs for Resend, SendGrid, Postmark |
| LocalStack | `4566` | SES-compatible AWS endpoint |

The LocalStack container auto-verifies your sender address on startup via the bundled `scripts/localstack/init-ses.sh` ready-hook — no manual `aws ses verify-email-identity` step.

### Wiring providers to local mocks

**Mailpit (SMTP provider)**

```ts
import { mailpit } from '@yedoma-labs/tierde-mail/providers/mailpit';

const mailer = createMailer({
  provider: mailpit(), // default: localhost:1025
  from: 'hello@example.com',
});
// Send anything — open http://localhost:8025 to see it
```

**Resend → WireMock**

```ts
import { resend } from '@yedoma-labs/tierde-mail/providers/resend';

const mailer = createMailer({
  provider: resend({
    apiKey: 'test-key',           // any non-empty string
    baseUrl: 'http://localhost:8080',
  }),
  from: 'hello@example.com',
});
// WireMock stubs POST /emails → returns { id: "wiremock-resend-message-id" }
```

**SendGrid → WireMock**

```ts
import { sendgrid } from '@yedoma-labs/tierde-mail/providers/sendgrid';

const mailer = createMailer({
  provider: sendgrid({
    apiKey: 'test-key',
    baseUrl: 'http://localhost:8080',
  }),
  from: 'hello@example.com',
});
// WireMock stubs POST /v3/mail/send → 202
```

**Postmark → WireMock**

```ts
import { postmark } from '@yedoma-labs/tierde-mail/providers/postmark';

const mailer = createMailer({
  provider: postmark({
    serverToken: 'test-token',
    baseUrl: 'http://localhost:8080',
  }),
  from: 'hello@example.com',
});
// WireMock stubs POST /email → 200
```

**SES → LocalStack**

```ts
import { ses } from '@yedoma-labs/tierde-mail/providers/ses';

const mailer = createMailer({
  provider: ses({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  }),
  from: 'dev@example.com',   // must match TIERDE_FROM_EMAIL in docker-compose.yml
});
```

### Using `createMailerFromEnv` with the local stack

All mock URLs are configurable via env vars — no code changes needed between local and production:

```bash
# .env.local

# shared
TIERDE_FROM_EMAIL=dev@example.com
TIERDE_FROM_NAME=Local Dev

# pick one:

# Mailpit
TIERDE_PROVIDER=mailpit
MAILPIT_HOST=localhost
MAILPIT_PORT=1025

# Resend → WireMock
TIERDE_PROVIDER=resend
RESEND_API_KEY=test-key
RESEND_BASE_URL=http://localhost:8080

# SendGrid → WireMock
TIERDE_PROVIDER=sendgrid
SENDGRID_API_KEY=test-key
SENDGRID_BASE_URL=http://localhost:8080

# Postmark → WireMock
TIERDE_PROVIDER=postmark
POSTMARK_SERVER_TOKEN=test-token
POSTMARK_BASE_URL=http://localhost:8080

# SES → LocalStack
TIERDE_PROVIDER=ses
SES_REGION=us-east-1
SES_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

```ts
import { createMailerFromEnv } from '@yedoma-labs/tierde-mail';

const mailer = createMailerFromEnv(); // reads above env vars
```

**Guard:** if `SES_ENDPOINT` is set but `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are missing, `createMailerFromEnv` throws a descriptive error rather than silently falling through to ambient AWS credentials (SSO sessions, named profiles).

### Smoke-testing via CLI

```bash
# fire a real send through whichever provider is configured in env
TIERDE_PROVIDER=resend RESEND_API_KEY=test-key RESEND_BASE_URL=http://localhost:8080 \
TIERDE_FROM_EMAIL=dev@example.com \
  npx tierde send welcome \
  --to me@example.com \
  --props '{"name":"Alice","loginUrl":"https://example.com"}'
# → sent: wiremock-resend-message-id
```

## Advanced patterns

### Environment-aware provider selection

```ts
const mailer = createMailer({
  provider: process.env.NODE_ENV === 'production'
    ? resend({ apiKey: process.env.RESEND_API_KEY! })
    : resend({
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080', // WireMock — same code path as prod
      }),
  from: 'hello@example.com',
});
```

Or use `mailpit()` if you want to read the email in a browser rather than assert on a mock response.

### Multi-provider failover

```ts
import { failoverProvider } from '@yedoma-labs/tierde-mail/strategies';

const provider = failoverProvider([
  resend({ apiKey: process.env.RESEND_API_KEY }),
  mailpit(), // fallback to local for dev
]);
```

### Dynamic theming per email type

```ts
const PasswordReset = defineEmail<{ ... }>({
  component: (props) => (
    <ThemeProvider theme={createTheme({ primaryColor: '#dc2626' })}>
      <EmailTemplate>
        {/* Red theme for security emails */}
      </EmailTemplate>
    </ThemeProvider>
  ),
});
```

### Derived/computed props in templates

```ts
const Invoice = defineEmail<{ items: Item[]; tax: number }>({
  component: (props) => {
    const subtotal = props.items.reduce((s, i) => s + i.price, 0);
    const total = subtotal + props.tax;
    return (
      <EmailTemplate>
        <Text>Total: ${total.toFixed(2)}</Text>
      </EmailTemplate>
    );
  },
});
```

### Conditional content

```ts
const Newsletter = defineEmail<{ tier: 'free' | 'pro'; proFeatures?: string[] }>({
  component: ({ tier, proFeatures }) => (
    <EmailTemplate>
      {tier === 'pro' && proFeatures && (
        <Section>
          <Heading level={2}>Your Pro Features</Heading>
          {proFeatures.map((f) => <Text key={f}>{f}</Text>)}
        </Section>
      )}
    </EmailTemplate>
  ),
});
```

### Attachments

Pass PDFs, images, or CSVs alongside any email:

```ts
await mailer.send(InvoiceEmail, {
  to: 'customer@example.com',
  props: { invoiceNumber: 'INV-2026-001', total: 149.00 },
  attachments: [
    {
      filename: 'invoice-2026-001.pdf',
      content: pdfBuffer,          // Buffer or base64 string
      contentType: 'application/pdf',
    },
  ],
});
```

For batch sends with a shared attachment (e.g. terms PDF) plus a per-recipient one (personal invoice):

```ts
await mailer.sendBatch(InvoiceEmail, {
  attachments: [
    { filename: 'terms.pdf', content: termsBuffer, contentType: 'application/pdf' },
  ],
  recipients: customers.map((c) => ({
    to: c.email,
    props: { invoiceNumber: c.invoiceNumber, total: c.total },
    attachments: [
      { filename: `invoice-${c.invoiceNumber}.pdf`, content: c.pdfBuffer, contentType: 'application/pdf' },
    ],
  })),
});
```

Allowed content types: `application/pdf`, `application/zip`, `image/*`, `text/plain`, `text/csv`. Anything else throws before a provider call is made.

### Inline images (embedded)

Use `embedImages` middleware to fetch remote images and embed them inline. Recipients see the image even with remote image loading blocked:

```ts
import { createMailer, embedImages } from '@yedoma-labs/tierde-mail';

const mailer = createMailer({
  provider: smtp({ ... }),
  from: 'hello@example.com',
  middleware: [
    embedImages([
      'https://cdn.example.com/logo.png',
    ]),
  ],
});
```

Your template references the image by its original URL — `embedImages` rewrites `src` to `cid:logo.png` at send time and attaches the file inline.

## Architecture decisions and trade-offs

### Why server-side render, not client-side?

Email clients don't run JavaScript. Rendering must happen at send time on the server. This is a feature: your templates are guaranteed safe from XSS and have no runtime dependencies in the inbox.

### Why React?

React's JSX syntax is already familiar to 90% of Node devs. The ecosystem of component libraries and tooling is mature. You get free refactoring and testing tools (Babel, TypeScript, testing libraries) without learning a new template language.

### Why not inline all CSS?

Some complex layouts benefit from a `<style>` block (e.g., dark mode with `@media`). Inlining still happens for component-level styles; you can opt out per email with the `inlineCSS` flag if you need pixel-perfect control.

### Provider lock-in - solved

The provider interface is minimal. Write your own in ~20 lines:

```ts
import nodemailer from 'nodemailer';

export const mySmtpProvider = (config: SMTPConfig) => ({
  name: 'my-smtp',
  async send(message: EmailMessage) {
    const transporter = nodemailer.createTransport(config);
    const result = await transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { id: result.messageId, accepted: [message.to] };
  },
});

const mailer = createMailer({ provider: mySmtpProvider(smtpConfig), ... });
```

## Debugging and monitoring

### Enable debug logging

```ts
const mailer = createMailer({
  provider: resend({ apiKey: '...' }),
  from: 'hello@example.com',
  debug: process.env.DEBUG === 'true',
});
// Logs render time, provider response, rendered HTML size
```

### Inspect rendered HTML before sending

```ts
import { renderTemplate } from '@yedoma-labs/tierde-mail/render';

const { html, text } = await renderTemplate(Welcome, {
  name: 'Alice',
  url: 'https://example.com',
});

console.log(html); // Full rendered email - paste into email client to preview
```

### Common gotchas

1. **React key warnings in batch sends.** When rendering lists in templates, always key them:
   ```tsx
   {items.map((item) => <Item key={item.id} {...item} />)}
   ```

2. **Async data in props.** Templates can't fetch data at render time. Compute everything before calling `mailer.send()`:
   ```ts
   // Wrong: props.user = await db.getUser(id) happens inside component
   // Right: fetch outside, pass as prop
   const user = await db.getUser(id);
   await mailer.send(Welcome, { to: user.email, props: { user } });
   ```

3. **Image URLs must be absolute.** Email clients don't resolve relative URLs. Use `https://cdn.example.com/image.png`, not `/images/...`.

4. **Provider API keys in environment.** Never commit `.env` files with real keys. Use `process.env.RESEND_API_KEY!` with the `!` to assert at runtime if missing.

## Production checklist

- [ ] **Provider secrets in env vars.** Never commit API keys; use `.env.local` (git-ignored).
- [ ] **Test email rendering.** Run `npx tierde dev` and preview every email variant in dark mode.
- [ ] **Local mock smoke test.** Run `docker compose up -d` and fire `npx tierde send` against WireMock/LocalStack before touching real credentials.
- [ ] **`SES_ENDPOINT` guard.** If using SES locally, always set `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`; `createMailerFromEnv` will throw if you forget.
- [ ] **Webhook handlers.** Set up bounce/complaint/delivery handlers for Resend/Postmark to clean your list.
- [ ] **Rate limits.** If batch-sending, honor provider limits (Resend: 100/sec free tier, SES: 14 per second base).
- [ ] **Monitoring.** Log `result.id` for every send; wire that to observability (Sentry, DataDog) for delivery tracking.
- [ ] **Unsubscribe footer.** GDPR/CAN-SPAM requires unsubscribe link. `<Footer unsubscribeUrl={...} />` handles it.

## Resources

- **Docs**: See `README.md` in the repo for full API reference, all providers, and examples.
- **GitHub**: [`yedoma-labs/tierde-mail`](https://github.com/yedoma-labs/tierde-mail) - open issues, contribute templates.
- **npm**: [`@yedoma-labs/tierde-mail`](https://www.npmjs.com/package/@yedoma-labs/tierde-mail) - version history, package info.
- **Built-in templates**: Run `npx tierde list` to see all 41 ready-made templates. Eject any with `npx tierde eject welcome --output src/emails/`.
- **TypeScript types**: Full type definitions ship with the package; autocomplete works in VS Code/JetBrains.

## Closing

`tierde-mail` exists because email rendering and email delivery should be two separate concerns, and neither should require hand-maintained table HTML. The 41 built-in templates are WCAG AA contrast-checked in CI and you can `tierde eject` any of them into your repo to own the source.

**Limitations to know:**
- Node-only (server-side render needs Node; no edge runtime rendering yet, but delivery can be edge-triggered).
- React 19 is a hard peer dependency (controls your version independently).
- Webhook verification covers Resend and Postmark; SMTP, SES, SendGrid, and `nodemailer` are optional peers you install yourself.
- CSS support is email-safe subset (no flexbox, limited grid); table-based layouts are automatic.
- Plain-text fallback is auto-derived; customize with `textFallback` option if needed.

**Performance:** Template render is <5ms for typical emails; async time is 100% provider latency.

If you send transactional email from TypeScript and control your stack, it's worth an afternoon to wire in. You'll be grateful the next time a designer asks to change the button color, or a compliance audit forces a provider switch.
