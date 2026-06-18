import { describe, expect, it } from 'vitest';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { createMailer } from '../mailer.js';
import type { EmailMessage, EmailProvider, SendResult } from '../types.js';

const TestEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Hello ${name}`,
  component: ({ name }) => (
    <EmailTemplate>
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
      return { id: `${name}-${calls.length}`, provider: name };
    },
  };
}

describe('mailer.sendBatch', () => {
  it('sends to all recipients', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    const result = await mailer.sendBatch(TestEmail, {
      recipients: [
        { to: 'a@a.com', props: { name: 'A' } },
        { to: 'b@b.com', props: { name: 'B' } },
        { to: 'c@c.com', props: { name: 'C' } },
      ],
    });

    expect(provider.calls).toHaveLength(3);
    expect(result.sent).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(3);
  });

  it('returns correct failed count when a send throws', async () => {
    let callCount = 0;
    const flakyProvider: EmailProvider = {
      name: 'flaky',
      async send(_msg): Promise<SendResult> {
        callCount++;
        if (callCount === 2) throw new Error('send failed');
        return { id: `id-${callCount}`, provider: 'flaky' };
      },
    };
    const mailer = createMailer({ provider: flakyProvider, from: 'sender@example.com' });

    const result = await mailer.sendBatch(TestEmail, {
      recipients: [
        { to: 'a@a.com', props: { name: 'A' } },
        { to: 'b@b.com', props: { name: 'B' } },
        { to: 'c@c.com', props: { name: 'C' } },
      ],
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results[1]?.error).toBeInstanceOf(Error);
    expect(result.results[1]?.error?.message).toBe('send failed');
  });

  it('continues sending after individual failures', async () => {
    const provider: EmailProvider = {
      name: 'fail-second',
      async send(msg): Promise<SendResult> {
        const to = Array.isArray(msg.to) ? msg.to[0]?.email : msg.to.email;
        if (to === 'b@b.com') throw new Error('bounce');
        return { id: 'ok', provider: 'fail-second' };
      },
    };
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    const result = await mailer.sendBatch(TestEmail, {
      recipients: [
        { to: 'a@a.com', props: { name: 'A' } },
        { to: 'b@b.com', props: { name: 'B' } },
        { to: 'c@c.com', props: { name: 'C' } },
      ],
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results[2]?.result).toBeDefined();
  });

  it('calls onResult for every recipient', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });
    const collected: string[] = [];

    await mailer.sendBatch(TestEmail, {
      recipients: [
        { to: 'a@a.com', props: { name: 'A' } },
        { to: 'b@b.com', props: { name: 'B' } },
      ],
      onResult: (r) => collected.push(String(r.to)),
    });

    expect(collected).toHaveLength(2);
    expect(collected).toContain('a@a.com');
    expect(collected).toContain('b@b.com');
  });

  it('respects concurrency — sends in chunks', async () => {
    const inFlight: number[] = [];
    let maxConcurrent = 0;

    const concurrencyProvider: EmailProvider = {
      name: 'concurrent',
      async send(): Promise<SendResult> {
        inFlight.push(1);
        maxConcurrent = Math.max(maxConcurrent, inFlight.length);
        await new Promise<void>((r) => setTimeout(r, 10));
        inFlight.pop();
        return { id: 'id', provider: 'concurrent' };
      },
    };

    const mailer = createMailer({ provider: concurrencyProvider, from: 'sender@example.com' });
    const recipients = Array.from({ length: 10 }, (_, i) => ({
      to: `r${i}@example.com`,
      props: { name: `R${i}` },
    }));

    await mailer.sendBatch(TestEmail, { recipients, concurrency: 3 });

    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  it('empty recipients returns zero counts', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    const result = await mailer.sendBatch(TestEmail, { recipients: [] });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(provider.calls).toHaveLength(0);
  });

  it('passes cc and bcc per recipient', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.sendBatch(TestEmail, {
      recipients: [
        { to: 'a@a.com', props: { name: 'A' }, cc: 'cc@example.com', bcc: 'bcc@example.com' },
      ],
    });

    const msg = provider.calls[0];
    expect(msg?.cc).toBeDefined();
    expect(msg?.bcc).toBeDefined();
  });

  it('maxPerSecond sends all recipients and preserves order', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });
    const recipients = Array.from({ length: 6 }, (_, i) => ({
      to: `r${i}@example.com`,
      props: { name: `R${i}` },
    }));

    const result = await mailer.sendBatch(TestEmail, {
      recipients,
      maxPerSecond: 100, // high limit so test is fast
      concurrency: 3,
    });

    expect(result.sent).toBe(6);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(6);
    // Order preserved — first result matches first recipient
    expect(result.results[0]?.to).toBe('r0@example.com');
    expect(result.results[5]?.to).toBe('r5@example.com');
  });

  it('maxPerSecond isolates individual failures', async () => {
    let callCount = 0;
    const provider: EmailProvider & { calls: EmailMessage[] } = {
      name: 'flaky',
      calls: [],
      async send(msg) {
        callCount++;
        if (callCount === 3) throw new Error('transient error');
        this.calls.push(msg);
        return { id: `id-${callCount}`, provider: this.name };
      },
    };
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    const result = await mailer.sendBatch(TestEmail, {
      recipients: Array.from({ length: 5 }, (_, i) => ({
        to: `r${i}@example.com`,
        props: { name: `R${i}` },
      })),
      maxPerSecond: 100,
      concurrency: 5,
    });

    expect(result.sent).toBe(4);
    expect(result.failed).toBe(1);
  });
});
