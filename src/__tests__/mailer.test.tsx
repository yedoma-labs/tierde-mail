import { describe, expect, it } from 'vitest';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { createMailer } from '../mailer.js';
import type { EmailMessage, EmailProvider } from '../types.js';

const TestEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Hello ${name}`,
  component: ({ name }) => (
    <EmailTemplate>
      <Heading>Hello</Heading>
      <Text>{name}</Text>
    </EmailTemplate>
  ),
});

function mockProvider(name = 'mock'): EmailProvider & { calls: EmailMessage[] } {
  const calls: EmailMessage[] = [];
  return {
    name,
    calls,
    async send(msg) {
      calls.push(msg);
      return { id: 'mock-id', provider: name };
    },
  };
}

describe('createMailer', () => {
  it('sends email with correct subject and props', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    const result = await mailer.send(TestEmail, {
      to: 'recipient@example.com',
      props: { name: 'Alice' },
    });

    expect(result.id).toBe('mock-id');
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.subject).toBe('Hello Alice');
    expect(provider.calls[0]?.html).toContain('Alice');
    expect(provider.calls[0]?.from.email).toBe('sender@example.com');
  });

  it('normalizes to/cc/bcc addresses', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.send(TestEmail, {
      to: ['a@b.com', { email: 'c@d.com', name: 'C' }],
      cc: 'cc@example.com',
      props: { name: 'Bob' },
    });

    const msg = provider.calls[0];
    expect(Array.isArray(msg?.to)).toBe(true);
    expect(msg?.to as Array<unknown>).toHaveLength(2);
    expect(Array.isArray(msg?.cc)).toBe(true);
  });

  it('failover tries next provider on error', async () => {
    const failingProvider: EmailProvider = {
      name: 'failing',
      async send() {
        throw new Error('Provider down');
      },
    };
    const backupProvider = mockProvider('backup');

    const mailer = createMailer({
      providers: [failingProvider, backupProvider],
      strategy: 'failover',
      from: 'sender@example.com',
    });

    const result = await mailer.send(TestEmail, {
      to: 'user@example.com',
      props: { name: 'Charlie' },
    });

    expect(result.provider).toBe('backup');
    expect(backupProvider.calls).toHaveLength(1);
  });

  it('throws when all providers fail', async () => {
    const mailer = createMailer({
      providers: [
        {
          name: 'p1',
          async send() {
            throw new Error('p1 down');
          },
        },
        {
          name: 'p2',
          async send() {
            throw new Error('p2 down');
          },
        },
      ],
      strategy: 'failover',
      from: 'sender@example.com',
    });

    await expect(mailer.send(TestEmail, { to: 'u@u.com', props: { name: 'D' } })).rejects.toThrow(
      'p2 down',
    );
  });

  it('rejects invalid to address', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, { to: 'notanemail', props: { name: 'E' } }),
    ).rejects.toThrow(TypeError);
  });

  it('generates plain text automatically', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.text).toBeTruthy();
    expect(provider.calls[0]?.text).toContain('Alice');
  });

  it('round-robin distributes sends across providers', async () => {
    const p1 = mockProvider('p1');
    const p2 = mockProvider('p2');
    const mailer = createMailer({
      providers: [p1, p2],
      strategy: 'round-robin',
      from: 'sender@example.com',
    });

    const results = await Promise.all([
      mailer.send(TestEmail, { to: 'a@a.com', props: { name: 'A' } }),
      mailer.send(TestEmail, { to: 'b@b.com', props: { name: 'B' } }),
      mailer.send(TestEmail, { to: 'c@c.com', props: { name: 'C' } }),
    ]);

    const providers = results.map((r) => r.provider);
    expect(providers).toContain('p1');
    expect(providers).toContain('p2');
    expect(p1.calls.length + p2.calls.length).toBe(3);
  });

  it('rejects empty to array', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, { to: [] as unknown as string, props: { name: 'F' } }),
    ).rejects.toThrow(TypeError);
  });
});
