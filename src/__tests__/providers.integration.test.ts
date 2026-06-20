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
 *   ses:       SES_REGION or AWS_REGION
 *              (SES does not support attachments via SendEmailCommand —
 *               attachment / CID tests are skipped for SES)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { htmlToPlainText } from '../plain-text.js';
import { renderEmail } from '../render.js';
import { FeatureAnnouncement } from '../templates/FeatureAnnouncement.js';
import type { Attachment, EmailMessage } from '../types.js';

const FROM = process.env.TIERDE_TEST_FROM;
const TO = process.env.TIERDE_TEST_TO;

// Real smoketest image from the repo — used for CID inline attachment tests.
const SMOKETEST_PNG = readFileSync(join(process.cwd(), 'assets/smoketest-resized.png'));

// Minimal valid PDF stub — providers validate magic bytes; fake-but-valid header.
const TINY_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 0\ntrailer<<>>\n%%EOF',
);

// Repo-hosted image used in external-image-src tests (loaded by recipient's email client).
const EXTERNAL_IMAGE_URL =
  'https://raw.githubusercontent.com/yedoma-labs/tierde-mail/main/assets/smoketest-resized-mobile.png';

function baseMessage(provider: string): EmailMessage {
  const props = {
    name: 'tierde CI',
    appName: 'tierde-mail',
    featureName: `Integration smoketest — ${provider}`,
    description: `Sent by the tierde-mail CI pipeline to verify the ${provider} provider.`,
    ctaUrl: 'https://github.com/yedoma-labs/tierde-mail',
    changes: [
      {
        type: 'new' as const,
        title: 'Provider verified',
        description: `${provider} delivered this message.`,
      },
      {
        type: 'improvement' as const,
        title: 'Multi-provider support',
        description: 'Resend, SendGrid, Postmark, SES, SMTP, Mailpit.',
      },
      { type: 'fix' as const, title: 'Timestamp', description: new Date().toISOString() },
    ],
  };
  const html = renderEmail(React.createElement(FeatureAnnouncement.component, props));
  return {
    from: { email: FROM! },
    to: { email: TO! },
    subject: FeatureAnnouncement.subject({ ...props, appName: 'tierde-mail' }),
    html,
    text: htmlToPlainText(html),
    attachments: [],
  };
}

// testMessage: plain send (backwards-compatible alias used by legacy test bodies)
function testMessage(provider: string): EmailMessage {
  return baseMessage(provider);
}

function withAttachment(msg: EmailMessage, attachment: Attachment): EmailMessage {
  return { ...msg, attachments: [...(msg.attachments ?? []), attachment] };
}

function withExternalImage(msg: EmailMessage, url: string): EmailMessage {
  return {
    ...msg,
    html: `${msg.html}\n<img src="${url}" alt="logo" width="100">`,
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

    it('sends email with PDF attachment', async () => {
      const { resend } = await import('../providers/resend.js');
      const provider = resend({ apiKey: process.env.RESEND_API_KEY! });
      const msg = withAttachment(testMessage('resend-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await provider.send(msg);
      expect(result.provider).toBe('resend');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const { resend } = await import('../providers/resend.js');
      const provider = resend({ apiKey: process.env.RESEND_API_KEY! });
      const cid = 'logo@resend-ci';
      const msg = withAttachment(
        {
          ...testMessage('resend-cid'),
          html: `${baseMessage('resend-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await provider.send(msg);
      expect(result.provider).toBe('resend');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const { resend } = await import('../providers/resend.js');
      const provider = resend({ apiKey: process.env.RESEND_API_KEY! });
      const result = await provider.send(
        withExternalImage(testMessage('resend-img'), EXTERNAL_IMAGE_URL),
      );
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

    it('sends email with PDF attachment', async () => {
      const { sendgrid } = await import('../providers/sendgrid.js');
      const provider = sendgrid({ apiKey: process.env.SENDGRID_API_KEY! });
      const msg = withAttachment(testMessage('sendgrid-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await provider.send(msg);
      expect(result.provider).toBe('sendgrid');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const { sendgrid } = await import('../providers/sendgrid.js');
      const provider = sendgrid({ apiKey: process.env.SENDGRID_API_KEY! });
      const cid = 'logo@sendgrid-ci';
      const msg = withAttachment(
        {
          ...testMessage('sendgrid-cid'),
          html: `${baseMessage('sendgrid-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await provider.send(msg);
      expect(result.provider).toBe('sendgrid');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const { sendgrid } = await import('../providers/sendgrid.js');
      const provider = sendgrid({ apiKey: process.env.SENDGRID_API_KEY! });
      const result = await provider.send(
        withExternalImage(testMessage('sendgrid-img'), EXTERNAL_IMAGE_URL),
      );
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

    it('sends email with PDF attachment', async () => {
      const { postmark } = await import('../providers/postmark.js');
      const provider = postmark({ serverToken: process.env.POSTMARK_SERVER_TOKEN! });
      const msg = withAttachment(testMessage('postmark-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await provider.send(msg);
      expect(result.provider).toBe('postmark');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const { postmark } = await import('../providers/postmark.js');
      const provider = postmark({ serverToken: process.env.POSTMARK_SERVER_TOKEN! });
      const cid = 'logo@postmark-ci';
      const msg = withAttachment(
        {
          ...testMessage('postmark-cid'),
          html: `${baseMessage('postmark-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await provider.send(msg);
      expect(result.provider).toBe('postmark');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const { postmark } = await import('../providers/postmark.js');
      const provider = postmark({ serverToken: process.env.POSTMARK_SERVER_TOKEN! });
      const result = await provider.send(
        withExternalImage(testMessage('postmark-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('postmark');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SMTP
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.SMTP_HOST)('smtp provider (integration)', () => {
  async function smtpProvider() {
    const { smtp } = await import('../providers/smtp.js');
    const host = process.env.SMTP_HOST!;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    return smtp({
      host,
      port,
      ...(process.env.SMTP_USER && process.env.SMTP_PASS
        ? { auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! } }
        : {}),
    });
  }

  it('sends email and returns id', async () => {
    const provider = await smtpProvider();
    const result = await provider.send(testMessage('smtp'));
    expect(result.provider).toBe('smtp');
    expect(result.id).toBeTruthy();
  });

  it('sends email with PDF attachment', async () => {
    const provider = await smtpProvider();
    const msg = withAttachment(testMessage('smtp-attachment'), {
      filename: 'report.pdf',
      content: TINY_PDF,
      contentType: 'application/pdf',
    });
    const result = await provider.send(msg);
    expect(result.provider).toBe('smtp');
    expect(result.id).toBeTruthy();
  });

  it('sends email with CID inline image', async () => {
    const provider = await smtpProvider();
    const cid = 'logo@smtp-ci';
    const msg = withAttachment(
      {
        ...testMessage('smtp-cid'),
        html: `${baseMessage('smtp-cid').html}\n<img src="cid:${cid}" alt="logo">`,
      },
      { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
    );
    const result = await provider.send(msg);
    expect(result.provider).toBe('smtp');
    expect(result.id).toBeTruthy();
  });

  it('sends email with external image src', async () => {
    const provider = await smtpProvider();
    const result = await provider.send(
      withExternalImage(testMessage('smtp-img'), EXTERNAL_IMAGE_URL),
    );
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

    it('delivers email with PDF attachment', async () => {
      const { mailpit } = await import('../providers/mailpit.js');
      const provider = mailpit();
      const msg = withAttachment(testMessage('mailpit-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await provider.send(msg);
      expect(result.provider).toBe('mailpit');
      expect(result.id).toBeTruthy();
    });

    it('delivers email with CID inline image', async () => {
      const { mailpit } = await import('../providers/mailpit.js');
      const provider = mailpit();
      const cid = 'logo@mailpit-ci';
      const msg = withAttachment(
        {
          ...testMessage('mailpit-cid'),
          html: `${baseMessage('mailpit-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await provider.send(msg);
      expect(result.provider).toBe('mailpit');
      expect(result.id).toBeTruthy();
    });

    it('delivers email with external image src', async () => {
      const { mailpit } = await import('../providers/mailpit.js');
      const provider = mailpit();
      const result = await provider.send(
        withExternalImage(testMessage('mailpit-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('mailpit');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SES
// Note: SendEmailCommand does not support attachments or CID inline images.
// The attachment and CID tests are intentionally omitted for SES.
// External image src in HTML is fine — SES sends the HTML as-is.
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

    it('sends email with external image src', async () => {
      const { ses } = await import('../providers/ses.js');
      const region = (process.env.SES_REGION ?? process.env.AWS_REGION)!;
      const provider = ses({ region });
      const result = await provider.send(
        withExternalImage(testMessage('ses-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('ses');
      expect(result.id).toBeTruthy();
    });
  },
);
