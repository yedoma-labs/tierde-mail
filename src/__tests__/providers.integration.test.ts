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
 * Per-provider (real API):
 *   resend:      RESEND_API_KEY
 *   sendgrid:    SENDGRID_API_KEY
 *   postmark:    POSTMARK_SERVER_TOKEN
 *   smtp:        SMTP_HOST (+ optional SMTP_PORT, SMTP_USER, SMTP_PASS)
 *   mailpit:     TIERDE_TEST_MAILPIT=true  (assumes localhost:1025)
 *   ses:         SES_REGION or AWS_REGION (no attachment/CID support)
 *   mailgun:     MAILGUN_API_KEY + MAILGUN_DOMAIN (+ optional MAILGUN_REGION=eu)
 *   brevo:       BREVO_API_KEY
 *   mailersend:  MAILERSEND_API_TOKEN
 *   sparkpost:   SPARKPOST_API_KEY (paid only — use WireMock for free)
 *   mandrill:    MANDRILL_API_KEY  (paid only — use WireMock for free)
 *
 * WireMock (docker compose up -d → localhost:8080):
 *   TIERDE_TEST_WIREMOCK=true  runs mock suites for all HTTP providers
 *   WIREMOCK_URL=http://localhost:8080  (default)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { htmlToPlainText } from '../plain-text.js';
import { renderEmail } from '../render.js';
import { FeatureAnnouncement } from '../templates/FeatureAnnouncement.js';
import { resolveSubject } from '../types.js';
import type { Attachment, EmailMessage } from '../types.js';

const FROM = process.env.TIERDE_TEST_FROM;
const TO = process.env.TIERDE_TEST_TO;

// Real smoketest image from the repo — used for CID inline attachment tests.
const SMOKETEST_PNG = readFileSync(join(process.cwd(), 'assets/smoketest-resized-mobile.png'));

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
    subject: resolveSubject(FeatureAnnouncement.subject, { ...props, appName: 'tierde-mail' }),
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

// ---------------------------------------------------------------------------
// Mailgun — real API (free tier: 5k emails/mo)
//   MAILGUN_API_KEY=key-...  MAILGUN_DOMAIN=mg.example.com
// Mailgun via WireMock (docker compose up -d)
//   TIERDE_TEST_WIREMOCK=true
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.MAILGUN_API_KEY)(
  'mailgun provider (integration)',
  () => {
    async function mg() {
      const { mailgun } = await import('../providers/mailgun.js');
      return mailgun({
        apiKey: process.env.MAILGUN_API_KEY!,
        domain: process.env.MAILGUN_DOMAIN!,
        ...(process.env.MAILGUN_REGION === 'eu' ? { region: 'eu' as const } : {}),
      });
    }

    it('sends email and returns id', async () => {
      const result = await (await mg()).send(testMessage('mailgun'));
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });

    it('sends email with PDF attachment', async () => {
      const msg = withAttachment(testMessage('mailgun-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await (await mg()).send(msg);
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const cid = 'logo@mailgun-ci';
      const msg = withAttachment(
        {
          ...testMessage('mailgun-cid'),
          html: `${baseMessage('mailgun-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await (await mg()).send(msg);
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const result = await (await mg()).send(
        withExternalImage(testMessage('mailgun-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });
  },
);

describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_WIREMOCK)(
  'mailgun provider (WireMock)',
  () => {
    const WIREMOCK = process.env.WIREMOCK_URL ?? 'http://localhost:8080';

    it('sends via WireMock and returns stubbed id', async () => {
      const { mailgun } = await import('../providers/mailgun.js');
      const result = await mailgun({
        apiKey: 'test',
        domain: 'mg.example.com',
        baseUrl: WIREMOCK,
      }).send(testMessage('mailgun-wiremock'));
      expect(result.provider).toBe('mailgun');
      expect(result.id).toContain('wiremock-mailgun');
    });

    it('sends with PDF attachment', async () => {
      const { mailgun } = await import('../providers/mailgun.js');
      const provider = mailgun({ apiKey: 'test', domain: 'mg.example.com', baseUrl: WIREMOCK });
      const result = await provider.send(
        withAttachment(testMessage('mailgun-wm-attach'), {
          filename: 'doc.pdf',
          content: TINY_PDF,
          contentType: 'application/pdf',
        }),
      );
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });

    it('sends with CID inline image', async () => {
      const { mailgun } = await import('../providers/mailgun.js');
      const cid = 'logo@mailgun-wm';
      const provider = mailgun({ apiKey: 'test', domain: 'mg.example.com', baseUrl: WIREMOCK });
      const result = await provider.send(
        withAttachment(
          {
            ...testMessage('mailgun-wm-cid'),
            html: `${baseMessage('mailgun-wm-cid').html}\n<img src="cid:${cid}" alt="logo">`,
          },
          { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
        ),
      );
      expect(result.provider).toBe('mailgun');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// Brevo — real API (free tier: 300 emails/day)
//   BREVO_API_KEY=xkeysib-...
// Brevo via WireMock
//   TIERDE_TEST_WIREMOCK=true
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.BREVO_API_KEY)('brevo provider (integration)', () => {
  async function bp() {
    const { brevo } = await import('../providers/brevo.js');
    return brevo({ apiKey: process.env.BREVO_API_KEY! });
  }

  it('sends email and returns id', async () => {
    const result = await (await bp()).send(testMessage('brevo'));
    expect(result.provider).toBe('brevo');
    expect(result.id).toBeTruthy();
  });

  it('sends email with PDF attachment', async () => {
    const msg = withAttachment(testMessage('brevo-attachment'), {
      filename: 'report.pdf',
      content: TINY_PDF,
      contentType: 'application/pdf',
    });
    const result = await (await bp()).send(msg);
    expect(result.provider).toBe('brevo');
    expect(result.id).toBeTruthy();
  });

  it('sends email with CID inline image', async () => {
    const cid = 'logo@brevo-ci';
    const msg = withAttachment(
      {
        ...testMessage('brevo-cid'),
        html: `${baseMessage('brevo-cid').html}\n<img src="cid:${cid}" alt="logo">`,
      },
      { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
    );
    const result = await (await bp()).send(msg);
    expect(result.provider).toBe('brevo');
    expect(result.id).toBeTruthy();
  });

  it('sends email with external image src', async () => {
    const result = await (await bp()).send(
      withExternalImage(testMessage('brevo-img'), EXTERNAL_IMAGE_URL),
    );
    expect(result.provider).toBe('brevo');
    expect(result.id).toBeTruthy();
  });
});

describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_WIREMOCK)(
  'brevo provider (WireMock)',
  () => {
    const WIREMOCK = process.env.WIREMOCK_URL ?? 'http://localhost:8080';

    it('sends via WireMock and returns stubbed id', async () => {
      const { brevo } = await import('../providers/brevo.js');
      const result = await brevo({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        testMessage('brevo-wiremock'),
      );
      expect(result.provider).toBe('brevo');
      expect(result.id).toContain('wiremock-brevo');
    });

    it('sends with PDF attachment', async () => {
      const { brevo } = await import('../providers/brevo.js');
      const result = await brevo({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(testMessage('brevo-wm-attach'), {
          filename: 'doc.pdf',
          content: TINY_PDF,
          contentType: 'application/pdf',
        }),
      );
      expect(result.provider).toBe('brevo');
      expect(result.id).toBeTruthy();
    });

    it('sends with CID inline image', async () => {
      const { brevo } = await import('../providers/brevo.js');
      const cid = 'logo@brevo-wm';
      const result = await brevo({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(
          {
            ...testMessage('brevo-wm-cid'),
            html: `${baseMessage('brevo-wm-cid').html}\n<img src="cid:${cid}" alt="logo">`,
          },
          { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
        ),
      );
      expect(result.provider).toBe('brevo');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// MailerSend — real API (free tier: 3k emails/mo)
//   MAILERSEND_API_TOKEN=mlsn.abc...
// MailerSend via WireMock
//   TIERDE_TEST_WIREMOCK=true
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.MAILERSEND_API_TOKEN)(
  'mailersend provider (integration)',
  () => {
    async function ms() {
      const { mailersend } = await import('../providers/mailersend.js');
      return mailersend({ apiToken: process.env.MAILERSEND_API_TOKEN! });
    }

    it('sends email and returns id', async () => {
      const result = await (await ms()).send(testMessage('mailersend'));
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });

    it('sends email with PDF attachment', async () => {
      const msg = withAttachment(testMessage('mailersend-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await (await ms()).send(msg);
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const cid = 'logo@mailersend-ci';
      const msg = withAttachment(
        {
          ...testMessage('mailersend-cid'),
          html: `${baseMessage('mailersend-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await (await ms()).send(msg);
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const result = await (await ms()).send(
        withExternalImage(testMessage('mailersend-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });
  },
);

describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_WIREMOCK)(
  'mailersend provider (WireMock)',
  () => {
    const WIREMOCK = process.env.WIREMOCK_URL ?? 'http://localhost:8080';

    it('sends via WireMock and returns stubbed id', async () => {
      const { mailersend } = await import('../providers/mailersend.js');
      const result = await mailersend({ apiToken: 'test', baseUrl: WIREMOCK }).send(
        testMessage('mailersend-wiremock'),
      );
      expect(result.provider).toBe('mailersend');
      expect(result.id).toContain('wiremock-mailersend');
    });

    it('sends with PDF attachment', async () => {
      const { mailersend } = await import('../providers/mailersend.js');
      const result = await mailersend({ apiToken: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(testMessage('mailersend-wm-attach'), {
          filename: 'doc.pdf',
          content: TINY_PDF,
          contentType: 'application/pdf',
        }),
      );
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });

    it('sends with CID inline image', async () => {
      const { mailersend } = await import('../providers/mailersend.js');
      const cid = 'logo@ms-wm';
      const result = await mailersend({ apiToken: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(
          {
            ...testMessage('ms-wm-cid'),
            html: `${baseMessage('ms-wm-cid').html}\n<img src="cid:${cid}" alt="logo">`,
          },
          { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
        ),
      );
      expect(result.provider).toBe('mailersend');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// SparkPost — no free tier; WireMock only
//   TIERDE_TEST_WIREMOCK=true
// Real API: SPARKPOST_API_KEY=sp-key (requires paid account)
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.SPARKPOST_API_KEY)(
  'sparkpost provider (integration)',
  () => {
    async function sp() {
      const { sparkpost } = await import('../providers/sparkpost.js');
      return sparkpost({ apiKey: process.env.SPARKPOST_API_KEY! });
    }

    it('sends email and returns id', async () => {
      const result = await (await sp()).send(testMessage('sparkpost'));
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });

    it('sends email with PDF attachment', async () => {
      const msg = withAttachment(testMessage('sparkpost-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await (await sp()).send(msg);
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const cid = 'logo@sparkpost-ci';
      const msg = withAttachment(
        {
          ...testMessage('sparkpost-cid'),
          html: `${baseMessage('sparkpost-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await (await sp()).send(msg);
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const result = await (await sp()).send(
        withExternalImage(testMessage('sparkpost-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });
  },
);

describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_WIREMOCK)(
  'sparkpost provider (WireMock)',
  () => {
    const WIREMOCK = process.env.WIREMOCK_URL ?? 'http://localhost:8080';

    it('sends via WireMock and returns stubbed id', async () => {
      const { sparkpost } = await import('../providers/sparkpost.js');
      const result = await sparkpost({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        testMessage('sparkpost-wiremock'),
      );
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toContain('wiremock-sparkpost');
    });

    it('sends with PDF attachment', async () => {
      const { sparkpost } = await import('../providers/sparkpost.js');
      const result = await sparkpost({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(testMessage('sparkpost-wm-attach'), {
          filename: 'doc.pdf',
          content: TINY_PDF,
          contentType: 'application/pdf',
        }),
      );
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });

    it('sends with CID inline image', async () => {
      const { sparkpost } = await import('../providers/sparkpost.js');
      const cid = 'logo@sp-wm';
      const result = await sparkpost({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(
          {
            ...testMessage('sp-wm-cid'),
            html: `${baseMessage('sp-wm-cid').html}\n<img src="cid:${cid}" alt="logo">`,
          },
          { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
        ),
      );
      expect(result.provider).toBe('sparkpost');
      expect(result.id).toBeTruthy();
    });
  },
);

// ---------------------------------------------------------------------------
// Mandrill — no free tier; WireMock only
//   TIERDE_TEST_WIREMOCK=true
// Real API: MANDRILL_API_KEY=mc-key (requires paid Mailchimp account)
// ---------------------------------------------------------------------------
describe.skipIf(!hasBaseEnv() || !process.env.MANDRILL_API_KEY)(
  'mandrill provider (integration)',
  () => {
    async function md() {
      const { mandrill } = await import('../providers/mandrill.js');
      return mandrill({ apiKey: process.env.MANDRILL_API_KEY! });
    }

    it('sends email and returns id', async () => {
      const result = await (await md()).send(testMessage('mandrill'));
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });

    it('sends email with PDF attachment', async () => {
      const msg = withAttachment(testMessage('mandrill-attachment'), {
        filename: 'report.pdf',
        content: TINY_PDF,
        contentType: 'application/pdf',
      });
      const result = await (await md()).send(msg);
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });

    it('sends email with CID inline image', async () => {
      const cid = 'logo@mandrill-ci';
      const msg = withAttachment(
        {
          ...testMessage('mandrill-cid'),
          html: `${baseMessage('mandrill-cid').html}\n<img src="cid:${cid}" alt="logo">`,
        },
        { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
      );
      const result = await (await md()).send(msg);
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });

    it('sends email with external image src', async () => {
      const result = await (await md()).send(
        withExternalImage(testMessage('mandrill-img'), EXTERNAL_IMAGE_URL),
      );
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });
  },
);

describe.skipIf(!hasBaseEnv() || !process.env.TIERDE_TEST_WIREMOCK)(
  'mandrill provider (WireMock)',
  () => {
    const WIREMOCK = process.env.WIREMOCK_URL ?? 'http://localhost:8080';

    it('sends via WireMock and returns stubbed id', async () => {
      const { mandrill } = await import('../providers/mandrill.js');
      const result = await mandrill({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        testMessage('mandrill-wiremock'),
      );
      expect(result.provider).toBe('mandrill');
      expect(result.id).toContain('wiremock-mandrill');
    });

    it('sends with PDF attachment', async () => {
      const { mandrill } = await import('../providers/mandrill.js');
      const result = await mandrill({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(testMessage('mandrill-wm-attach'), {
          filename: 'doc.pdf',
          content: TINY_PDF,
          contentType: 'application/pdf',
        }),
      );
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });

    it('sends with CID inline image', async () => {
      const { mandrill } = await import('../providers/mandrill.js');
      const cid = 'logo@md-wm';
      const result = await mandrill({ apiKey: 'test', baseUrl: WIREMOCK }).send(
        withAttachment(
          {
            ...testMessage('md-wm-cid'),
            html: `${baseMessage('md-wm-cid').html}\n<img src="cid:${cid}" alt="logo">`,
          },
          { filename: 'logo.png', content: SMOKETEST_PNG, contentType: 'image/png', cid },
        ),
      );
      expect(result.provider).toBe('mandrill');
      expect(result.id).toBeTruthy();
    });
  },
);
