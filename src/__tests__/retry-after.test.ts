import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderHttpError, parseRetryAfter } from '../provider-error.js';
import { brevo } from '../providers/brevo.js';
import { mailersend } from '../providers/mailersend.js';
import { mailgun } from '../providers/mailgun.js';
import { mandrill } from '../providers/mandrill.js';
import { postmark } from '../providers/postmark.js';
import { resend } from '../providers/resend.js';
import { sendgrid } from '../providers/sendgrid.js';
import { sparkpost } from '../providers/sparkpost.js';
import type { EmailMessage } from '../types.js';

const message: EmailMessage = {
  from: { email: 'sender@example.com' },
  to: { email: 'recipient@example.com' },
  subject: 'Retry-After',
  html: '<p>Hi</p>',
};

describe('parseRetryAfter', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');

  it('parses delay-seconds into milliseconds', () => {
    expect(parseRetryAfter('7', now)).toBe(7000);
    expect(parseRetryAfter(' 120 ', now)).toBe(120_000);
    expect(parseRetryAfter('0', now)).toBe(0);
  });

  it('parses an HTTP-date relative to now', () => {
    expect(parseRetryAfter('Thu, 01 Jan 2026 00:00:30 GMT', now)).toBe(30_000);
  });

  it('clamps an HTTP-date in the past to zero', () => {
    expect(parseRetryAfter('Wed, 31 Dec 2025 23:59:00 GMT', now)).toBe(0);
  });

  it('returns undefined for missing or unparseable values', () => {
    expect(parseRetryAfter(null, now)).toBeUndefined();
    expect(parseRetryAfter(undefined, now)).toBeUndefined();
    expect(parseRetryAfter('', now)).toBeUndefined();
    expect(parseRetryAfter('soon', now)).toBeUndefined();
    expect(parseRetryAfter('-5', now)).toBeUndefined();
  });
});

function rateLimited(retryAfter: string | null) {
  const headers = new Headers(retryAfter === null ? {} : { 'retry-after': retryAfter });
  return {
    ok: false,
    status: 429,
    headers,
    text: async () => 'slow down',
  } as unknown as Response;
}

describe('HTTP providers expose status and Retry-After', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const providers = [
    { name: 'resend', prefix: 'Resend API error', make: () => resend({ apiKey: 'k' }) },
    { name: 'sendgrid', prefix: 'SendGrid API error', make: () => sendgrid({ apiKey: 'k' }) },
    { name: 'postmark', prefix: 'Postmark API error', make: () => postmark({ serverToken: 'k' }) },
    {
      name: 'mailgun',
      prefix: 'Mailgun API error',
      make: () => mailgun({ apiKey: 'k', domain: 'mg.example.com' }),
    },
    { name: 'brevo', prefix: 'Brevo API error', make: () => brevo({ apiKey: 'k' }) },
    {
      name: 'mailersend',
      prefix: 'MailerSend API error',
      make: () => mailersend({ apiToken: 'k' }),
    },
    { name: 'sparkpost', prefix: 'SparkPost API error', make: () => sparkpost({ apiKey: 'k' }) },
    { name: 'mandrill', prefix: 'Mandrill API error', make: () => mandrill({ apiKey: 'k' }) },
  ];

  for (const { name, prefix, make } of providers) {
    it(`${name}: 429 with Retry-After yields ProviderHttpError`, async () => {
      vi.mocked(fetch).mockResolvedValueOnce(rateLimited('7'));
      const err = await make()
        .send(message)
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(ProviderHttpError);
      const httpErr = err as ProviderHttpError;
      expect(httpErr.status).toBe(429);
      expect(httpErr.retryAfterMs).toBe(7000);
      expect(httpErr.message).toBe(`${prefix} 429: slow down`);
    });

    it(`${name}: missing Retry-After leaves retryAfterMs undefined`, async () => {
      vi.mocked(fetch).mockResolvedValueOnce(rateLimited(null));
      const err = (await make()
        .send(message)
        .catch((e: unknown) => e)) as ProviderHttpError;

      expect(err.status).toBe(429);
      expect(err.retryAfterMs).toBeUndefined();
    });
  }
});
