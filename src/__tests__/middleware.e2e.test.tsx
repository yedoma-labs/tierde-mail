/**
 * Middleware e2e tests — send through Mailpit, verify HTML via Mailpit REST API.
 *
 * Requires a running Mailpit instance. Skipped unless TIERDE_TEST_MAILPIT=true.
 *
 *   docker compose up -d
 *   TIERDE_TEST_MAILPIT=true pnpm vitest run src/__tests__/middleware.e2e.test.ts
 */

import { randomUUID } from 'node:crypto';
import * as http from 'node:http';
import { describe, expect, it } from 'vitest';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { embedImages } from '../embed-images.js';
import { createMailer } from '../mailer.js';
import { mailpit } from '../providers/mailpit.js';
import type { MailMiddleware } from '../types.js';

interface MailpitMessage {
  ID: string;
  Subject: string;
  HTML: string;
  Attachments?: Array<{ FileName: string; ContentType: string; Size: number }>;
  Inline?: Array<{ FileName: string; ContentType: string; Size: number }>;
}

// Minimal 1×1 transparent PNG — used by CID inline and embedImages tests.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const MAILPIT_API = 'http://localhost:8025/api/v1';

const TrackingEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Middleware e2e — ${name}`,
  component: ({ name }) => (
    <EmailTemplate>
      <Text>{name}</Text>
      <Button href="https://example.com/cta">Click me</Button>
    </EmailTemplate>
  ),
});

async function findMailpitMessage(subjectFragment: string): Promise<MailpitMessage> {
  const res = await fetch(`${MAILPIT_API}/messages`);
  if (!res.ok) throw new Error(`Mailpit /messages returned ${res.status}`);
  const list = (await res.json()) as { messages?: MailpitMessage[] };

  const match = list.messages?.find((m) => m.Subject.includes(subjectFragment));
  if (!match) throw new Error(`No Mailpit message with subject containing "${subjectFragment}"`);
  return match;
}

async function getLatestMailpitMessage(subjectFragment: string): Promise<string> {
  const msg = await getMailpitMessageMeta(subjectFragment);
  return msg.HTML;
}

async function getMailpitMessageMeta(subjectFragment: string): Promise<MailpitMessage> {
  const match = await findMailpitMessage(subjectFragment);
  const res = await fetch(`${MAILPIT_API}/message/${match.ID}`);
  if (!res.ok) throw new Error(`Mailpit message/${match.ID} returned ${res.status}`);
  return res.json() as Promise<MailpitMessage>;
}

describe.skipIf(!process.env.TIERDE_TEST_MAILPIT)('middleware e2e (Mailpit)', () => {
  it('pixel middleware injects tracking image into delivered HTML', async () => {
    const trackingId = randomUUID();
    const pixelUrl = `https://track.example.com/open/${trackingId}`;

    const pixel: MailMiddleware = (msg) => ({
      ...msg,
      html: `${msg.html}<img src="${pixelUrl}" width="1" height="1" alt="" />`,
    });

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
      middleware: [pixel],
    });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `pixel-${trackingId.slice(0, 8)}` },
    });

    const html = await getLatestMailpitMessage(`pixel-${trackingId.slice(0, 8)}`);
    expect(html).toContain(pixelUrl);
  });

  it('link rewrite middleware rewrites hrefs in delivered HTML', async () => {
    const trackingId = randomUUID();
    const trackBase = 'https://track.example.com/click';

    const rewrite: MailMiddleware = (msg) => ({
      ...msg,
      html: msg.html.replace(
        /href="(https?:[^"]+)"/g,
        (_, url) => `href="${trackBase}?url=${encodeURIComponent(url)}"`,
      ),
    });

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
      middleware: [rewrite],
    });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `click-${trackingId.slice(0, 8)}` },
    });

    const html = await getLatestMailpitMessage(`click-${trackingId.slice(0, 8)}`);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(([, url]) => url);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/track\.example\.com\/click\?url=/);
    }
  });

  it('no middleware — delivered HTML contains no tracking pixel and no rewritten hrefs', async () => {
    const trackingId = randomUUID();

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
    });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `clean-${trackingId.slice(0, 8)}` },
    });

    const html = await getLatestMailpitMessage(`clean-${trackingId.slice(0, 8)}`);
    expect(html).not.toContain('width="1" height="1"');
    expect(html).not.toContain('height="1" width="1"');
    expect(html).not.toContain('track.example.com');
    expect(html).toContain('href="https://example.com/cta"');
  });

  it('pixel + link rewrite compose correctly in delivered HTML', async () => {
    const trackingId = randomUUID();
    const pixelUrl = `https://track.example.com/open/${trackingId}`;
    const trackBase = 'https://track.example.com/click';

    const pixel: MailMiddleware = (msg) => ({
      ...msg,
      html: `${msg.html}<img src="${pixelUrl}" width="1" height="1" alt="" />`,
    });

    const rewrite: MailMiddleware = (msg) => ({
      ...msg,
      html: msg.html.replace(
        /href="(https?:[^"]+)"/g,
        (_, url) => `href="${trackBase}?url=${encodeURIComponent(url)}"`,
      ),
    });

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
      middleware: [pixel, rewrite],
    });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `compose-${trackingId.slice(0, 8)}` },
    });

    const html = await getLatestMailpitMessage(`compose-${trackingId.slice(0, 8)}`);
    expect(html).toContain(pixelUrl);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(([, url]) => url);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/track\.example\.com\/click\?url=/);
    }
  });

  it('attachment is delivered and visible via Mailpit API', async () => {
    const trackingId = randomUUID();
    const mailer = createMailer({ provider: mailpit(), from: 'test@localhost' });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `attach-${trackingId.slice(0, 8)}` },
      attachments: [
        {
          filename: 'report.pdf',
          content: Buffer.from('%PDF-1.4 fake pdf content'),
          contentType: 'application/pdf',
        },
      ],
    });

    const meta = await getMailpitMessageMeta(`attach-${trackingId.slice(0, 8)}`);
    expect(meta.Attachments).toBeDefined();
    expect(meta.Attachments!.length).toBe(1);
    expect(meta.Attachments![0]!.FileName).toBe('report.pdf');
    expect(meta.Attachments![0]!.ContentType).toBe('application/pdf');
    expect(meta.Attachments![0]!.Size).toBeGreaterThan(0);
  });

  it('multiple attachments all delivered', async () => {
    const trackingId = randomUUID();
    const mailer = createMailer({ provider: mailpit(), from: 'test@localhost' });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `multi-attach-${trackingId.slice(0, 8)}` },
      attachments: [
        { filename: 'a.pdf', content: Buffer.from('pdf-a'), contentType: 'application/pdf' },
        { filename: 'b.png', content: Buffer.from('png-b'), contentType: 'image/png' },
      ],
    });

    const meta = await getMailpitMessageMeta(`multi-attach-${trackingId.slice(0, 8)}`);
    expect(meta.Attachments).toHaveLength(2);
    const names = meta.Attachments!.map((a) => a.FileName);
    expect(names).toContain('a.pdf');
    expect(names).toContain('b.png');
  });

  it('no attachments on clean send', async () => {
    const trackingId = randomUUID();
    const mailer = createMailer({ provider: mailpit(), from: 'test@localhost' });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `no-attach-${trackingId.slice(0, 8)}` },
    });

    const meta = await getMailpitMessageMeta(`no-attach-${trackingId.slice(0, 8)}`);
    expect(meta.Attachments ?? []).toHaveLength(0);
  });

  it('embedImages rewrites src to cid and delivers image as inline attachment', async () => {
    // Serve TINY_PNG from a local server — no external network dependency.
    const server = http.createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(TINY_PNG);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as { port: number };
    const imageUrl = `http://127.0.0.1:${port}/banner.png`;
    const trackingId = randomUUID();

    // Inject the <img> via a pre-middleware so we own exactly what's in the HTML —
    // relying on JSX rendering inside EmailTemplate for a raw <img> is fragile.
    const injectImg: MailMiddleware = (msg) => ({
      ...msg,
      html: `${msg.html}<img src="${imageUrl}" alt="">`,
    });

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
      middleware: [injectImg, embedImages([imageUrl])],
    });

    try {
      await mailer.send(TrackingEmail, {
        to: 'inbox@localhost',
        props: { name: `embed-img-${trackingId.slice(0, 8)}` },
      });
    } finally {
      server.close();
    }

    const msg = await getMailpitMessageMeta(`embed-img-${trackingId.slice(0, 8)}`);
    // src must be rewritten from the remote URL to the CID reference.
    expect(msg.HTML).not.toContain(imageUrl);
    expect(msg.HTML).toContain('cid:banner.png');
    // Mailpit may expose CID parts in Inline or Attachments depending on version.
    const inlineCount =
      (msg.Inline ?? []).length +
      (msg.Attachments ?? []).filter((a) => a.FileName === 'banner.png').length;
    expect(inlineCount).toBeGreaterThan(0);
  });

  it('manual CID inline attachment is delivered inline and HTML retains cid reference', async () => {
    const trackingId = randomUUID();
    const cid = `logo@${trackingId}`;

    // Inject <img src="cid:..."> via middleware — avoids JSX rendering ambiguity
    // for cid: scheme URLs (same reason as the embedImages test above).
    const injectCidImg: MailMiddleware = (msg) => ({
      ...msg,
      html: `${msg.html}<img src="cid:${cid}" alt="">`,
    });

    const mailer = createMailer({
      provider: mailpit(),
      from: 'test@localhost',
      middleware: [injectCidImg],
    });

    await mailer.send(TrackingEmail, {
      to: 'inbox@localhost',
      props: { name: `cid-inline-${trackingId.slice(0, 8)}` },
      attachments: [{ filename: 'logo.png', content: TINY_PNG, contentType: 'image/png', cid }],
    });

    const msg = await getMailpitMessageMeta(`cid-inline-${trackingId.slice(0, 8)}`);
    // HTML must retain the cid: src so the client can resolve it.
    expect(msg.HTML).toContain(`cid:${cid}`);
    // Mailpit may place CID parts in Inline or Attachments depending on version.
    const allParts = [...(msg.Inline ?? []), ...(msg.Attachments ?? [])];
    const logoPart = allParts.find((a) => a.FileName === 'logo.png');
    expect(logoPart).toBeDefined();
    expect(logoPart!.ContentType).toBe('image/png');
  });
});
