/**
 * Provider integration tests — send a real email through each provider.
 *
 * Each suite is skipped unless the required env vars are set. Run them:
 *
 *   TIERDE_TEST_FROM=you@example.com \
 *   TIERDE_TEST_TO=inbox@example.com \
 *   RESEND_API_KEY=re_... \
 *   pnpm test
 *
 * Required for all suites:
 *   TIERDE_TEST_FROM   verified sender address
 *   TIERDE_TEST_TO     recipient address (use a sandbox / catch-all)
 *
 * Per-provider:
 *   resend:    RESEND_API_KEY
 *   sendgrid:  SENDGRID_API_KEY
 *   postmark:  POSTMARK_SERVER_TOKEN
 *   smtp:      SMTP_HOST (+ optional SMTP_PORT, SMTP_USER, SMTP_PASS)
 *   mailpit:   TIERDE_TEST_MAILPIT=true  (assumes localhost:1025)
 */
import { describe, expect, it } from 'vitest';
import type { EmailMessage } from '../types.js';

const FROM = process.env.TIERDE_TEST_FROM;
const TO = process.env.TIERDE_TEST_TO;

function testMessage(provider: string): EmailMessage {
  return {
    from: { email: FROM! },
    to: { email: TO! },
    subject: `[tierde integration] ${provider} — ${new Date().toISOString()}`,
    html: `<p>Integration test from <strong>${provider}</strong> provider.</p>`,
    text: `Integration test from ${provider} provider.`,
  };
}

function hasBaseEnv(): boolean {
  return Boolean(FROM && TO);
}

// ---------------------------------------------------------------------------
// Resend
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.RESEND_API_KEY)(
  'resend provider (integration)',
  () => {
    it('sends email and returns id', async () => {
      const { resend } = await import('../providers/resend.js');
      const provider = resend({ apiKey: process.env.RESEND_API_KEY! });
      const result = await provider.send(testMessage('resend'));
      expect(result.provider).toBe('resend');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SendGrid
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.SENDGRID_API_KEY)(
  'sendgrid provider (integration)',
  () => {
    it('sends email and returns id', async () => {
      const { sendgrid } = await import('../providers/sendgrid.js');
      const provider = sendgrid({ apiKey: process.env.SENDGRID_API_KEY! });
      const result = await provider.send(testMessage('sendgrid'));
      expect(result.provider).toBe('sendgrid');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// Postmark
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.POSTMARK_SERVER_TOKEN)(
  'postmark provider (integration)',
  () => {
    it('sends email and returns id', async () => {
      const { postmark } = await import('../providers/postmark.js');
      const provider = postmark({ serverToken: process.env.POSTMARK_SERVER_TOKEN! });
      const result = await provider.send(testMessage('postmark'));
      expect(result.provider).toBe('postmark');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.SMTP_HOST)('smtp provider (integration)', () => {
  it('sends email and returns id', async () => {
    const { smtp } = await import('../providers/smtp.js');
    const host = process.env.SMTP_HOST!;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const provider = smtp({
      host,
      port,
      ...(process.env.SMTP_USER && process.env.SMTP_PASS
        ? { auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! } }
        : {}),
    });
    const result = await provider.send(testMessage('smtp'));
    expect(result.provider).toBe('smtp');
    expect(result.id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Mailpit / MailHog (local SMTP dev tool)
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_MAILPIT)(
  'mailpit provider (integration)',
  () => {
    it('delivers to local Mailpit on localhost:1025', async () => {
      const { mailpit } = await import('../providers/mailpit.js');
      const provider = mailpit();
      const result = await provider.send(testMessage('mailpit'));
      expect(result.provider).toBe('mailpit');
      expect(result.id).toBeTruthy();
    });

    it('delivers to custom host/port', async () => {
      const { mailpit } = await import('../providers/mailpit.js');
      const host = process.env.MAILPIT_HOST ?? 'localhost';
      const port = process.env.MAILPIT_PORT ? Number(process.env.MAILPIT_PORT) : 1025;
      const provider = mailpit({ host, port });
      const result = await provider.send(testMessage('mailpit-custom'));
      expect(result.provider).toBe('mailpit');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SES
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !(process.env.SES_REGION ?? process.env.AWS_REGION))(
  'ses provider (integration)',
  () => {
    it('sends email and returns id', async () => {
      const { ses } = await import('../providers/ses.js');
      const region = (process.env.SES_REGION ?? process.env.AWS_REGION)!;
      const provider = ses({ region });
      const result = await provider.send(testMessage('ses'));
      expect(result.provider).toBe('ses');
      expect(result.id).toBeTruthy();
    });
  },
);
