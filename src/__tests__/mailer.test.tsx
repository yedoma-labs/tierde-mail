import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { createMailer } from '../mailer.js';
import type { EmailMessage, EmailProvider, MailMiddleware } from '../types.js';

const TestEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Hello ${name}`,
  component: ({ name }) => (
    <EmailTemplate>
      <Heading>Hello</Heading>
      <Text>{name}</Text>
    </EmailTemplate>
  ),
});

const LinkedEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Hello ${name}`,
  component: ({ name }) => (
    <EmailTemplate>
      <Text>{name}</Text>
      <Button href="https://example.com/original">Click</Button>
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

describe('middleware', () => {
  it('transforms html before provider receives it', async () => {
    const provider = mockProvider();
    const pixel: MailMiddleware = (msg) => ({
      ...msg,
      html: msg.html + '<img src="https://track.example.com/open/1" width="1" height="1" alt="" />',
    });

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [pixel] });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.html).toContain('https://track.example.com/open/1');
  });

  it('can transform subject and headers', async () => {
    const provider = mockProvider();
    const addHeader: MailMiddleware = (msg) => ({
      ...msg,
      subject: `[TEST] ${msg.subject}`,
      headers: { ...msg.headers, 'X-Custom': 'yes' },
    });

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [addHeader] });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.subject).toBe('[TEST] Hello Alice');
    expect(provider.calls[0]?.headers?.['X-Custom']).toBe('yes');
  });

  it('runs multiple middleware in order', async () => {
    const provider = mockProvider();
    const order: number[] = [];

    const first: MailMiddleware = (msg) => { order.push(1); return { ...msg, html: msg.html + '<!--1-->' }; };
    const second: MailMiddleware = (msg) => { order.push(2); return { ...msg, html: msg.html + '<!--2-->' }; };
    const third: MailMiddleware = (msg) => { order.push(3); return { ...msg, html: msg.html + '<!--3-->' }; };

    const mailer = createMailer({
      provider,
      from: 'sender@example.com',
      middleware: [first, second, third],
    });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(order).toEqual([1, 2, 3]);
    const html = provider.calls[0]?.html ?? '';
    expect(html.indexOf('<!--1-->')).toBeLessThan(html.indexOf('<!--2-->'));
    expect(html.indexOf('<!--2-->')).toBeLessThan(html.indexOf('<!--3-->'));
  });

  it('supports async middleware', async () => {
    const provider = mockProvider();
    const asyncMw: MailMiddleware = async (msg) => {
      await Promise.resolve();
      return { ...msg, html: msg.html + '<!--async-->' };
    };

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [asyncMw] });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.html).toContain('<!--async-->');
  });

  it('receives full EmailMessage context', async () => {
    const provider = mockProvider();
    const captured: EmailMessage[] = [];
    const spy: MailMiddleware = (msg) => { captured.push(msg); return msg; };

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [spy] });
    await mailer.send(TestEmail, {
      to: 'user@example.com',
      props: { name: 'Alice' },
      headers: { 'X-Ref': 'abc' },
    });

    expect(captured[0]?.from.email).toBe('sender@example.com');
    expect(captured[0]?.html).toBeTruthy();
    expect(captured[0]?.text).toBeTruthy();
    expect(captured[0]?.headers?.['X-Ref']).toBe('abc');
  });

  it('propagates middleware errors', async () => {
    const provider = mockProvider();
    const boom: MailMiddleware = () => { throw new Error('middleware boom'); };

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [boom] });

    await expect(
      mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } }),
    ).rejects.toThrow('middleware boom');
    expect(provider.calls).toHaveLength(0);
  });

  it('rewrites href links', async () => {
    const provider = mockProvider();
    const rewrite: MailMiddleware = (msg) => ({
      ...msg,
      html: msg.html.replace(
        /href="(https?:[^"]+)"/g,
        (_, url) => `href="https://track.example.com/click?url=${encodeURIComponent(url)}"`,
      ),
    });

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [rewrite] });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    const html = provider.calls[0]?.html ?? '';
    const originalHrefs = [...html.matchAll(/href="https?:[^"]+"/g)];
    for (const [match] of originalHrefs) {
      expect(match).toContain('https://track.example.com/click?url=');
    }
  });

  it('no middleware = unmodified message', async () => {
    const provider = mockProvider();
    const mailerWithout = createMailer({ provider, from: 'sender@example.com' });
    const mailerWith = createMailer({ provider, from: 'sender@example.com', middleware: [] });

    await mailerWithout.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });
    await mailerWith.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.html).toBe(provider.calls[1]?.html);
  });

  it('middleware does not run on plain-text field', async () => {
    const provider = mockProvider();
    const htmlOnly: MailMiddleware = (msg) => ({
      ...msg,
      html: msg.html + '<img src="https://track.example.com/open/1" width="1" height="1" alt="" />',
    });

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [htmlOnly] });
    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.text).not.toContain('track.example.com');
  });

  it('vi.fn middleware is called once per send', async () => {
    const provider = mockProvider();
    const mw = vi.fn<MailMiddleware>((msg) => msg);

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [mw] });

    await mailer.send(TestEmail, { to: 'a@a.com', props: { name: 'A' } });
    await mailer.send(TestEmail, { to: 'b@b.com', props: { name: 'B' } });

    expect(mw).toHaveBeenCalledTimes(2);
  });
});

describe('attachments (single send)', () => {
  it('passes attachments to provider', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.send(TestEmail, {
      to: 'user@example.com',
      props: { name: 'Alice' },
      attachments: [
        { filename: 'report.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' },
      ],
    });

    expect(provider.calls[0]?.attachments).toHaveLength(1);
    expect(provider.calls[0]?.attachments![0]!.filename).toBe('report.pdf');
  });

  it('passes multiple attachments in order', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.send(TestEmail, {
      to: 'user@example.com',
      props: { name: 'Alice' },
      attachments: [
        { filename: 'a.pdf', content: 'a', contentType: 'application/pdf' },
        { filename: 'b.png', content: 'b', contentType: 'image/png' },
      ],
    });

    const atts = provider.calls[0]?.attachments ?? [];
    expect(atts).toHaveLength(2);
    expect(atts[0]!.filename).toBe('a.pdf');
    expect(atts[1]!.filename).toBe('b.png');
  });

  it('no attachments when omitted', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(provider.calls[0]?.attachments ?? []).toHaveLength(0);
  });

  it('rejects attachment with path traversal in filename', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, {
        to: 'user@example.com',
        props: { name: 'Alice' },
        attachments: [{ filename: '../secret.pdf', content: 'x', contentType: 'application/pdf' }],
      }),
    ).rejects.toThrow(TypeError);
  });

  it('rejects attachment with disallowed content type', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, {
        to: 'user@example.com',
        props: { name: 'Alice' },
        attachments: [{ filename: 'exploit.exe', content: 'x', contentType: 'application/x-msdownload' }],
      }),
    ).rejects.toThrow(TypeError);
  });

  it('rejects inline attachment with cid containing control characters', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, {
        to: 'user@example.com',
        props: { name: 'Alice' },
        attachments: [{ filename: 'img.png', content: 'x', contentType: 'image/png', cid: 'bad\r\ncid' }],
      }),
    ).rejects.toThrow(TypeError);
  });

  it('rejects inline attachment with empty cid', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, {
        to: 'user@example.com',
        props: { name: 'Alice' },
        attachments: [{ filename: 'img.png', content: 'x', contentType: 'image/png', cid: '' }],
      }),
    ).rejects.toThrow(TypeError);
  });

  it('rejects attachment with image/svg+xml content type', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });

    await expect(
      mailer.send(TestEmail, {
        to: 'user@example.com',
        props: { name: 'Alice' },
        attachments: [{ filename: 'icon.svg', content: '<svg/>', contentType: 'image/svg+xml' }],
      }),
    ).rejects.toThrow(TypeError);
  });

  it('middleware-injected attachment with disallowed content type is rejected post-middleware', async () => {
    const provider = mockProvider();
    const badMw: MailMiddleware = (msg) => ({
      ...msg,
      attachments: [
        ...(msg.attachments ?? []),
        { filename: 'shell.sh', content: '#!/bin/bash', contentType: 'application/x-sh' },
      ],
    });

    const mailer = createMailer({ provider, from: 'sender@example.com', middleware: [badMw] });

    await expect(
      mailer.send(TestEmail, { to: 'user@example.com', props: { name: 'Alice' } }),
    ).rejects.toThrow(TypeError);
  });
});

describe('no middleware — tracking isolation', () => {
  it('html contains no tracking pixel', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });
    await mailer.send(LinkedEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    const html = provider.calls[0]?.html ?? '';
    expect(html).not.toContain('width="1" height="1"');
    expect(html).not.toContain('height="1" width="1"');
  });

  it('hrefs are not rewritten', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });
    await mailer.send(LinkedEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    const html = provider.calls[0]?.html ?? '';
    expect(html).toContain('href="https://example.com/original"');
    expect(html).not.toContain('track.example.com');
  });

  it('text contains no tracking artifacts', async () => {
    const provider = mockProvider();
    const mailer = createMailer({ provider, from: 'sender@example.com' });
    await mailer.send(LinkedEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    const text = provider.calls[0]?.text ?? '';
    expect(text).not.toContain('track.example.com');
    expect(text).not.toMatch(/width.*1.*height.*1/);
  });

  it('empty middleware array produces same result as no middleware', async () => {
    const p1 = mockProvider('p1');
    const p2 = mockProvider('p2');

    const mailerNone = createMailer({ provider: p1, from: 'sender@example.com' });
    const mailerEmpty = createMailer({ provider: p2, from: 'sender@example.com', middleware: [] });

    await mailerNone.send(LinkedEmail, { to: 'user@example.com', props: { name: 'Alice' } });
    await mailerEmpty.send(LinkedEmail, { to: 'user@example.com', props: { name: 'Alice' } });

    expect(p1.calls[0]?.html).toBe(p2.calls[0]?.html);
    expect(p1.calls[0]?.text).toBe(p2.calls[0]?.text);
  });
});
