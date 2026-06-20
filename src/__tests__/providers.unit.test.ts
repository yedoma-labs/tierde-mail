import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailMessage } from '../types.js';

const baseMessage: EmailMessage = {
  from: { email: 'sender@example.com', name: 'Sender' },
  to: { email: 'recipient@example.com' },
  subject: 'Test Subject',
  html: '<p>Hello</p>',
};

// ─── Resend ────────────────────────────────────────────────────────────────

describe('resend provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to /emails with auth header', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'msg_123' }),
    } as Response);

    const { resend } = await import('../providers/resend.js');
    const provider = resend({ apiKey: 'test-key' });
    const result = await provider.send(baseMessage);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(result).toEqual({ id: 'msg_123', provider: 'resend' });
  });

  it('uses custom baseUrl', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'x' }),
    } as Response);

    const { resend } = await import('../providers/resend.js');
    const provider = resend({ apiKey: 'k', baseUrl: 'https://proxy.example.com' });
    await provider.send(baseMessage);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://proxy.example.com/emails');
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'invalid from',
    } as Response);

    const { resend } = await import('../providers/resend.js');
    const provider = resend({ apiKey: 'k' });
    await expect(provider.send(baseMessage)).rejects.toThrow('Resend API error 422');
  });

  it('formats cc/bcc/replyTo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'y' }),
    } as Response);

    const { resend } = await import('../providers/resend.js');
    const provider = resend({ apiKey: 'k' });
    await provider.send({
      ...baseMessage,
      cc: { email: 'cc@example.com', name: 'CC' },
      bcc: [{ email: 'bcc@example.com' }],
      replyTo: { email: 'reply@example.com' },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.cc).toBe('CC <cc@example.com>');
    expect(body.bcc).toEqual(['bcc@example.com']);
    expect(body.reply_to).toBe('reply@example.com');
  });

  it('reports provider name', async () => {
    const { resend } = await import('../providers/resend.js');
    expect(resend({ apiKey: 'k' }).name).toBe('resend');
  });

  it('sends inline attachment with cid', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'z' }),
    } as Response);

    const { resend } = await import('../providers/resend.js');
    await resend({ apiKey: 'k' }).send({
      ...baseMessage,
      attachments: [
        {
          filename: 'banner.png',
          content: Buffer.from('img'),
          contentType: 'image/png',
          cid: 'banner.png',
        },
      ],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].inline).toBe(true);
    expect(body.attachments[0].content_id).toBe('banner.png');
  });

  it('sends regular attachment without cid', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'z' }),
    } as Response);

    const { resend } = await import('../providers/resend.js');
    await resend({ apiKey: 'k' }).send({
      ...baseMessage,
      attachments: [{ filename: 'doc.pdf', content: 'base64data', contentType: 'application/pdf' }],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].inline).toBeUndefined();
    expect(body.attachments[0].content_id).toBeUndefined();
  });
});

// ─── SendGrid ──────────────────────────────────────────────────────────────

describe('sendgrid provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to sendgrid with personalization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'sg-abc' },
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    const provider = sendgrid({ apiKey: 'sg-key' });
    const result = await provider.send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sendgrid.com/v3/mail/send');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sg-key');

    const body = JSON.parse(init.body as string);
    expect(body.personalizations[0].to[0].email).toBe('recipient@example.com');
    expect(result).toEqual({ id: 'sg-abc', provider: 'sendgrid' });
  });

  it('falls back to timestamp id when no X-Message-Id header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    const provider = sendgrid({ apiKey: 'k' });
    const result = await provider.send(baseMessage);
    expect(result.id).toMatch(/^sg-\d+$/);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    await expect(sendgrid({ apiKey: 'k' }).send(baseMessage)).rejects.toThrow(
      'SendGrid API error 403',
    );
  });

  it('includes cc/bcc in personalization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'x' },
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    await sendgrid({ apiKey: 'k' }).send({
      ...baseMessage,
      cc: { email: 'cc@example.com' },
      bcc: [{ email: 'bcc@example.com', name: 'Hidden' }],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.personalizations[0].cc).toEqual([{ email: 'cc@example.com' }]);
    expect(body.personalizations[0].bcc).toEqual([{ email: 'bcc@example.com', name: 'Hidden' }]);
  });

  it('sends inline attachment with disposition inline and content_id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'sg-x' },
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    await sendgrid({ apiKey: 'k' }).send({
      ...baseMessage,
      attachments: [
        {
          filename: 'banner.png',
          content: Buffer.from('img'),
          contentType: 'image/png',
          cid: 'banner.png',
        },
      ],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].disposition).toBe('inline');
    expect(body.attachments[0].content_id).toBe('banner.png');
  });

  it('sends regular attachment with disposition attachment and no content_id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'sg-x' },
    } as unknown as Response);

    const { sendgrid } = await import('../providers/sendgrid.js');
    await sendgrid({ apiKey: 'k' }).send({
      ...baseMessage,
      attachments: [{ filename: 'doc.pdf', content: 'base64data', contentType: 'application/pdf' }],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.attachments[0].disposition).toBe('attachment');
    expect(body.attachments[0].content_id).toBeUndefined();
  });
});

// ─── Postmark ──────────────────────────────────────────────────────────────

describe('postmark provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST with server token header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ MessageID: 'pm-xyz' }),
    } as Response);

    const { postmark } = await import('../providers/postmark.js');
    const result = await postmark({ serverToken: 'pm-tok' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.postmarkapp.com/email');
    expect((init.headers as Record<string, string>)['X-Postmark-Server-Token']).toBe('pm-tok');
    expect(result).toEqual({ id: 'pm-xyz', provider: 'postmark' });
  });

  it('maps headers to Name/Value pairs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ MessageID: 'x' }),
    } as Response);

    const { postmark } = await import('../providers/postmark.js');
    await postmark({ serverToken: 'k' }).send({
      ...baseMessage,
      headers: { 'List-Unsubscribe': '<https://example.com>' },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.Headers).toEqual([{ Name: 'List-Unsubscribe', Value: '<https://example.com>' }]);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response);

    const { postmark } = await import('../providers/postmark.js');
    await expect(postmark({ serverToken: 'k' }).send(baseMessage)).rejects.toThrow(
      'Postmark API error 401',
    );
  });

  it('sends inline attachment with ContentID', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ MessageID: 'pm-x' }),
    } as Response);

    const { postmark } = await import('../providers/postmark.js');
    await postmark({ serverToken: 'k' }).send({
      ...baseMessage,
      attachments: [
        {
          filename: 'banner.png',
          content: Buffer.from('img'),
          contentType: 'image/png',
          cid: 'banner.png',
        },
      ],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.Attachments[0].ContentID).toBe('cid:banner.png');
  });

  it('sends regular attachment without ContentID', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ MessageID: 'pm-x' }),
    } as Response);

    const { postmark } = await import('../providers/postmark.js');
    await postmark({ serverToken: 'k' }).send({
      ...baseMessage,
      attachments: [{ filename: 'doc.pdf', content: 'base64data', contentType: 'application/pdf' }],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.Attachments[0].ContentID).toBeUndefined();
  });
});

// ─── SMTP ──────────────────────────────────────────────────────────────────

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}));

describe('smtp provider', () => {
  beforeEach(() => {
    mockSendMail.mockReset();
    mockCreateTransport.mockReset();
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
  });

  it('uses nodemailer createTransport with config', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: '<smtp@test>' });

    const { smtp } = await import('../providers/smtp.js');
    const result = await smtp({ host: 'smtp.example.com', port: 587 }).send(baseMessage);

    expect(mockCreateTransport).toHaveBeenCalledOnce();
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.com', port: 587, secure: false }),
    );
    expect(result).toEqual({ id: '<smtp@test>', provider: 'smtp' });
  });

  it('defaults secure to true for port 465', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: '<x>' });

    const { smtp } = await import('../providers/smtp.js');
    await smtp({ host: 'smtp.example.com', port: 465 }).send(baseMessage);

    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
  });

  it('falls back to uuid id when messageId missing', async () => {
    mockSendMail.mockResolvedValueOnce({});

    const { smtp } = await import('../providers/smtp.js');
    const result = await smtp({ host: 'smtp.example.com' }).send(baseMessage);
    expect(result.id).toMatch(/^smtp-/);
  });

  it('passes cid to nodemailer for inline attachment', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: '<x>' });

    const { smtp } = await import('../providers/smtp.js');
    await smtp({ host: 'smtp.example.com' }).send({
      ...baseMessage,
      attachments: [
        {
          filename: 'banner.png',
          content: Buffer.from('img'),
          contentType: 'image/png',
          cid: 'banner.png',
        },
      ],
    });

    const call = mockSendMail.mock.calls[0]?.[0];
    expect(call.attachments[0].cid).toBe('banner.png');
  });

  it('omits cid from regular attachments', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: '<x>' });

    const { smtp } = await import('../providers/smtp.js');
    await smtp({ host: 'smtp.example.com' }).send({
      ...baseMessage,
      attachments: [{ filename: 'doc.pdf', content: 'base64data', contentType: 'application/pdf' }],
    });

    const call = mockSendMail.mock.calls[0]?.[0];
    expect(call.attachments[0].cid).toBeUndefined();
  });
});

// ─── SES ───────────────────────────────────────────────────────────────────

const { sesMockSend, sesMockDestroy } = vi.hoisted(() => ({
  sesMockSend: vi.fn(),
  sesMockDestroy: vi.fn(),
}));

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: class MockSESClient {
    send = sesMockSend;
    destroy = sesMockDestroy;
  },
  SendEmailCommand: class MockSendEmailCommand {
    params: unknown;
    constructor(params: unknown) {
      this.params = params;
    }
  },
}));

describe('ses provider', () => {
  beforeEach(() => {
    sesMockSend.mockReset();
    sesMockDestroy.mockReset();
  });

  it('sends via SESClient and returns MessageId', async () => {
    sesMockSend.mockResolvedValueOnce({ MessageId: 'ses-111' });

    const { ses } = await import('../providers/ses.js');
    const result = await ses({ region: 'us-east-1' }).send(baseMessage);

    expect(sesMockSend).toHaveBeenCalledOnce();
    expect(sesMockDestroy).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: 'ses-111', provider: 'ses' });
  });

  it('destroys client even on error', async () => {
    sesMockSend.mockRejectedValueOnce(new Error('SES down'));

    const { ses } = await import('../providers/ses.js');
    await expect(ses({ region: 'us-east-1' }).send(baseMessage)).rejects.toThrow('SES down');
    expect(sesMockDestroy).toHaveBeenCalledOnce();
  });

  it('falls back to uuid id when MessageId missing', async () => {
    sesMockSend.mockResolvedValueOnce({});

    const { ses } = await import('../providers/ses.js');
    const result = await ses({ region: 'eu-west-1' }).send(baseMessage);
    expect(result.id).toMatch(/^ses-/);
  });
});

// ─── Mailgun ───────────────────────────────────────────────────────────────

describe('mailgun provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to v3/{domain}/messages with Basic auth', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '<mg.123@mg.example.com>' }),
    } as Response);

    const { mailgun } = await import('../providers/mailgun.js');
    const result = await mailgun({ apiKey: 'key-abc', domain: 'mg.example.com' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mailgun.net/v3/mg.example.com/messages');
    const auth = (init.headers as Record<string, string>).Authorization ?? '';
    expect(auth).toMatch(/^Basic /);
    const decoded = Buffer.from(auth.slice('Basic '.length), 'base64').toString();
    expect(decoded).toBe('api:key-abc');
    expect(result).toEqual({ id: 'mg.123@mg.example.com', provider: 'mailgun' });
  });

  it('uses EU base URL when region is eu', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'eu-msg' }),
    } as Response);

    const { mailgun } = await import('../providers/mailgun.js');
    await mailgun({ apiKey: 'k', domain: 'd.eu', region: 'eu' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/api\.eu\.mailgun\.net/);
  });

  it('uses custom baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'x' }),
    } as Response);

    const { mailgun } = await import('../providers/mailgun.js');
    await mailgun({ apiKey: 'k', domain: 'd', baseUrl: 'http://localhost:8080' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/v3/d/messages');
  });

  it('sends FormData body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'y' }),
    } as Response);

    const { mailgun } = await import('../providers/mailgun.js');
    await mailgun({ apiKey: 'k', domain: 'd' }).send(baseMessage);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const { mailgun } = await import('../providers/mailgun.js');
    await expect(mailgun({ apiKey: 'bad', domain: 'd' }).send(baseMessage)).rejects.toThrow(
      'Mailgun API error 401',
    );
  });

  it('returns provider name mailgun', async () => {
    const { mailgun } = await import('../providers/mailgun.js');
    expect(mailgun({ apiKey: 'k', domain: 'd' }).name).toBe('mailgun');
  });
});

// ─── Brevo ─────────────────────────────────────────────────────────────────

describe('brevo provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to /v3/smtp/email with api-key header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: '<brevo-123@smtp.brevo.com>' }),
    } as Response);

    const { brevo } = await import('../providers/brevo.js');
    const result = await brevo({ apiKey: 'xkeysib-abc' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init.headers as Record<string, string>)['api-key']).toBe('xkeysib-abc');
    expect(result).toEqual({ id: '<brevo-123@smtp.brevo.com>', provider: 'brevo' });
  });

  it('sends sender/htmlContent fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: 'x' }),
    } as Response);

    const { brevo } = await import('../providers/brevo.js');
    await brevo({ apiKey: 'k' }).send(baseMessage);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toHaveProperty('sender');
    expect(body).toHaveProperty('htmlContent');
    expect(body).not.toHaveProperty('html');
  });

  it('uses custom baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: 'x' }),
    } as Response);

    const { brevo } = await import('../providers/brevo.js');
    await brevo({ apiKey: 'k', baseUrl: 'http://localhost:8080' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/v3/smtp/email');
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    const { brevo } = await import('../providers/brevo.js');
    await expect(brevo({ apiKey: 'k' }).send(baseMessage)).rejects.toThrow('Brevo API error 400');
  });

  it('returns provider name brevo', async () => {
    const { brevo } = await import('../providers/brevo.js');
    expect(brevo({ apiKey: 'k' }).name).toBe('brevo');
  });

  it('puts cid attachments in inlineAttachment', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messageId: 'x' }),
    } as Response);

    const { brevo } = await import('../providers/brevo.js');
    await brevo({ apiKey: 'k' }).send({
      ...baseMessage,
      attachments: [
        {
          filename: 'logo.png',
          content: Buffer.from('img'),
          contentType: 'image/png',
          cid: 'logo.png',
        },
        { filename: 'doc.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' },
      ],
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown[]>;
    expect(body.inlineAttachment).toHaveLength(1);
    expect(body.attachment).toHaveLength(1);
  });
});

// ─── MailerSend ────────────────────────────────────────────────────────────

describe('mailersend provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to /v1/email with Bearer token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: new Headers({ 'X-Message-Id': 'ms-abc-123' }),
    } as Response);

    const { mailersend } = await import('../providers/mailersend.js');
    const result = await mailersend({ apiToken: 'mlsn.abc' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mailersend.com/v1/email');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer mlsn.abc');
    expect(result).toEqual({ id: 'ms-abc-123', provider: 'mailersend' });
  });

  it('converts headers to name/value array', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: new Headers({ 'X-Message-Id': 'x' }),
    } as Response);

    const { mailersend } = await import('../providers/mailersend.js');
    await mailersend({ apiToken: 't' }).send({
      ...baseMessage,
      headers: { 'X-Custom': 'value' },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { headers: { name: string; value: string }[] };
    expect(body.headers).toEqual([{ name: 'X-Custom', value: 'value' }]);
  });

  it('uses custom baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: new Headers({ 'X-Message-Id': 'x' }),
    } as Response);

    const { mailersend } = await import('../providers/mailersend.js');
    await mailersend({ apiToken: 't', baseUrl: 'http://localhost:8080' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/v1/email');
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'Unprocessable Entity',
    } as Response);

    const { mailersend } = await import('../providers/mailersend.js');
    await expect(mailersend({ apiToken: 't' }).send(baseMessage)).rejects.toThrow(
      'MailerSend API error 422',
    );
  });

  it('returns provider name mailersend', async () => {
    const { mailersend } = await import('../providers/mailersend.js');
    expect(mailersend({ apiToken: 't' }).name).toBe('mailersend');
  });
});

// ─── SparkPost ─────────────────────────────────────────────────────────────

describe('sparkpost provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to /api/v1/transmissions with Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { id: 'sp-abc', total_accepted_recipients: 1 } }),
    } as Response);

    const { sparkpost } = await import('../providers/sparkpost.js');
    const result = await sparkpost({ apiKey: 'sp-key' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sparkpost.com/api/v1/transmissions');
    expect((init.headers as Record<string, string>).Authorization).toBe('sp-key');
    expect(result).toEqual({ id: 'sp-abc', provider: 'sparkpost' });
  });

  it('uses EU base URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { id: 'x' } }),
    } as Response);

    const { sparkpost } = await import('../providers/sparkpost.js');
    await sparkpost({ apiKey: 'k', baseUrl: 'https://api.eu.sparkpost.com' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/api\.eu\.sparkpost\.com/);
  });

  it('sends sandbox option when sandbox:true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { id: 'x' } }),
    } as Response);

    const { sparkpost } = await import('../providers/sparkpost.js');
    await sparkpost({ apiKey: 'k', sandbox: true }).send(baseMessage);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { options?: { sandbox: boolean } };
    expect(body.options?.sandbox).toBe(true);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const { sparkpost } = await import('../providers/sparkpost.js');
    await expect(sparkpost({ apiKey: 'bad' }).send(baseMessage)).rejects.toThrow(
      'SparkPost API error 401',
    );
  });

  it('returns provider name sparkpost', async () => {
    const { sparkpost } = await import('../providers/sparkpost.js');
    expect(sparkpost({ apiKey: 'k' }).name).toBe('sparkpost');
  });
});

// ─── Mandrill ──────────────────────────────────────────────────────────────

describe('mandrill provider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends POST to /api/1.0/messages/send with key in body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: 'mdrl-abc', status: 'sent' }],
    } as Response);

    const { mandrill } = await import('../providers/mandrill.js');
    const result = await mandrill({ apiKey: 'mc-key' }).send(baseMessage);

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://mandrillapp.com/api/1.0/messages/send');
    const body = JSON.parse(init.body as string) as { key: string };
    expect(body.key).toBe('mc-key');
    expect(result).toEqual({ id: 'mdrl-abc', provider: 'mandrill' });
  });

  it('maps from_email / from_name fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: 'x', status: 'sent' }],
    } as Response);

    const { mandrill } = await import('../providers/mandrill.js');
    await mandrill({ apiKey: 'k' }).send(baseMessage);

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { message: Record<string, unknown> };
    expect(body.message.from_email).toBe('sender@example.com');
    expect(body.message.from_name).toBe('Sender');
  });

  it('throws when status is rejected', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: 'x', status: 'rejected', reject_reason: 'hard-bounce' }],
    } as Response);

    const { mandrill } = await import('../providers/mandrill.js');
    await expect(mandrill({ apiKey: 'k' }).send(baseMessage)).rejects.toThrow('hard-bounce');
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response);

    const { mandrill } = await import('../providers/mandrill.js');
    await expect(mandrill({ apiKey: 'k' }).send(baseMessage)).rejects.toThrow(
      'Mandrill API error 500',
    );
  });

  it('returns provider name mandrill', async () => {
    const { mandrill } = await import('../providers/mandrill.js');
    expect(mandrill({ apiKey: 'k' }).name).toBe('mandrill');
  });

  it('uses custom baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: 'x', status: 'sent' }],
    } as Response);

    const { mandrill } = await import('../providers/mandrill.js');
    await mandrill({ apiKey: 'k', baseUrl: 'http://localhost:8080' }).send(baseMessage);

    const [url] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/1.0/messages/send');
  });
});
