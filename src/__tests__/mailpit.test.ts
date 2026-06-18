import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mailpit } from '../providers/mailpit.js';

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}));

const baseMessage = {
  from: { email: 'sender@localhost' },
  to: { email: 'recipient@localhost' },
  subject: 'Test',
  html: '<p>Hello</p>',
  text: 'Hello',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: 'msg-abc' });
});

describe('mailpit provider', () => {
  it('connects to localhost:1025 by default', async () => {
    const provider = mailpit();
    await provider.send(baseMessage);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'localhost', port: 1025, secure: false }),
    );
  });

  it('disables TLS verification for self-signed certs', async () => {
    const provider = mailpit();
    await provider.send(baseMessage);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ tls: { rejectUnauthorized: false } }),
    );
  });

  it('accepts custom host and port', async () => {
    const provider = mailpit({ host: 'mailpit', port: 2525 });
    await provider.send(baseMessage);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'mailpit', port: 2525 }),
    );
  });

  it('returns provider name mailpit', async () => {
    const provider = mailpit();
    const result = await provider.send(baseMessage);
    expect(result.provider).toBe('mailpit');
  });

  it('returns messageId from nodemailer', async () => {
    const provider = mailpit();
    const result = await provider.send(baseMessage);
    expect(result.id).toBe('msg-abc');
  });

  it('falls back to generated id when messageId absent', async () => {
    mockSendMail.mockResolvedValue({});
    const provider = mailpit();
    const result = await provider.send(baseMessage);
    expect(result.id).toMatch(/^mailpit-/);
  });

  it('passes cc, bcc, replyTo when provided', async () => {
    const provider = mailpit();
    await provider.send({
      ...baseMessage,
      cc: { email: 'cc@localhost' },
      bcc: { email: 'bcc@localhost' },
      replyTo: { email: 'reply@localhost' },
    });

    const call = mockSendMail.mock.calls[0]?.[0];
    expect(call.cc).toBe('cc@localhost');
    expect(call.bcc).toBe('bcc@localhost');
    expect(call.replyTo).toBe('reply@localhost');
  });

  it('formats display names in addresses', async () => {
    const provider = mailpit();
    await provider.send({
      ...baseMessage,
      from: { email: 'dev@localhost', name: 'Dev Team' },
    });

    const call = mockSendMail.mock.calls[0]?.[0];
    expect(call.from).toBe('"Dev Team" <dev@localhost>');
  });

  it('name property is mailpit', () => {
    expect(mailpit().name).toBe('mailpit');
  });
});
