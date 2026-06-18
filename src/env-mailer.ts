import { createEnv, eg } from '@yedoma-labs/bylyt-env-guard';
import { createMailer } from './mailer.js';
import { mailpit } from './providers/mailpit.js';
import { postmark } from './providers/postmark.js';
import { resend } from './providers/resend.js';
import { sendgrid } from './providers/sendgrid.js';
import { ses } from './providers/ses.js';
import { smtp } from './providers/smtp.js';
import type { Mailer } from './types.js';

/**
 * Creates a Mailer from environment variables.
 *
 * Required:
 *   TIERDE_PROVIDER   resend | smtp | ses | sendgrid | postmark | mailpit
 *   TIERDE_FROM_EMAIL sender address
 *
 * Optional:
 *   TIERDE_FROM_NAME  sender display name
 *
 * Per-provider:
 *   resend:   RESEND_API_KEY, RESEND_BASE_URL (optional, e.g. http://localhost:8080 for WireMock)
 *   smtp:     SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_SECURE
 *   ses:      AWS_REGION (or SES_REGION), SES_ENDPOINT (optional, e.g. http://localhost:4566 for LocalStack),
 *             AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (optional, for mock/explicit creds)
 *   sendgrid: SENDGRID_API_KEY, SENDGRID_BASE_URL (optional, e.g. http://localhost:8080 for WireMock)
 *   postmark: POSTMARK_SERVER_TOKEN, POSTMARK_BASE_URL (optional, e.g. http://localhost:8080 for WireMock)
 *   mailpit:  MAILPIT_HOST (default localhost), MAILPIT_PORT (default 1025)
 */
export function createMailerFromEnv(): Mailer {
  const env = createEnv({
    schema: {
      TIERDE_PROVIDER: eg.enum([
        'resend',
        'smtp',
        'ses',
        'sendgrid',
        'postmark',
        'mailpit',
      ] as const),
      TIERDE_FROM_EMAIL: eg.string().required(),
      TIERDE_FROM_NAME: eg.string().optional(),

      // resend
      RESEND_API_KEY: eg.string().sensitive().optional(),
      RESEND_BASE_URL: eg.string().optional(),

      // smtp
      SMTP_HOST: eg.string().optional(),
      SMTP_PORT: eg.integer().default(587),
      SMTP_USER: eg.string().optional(),
      SMTP_PASS: eg.string().sensitive().optional(),
      SMTP_SECURE: eg.boolean().default(false),

      // ses
      SES_REGION: eg.string().optional(),
      AWS_REGION: eg.string().optional(),
      SES_ENDPOINT: eg.string().optional(),
      AWS_ACCESS_KEY_ID: eg.string().sensitive().optional(),
      AWS_SECRET_ACCESS_KEY: eg.string().sensitive().optional(),

      // sendgrid
      SENDGRID_API_KEY: eg.string().sensitive().optional(),
      SENDGRID_BASE_URL: eg.string().optional(),

      // postmark
      POSTMARK_SERVER_TOKEN: eg.string().sensitive().optional(),
      POSTMARK_BASE_URL: eg.string().optional(),

      // mailpit / mailhog
      MAILPIT_HOST: eg.string().default('localhost'),
      MAILPIT_PORT: eg.integer().default(1025),
    },
  });

  const from = env.TIERDE_FROM_NAME
    ? { email: env.TIERDE_FROM_EMAIL, name: env.TIERDE_FROM_NAME }
    : env.TIERDE_FROM_EMAIL;

  switch (env.TIERDE_PROVIDER) {
    case 'resend': {
      if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required for resend provider');
      return createMailer({
        provider: resend({
          apiKey: env.RESEND_API_KEY,
          ...(env.RESEND_BASE_URL ? { baseUrl: env.RESEND_BASE_URL } : {}),
        }),
        from,
      });
    }
    case 'smtp': {
      if (!env.SMTP_HOST) throw new Error('SMTP_HOST is required for smtp provider');
      return createMailer({
        provider: smtp({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          ...(env.SMTP_USER && env.SMTP_PASS
            ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
            : {}),
        }),
        from,
      });
    }
    case 'ses': {
      const region = env.SES_REGION ?? env.AWS_REGION;
      if (!region) throw new Error('SES_REGION or AWS_REGION is required for ses provider');
      if (env.SES_ENDPOINT && !(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY)) {
        throw new Error(
          'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when SES_ENDPOINT is set. ' +
            'For local dev: AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test',
        );
      }
      return createMailer({
        provider: ses({
          region,
          ...(env.SES_ENDPOINT ? { endpoint: env.SES_ENDPOINT } : {}),
          ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
            ? {
                credentials: {
                  accessKeyId: env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                },
              }
            : {}),
        }),
        from,
      });
    }
    case 'sendgrid': {
      if (!env.SENDGRID_API_KEY)
        throw new Error('SENDGRID_API_KEY is required for sendgrid provider');
      return createMailer({
        provider: sendgrid({
          apiKey: env.SENDGRID_API_KEY,
          ...(env.SENDGRID_BASE_URL ? { baseUrl: env.SENDGRID_BASE_URL } : {}),
        }),
        from,
      });
    }
    case 'postmark': {
      if (!env.POSTMARK_SERVER_TOKEN)
        throw new Error('POSTMARK_SERVER_TOKEN is required for postmark provider');
      return createMailer({
        provider: postmark({
          serverToken: env.POSTMARK_SERVER_TOKEN,
          ...(env.POSTMARK_BASE_URL ? { baseUrl: env.POSTMARK_BASE_URL } : {}),
        }),
        from,
      });
    }
    case 'mailpit': {
      return createMailer({
        provider: mailpit({ host: env.MAILPIT_HOST, port: env.MAILPIT_PORT }),
        from,
      });
    }
  }
}
