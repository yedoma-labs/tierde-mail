import { createHmac, createSign, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createPostmarkWebhookHandler,
  createResendWebhookHandler,
  createSendGridWebhookHandler,
  WebhookVerificationError,
} from '../webhooks/index.js';

// ---------------------------------------------------------------------------
// Resend helpers
// ---------------------------------------------------------------------------
const RESEND_SECRET = 'whsec_dGVzdHNlY3JldGtleWZvcnRlc3Rpbmc='; // whsec_ + base64("testsecretkeyfortesting")

function resendHeaders(body: string, msgId = 'msg_test_1', timestamp?: string) {
  const ts = timestamp ?? String(Math.floor(Date.now() / 1000));
  const raw = RESEND_SECRET.slice('whsec_'.length);
  const key = Buffer.from(raw, 'base64');
  const sig = createHmac('sha256', key).update(`${msgId}.${ts}.${body}`).digest('base64');
  return {
    'svix-id': msgId,
    'svix-timestamp': ts,
    'svix-signature': `v1,${sig}`,
  };
}

const resendDeliveryPayload = JSON.stringify({
  type: 'email.delivered',
  data: {
    email_id: 'em_abc123',
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Hello',
    created_at: '2026-06-16T12:00:00Z',
  },
});

// ---------------------------------------------------------------------------
// Postmark helpers
// ---------------------------------------------------------------------------
const POSTMARK_TOKEN = 'postmark-test-token-1234';

function postmarkHeaders(body: string) {
  const sig = createHmac('sha256', POSTMARK_TOKEN).update(body).digest('base64');
  return { 'X-Postmark-Signature-256': sig };
}

const postmarkDeliveryPayload = JSON.stringify({
  RecordType: 'Delivery',
  MessageID: 'pm_msg_789',
  Recipient: 'user@example.com',
  DeliveredAt: '2026-06-16T12:00:00Z',
  Metadata: { From: 'from@example.com', Subject: 'Delivered!' },
});

const postmarkBouncePayload = JSON.stringify({
  RecordType: 'Bounce',
  MessageID: 'pm_bounce_1',
  Recipient: 'bad@example.com',
  BouncedAt: '2026-06-16T12:01:00Z',
});

const postmarkSpamPayload = JSON.stringify({
  RecordType: 'SpamComplaint',
  MessageID: 'pm_spam_1',
  Recipient: 'spam@example.com',
  ReceivedAt: '2026-06-16T12:02:00Z',
});

// ---------------------------------------------------------------------------
// Resend tests
// ---------------------------------------------------------------------------
describe('createResendWebhookHandler', () => {
  it('verifies valid signature and returns WebhookEvent', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET });
    const event = handler.verify(resendDeliveryPayload, resendHeaders(resendDeliveryPayload));

    expect(event.provider).toBe('resend');
    expect(event.type).toBe('email.delivered');
    expect(event.email.id).toBe('em_abc123');
    expect(event.email.from).toBe('sender@example.com');
    expect(event.email.to).toEqual(['recipient@example.com']);
    expect(event.email.subject).toBe('Hello');
    expect(event.email.timestamp).toBe('2026-06-16T12:00:00Z');
  });

  it('exposes raw payload', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET });
    const event = handler.verify(resendDeliveryPayload, resendHeaders(resendDeliveryPayload));
    expect((event.raw as Record<string, unknown>).type).toBe('email.delivered');
  });

  it('throws WebhookVerificationError on invalid signature', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET });
    const headers = { ...resendHeaders(resendDeliveryPayload), 'svix-signature': 'v1,badsig' };
    expect(() => handler.verify(resendDeliveryPayload, headers)).toThrow(WebhookVerificationError);
  });

  it('throws on missing headers', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET });
    expect(() => handler.verify(resendDeliveryPayload, {})).toThrow(WebhookVerificationError);
  });

  it('throws on expired timestamp', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET, toleranceSeconds: 60 });
    const oldTs = String(Math.floor(Date.now() / 1000) - 120);
    const headers = resendHeaders(resendDeliveryPayload, 'msg_old', oldTs);
    expect(() => handler.verify(resendDeliveryPayload, headers)).toThrow(WebhookVerificationError);
  });

  it('accepts signature in Buffer form', () => {
    const handler = createResendWebhookHandler({ secret: RESEND_SECRET });
    const buf = Buffer.from(resendDeliveryPayload);
    const event = handler.verify(buf, resendHeaders(resendDeliveryPayload));
    expect(event.type).toBe('email.delivered');
  });

  it('accepts secret without whsec_ prefix', () => {
    const rawSecret = RESEND_SECRET.slice('whsec_'.length);
    const handler = createResendWebhookHandler({ secret: rawSecret });
    const event = handler.verify(resendDeliveryPayload, resendHeaders(resendDeliveryPayload));
    expect(event.provider).toBe('resend');
  });
});

// ---------------------------------------------------------------------------
// Postmark tests
// ---------------------------------------------------------------------------
describe('createPostmarkWebhookHandler', () => {
  it('verifies valid signature and returns WebhookEvent for Delivery', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    const event = handler.verify(postmarkDeliveryPayload, postmarkHeaders(postmarkDeliveryPayload));

    expect(event.provider).toBe('postmark');
    expect(event.type).toBe('email.delivered');
    expect(event.email.id).toBe('pm_msg_789');
    expect(event.email.to).toEqual(['user@example.com']);
    expect(event.email.from).toBe('from@example.com');
    expect(event.email.subject).toBe('Delivered!');
    expect(event.email.timestamp).toBe('2026-06-16T12:00:00Z');
  });

  it('normalizes Bounce record type', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    const event = handler.verify(postmarkBouncePayload, postmarkHeaders(postmarkBouncePayload));
    expect(event.type).toBe('email.bounced');
    expect(event.email.timestamp).toBe('2026-06-16T12:01:00Z');
  });

  it('normalizes SpamComplaint record type', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    const event = handler.verify(postmarkSpamPayload, postmarkHeaders(postmarkSpamPayload));
    expect(event.type).toBe('email.complained');
  });

  it('throws WebhookVerificationError on invalid signature', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    const headers = { 'X-Postmark-Signature-256': 'invalidsig==' };
    expect(() => handler.verify(postmarkDeliveryPayload, headers)).toThrow(
      WebhookVerificationError,
    );
  });

  it('throws on missing header', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    expect(() => handler.verify(postmarkDeliveryPayload, {})).toThrow(WebhookVerificationError);
  });

  it('exposes raw payload', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    const event = handler.verify(postmarkDeliveryPayload, postmarkHeaders(postmarkDeliveryPayload));
    expect((event.raw as Record<string, unknown>).RecordType).toBe('Delivery');
  });

  it('WebhookVerificationError has correct name', () => {
    const handler = createPostmarkWebhookHandler({ token: POSTMARK_TOKEN });
    try {
      handler.verify(postmarkDeliveryPayload, {});
    } catch (e) {
      expect((e as Error).name).toBe('WebhookVerificationError');
    }
  });
});

// ---------------------------------------------------------------------------
// SendGrid helpers
// ---------------------------------------------------------------------------
const { privateKey: sgPrivateKey, publicKey: sgPublicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});
const SENDGRID_PUBLIC_KEY = sgPublicKey.export({ type: 'spki', format: 'der' }).toString('base64');

function sgSign(body: string, ts: string): string {
  const sign = createSign('SHA256');
  sign.update(ts);
  sign.update(body);
  return sign.sign(sgPrivateKey, 'base64');
}

function sgHeaders(body: string, timestamp?: string) {
  const ts = timestamp ?? String(Math.floor(Date.now() / 1000));
  return {
    'X-Twilio-Email-Event-Webhook-Timestamp': ts,
    'X-Twilio-Email-Event-Webhook-Signature': sgSign(body, ts),
  };
}

const sgDeliveryPayload = JSON.stringify([
  {
    event: 'delivered',
    email: 'recipient@example.com',
    sg_message_id: 'sg.abc.def',
    subject: 'Hello',
    timestamp: 1718539200,
  },
]);

const sgBouncePayload = JSON.stringify([
  {
    event: 'bounce',
    email: 'bad@example.com',
    sg_message_id: 'sg.bounce.1',
    timestamp: 1718539200,
  },
  {
    event: 'spamreport',
    email: 'spam@example.com',
    sg_message_id: 'sg.spam.1',
    timestamp: 1718539201,
  },
]);

// ---------------------------------------------------------------------------
// SendGrid tests
// ---------------------------------------------------------------------------
describe('createSendGridWebhookHandler', () => {
  it('verifies valid ECDSA signature and returns first event', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    const event = handler.verify(sgDeliveryPayload, sgHeaders(sgDeliveryPayload));

    expect(event.provider).toBe('sendgrid');
    expect(event.type).toBe('email.delivered');
    expect(event.email.to).toEqual(['recipient@example.com']);
    expect(event.email.id).toBe('sg.abc.def');
    expect(event.email.subject).toBe('Hello');
    expect(event.email.timestamp).toBe('2024-06-16T12:00:00.000Z');
  });

  it('verifyBatch returns all events', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    const events = handler.verifyBatch(sgBouncePayload, sgHeaders(sgBouncePayload));

    expect(events).toHaveLength(2);
    expect(events[0]?.type).toBe('email.bounced');
    expect(events[1]?.type).toBe('email.complained');
  });

  it('maps all known event types', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });

    const typeMap: Record<string, string> = {
      delivered: 'email.delivered',
      bounce: 'email.bounced',
      dropped: 'email.bounced',
      deferred: 'email.delivery_delayed',
      spamreport: 'email.complained',
      unsubscribe: 'email.subscription_changed',
      open: 'email.opened',
      click: 'email.clicked',
    };

    for (const [sgEvent, expectedType] of Object.entries(typeMap)) {
      const body = JSON.stringify([{ event: sgEvent, email: 'u@e.com', timestamp: 1718539200 }]);
      const events = handler.verifyBatch(body, sgHeaders(body));
      expect(events[0]?.type).toBe(expectedType);
    }
  });

  it('accepts Buffer body', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    const buf = Buffer.from(sgDeliveryPayload);
    const event = handler.verify(buf, sgHeaders(sgDeliveryPayload));
    expect(event.provider).toBe('sendgrid');
  });

  it('accepts PEM public key directly', () => {
    const pem = sgPublicKey.export({ type: 'spki', format: 'pem' }) as string;
    const handler = createSendGridWebhookHandler({ publicKey: pem });
    const event = handler.verify(sgDeliveryPayload, sgHeaders(sgDeliveryPayload));
    expect(event.type).toBe('email.delivered');
  });

  it('throws WebhookVerificationError on invalid signature', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    const headers = {
      ...sgHeaders(sgDeliveryPayload),
      'X-Twilio-Email-Event-Webhook-Signature': 'invalidsig==',
    };
    expect(() => handler.verify(sgDeliveryPayload, headers)).toThrow(WebhookVerificationError);
  });

  it('throws on missing headers', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    expect(() => handler.verify(sgDeliveryPayload, {})).toThrow(WebhookVerificationError);
  });

  it('throws on expired timestamp', () => {
    const handler = createSendGridWebhookHandler({
      publicKey: SENDGRID_PUBLIC_KEY,
      toleranceSeconds: 60,
    });
    const oldTs = String(Math.floor(Date.now() / 1000) - 120);
    const headers = sgHeaders(sgDeliveryPayload, oldTs);
    expect(() => handler.verify(sgDeliveryPayload, headers)).toThrow(WebhookVerificationError);
  });

  it('exposes raw payload', () => {
    const handler = createSendGridWebhookHandler({ publicKey: SENDGRID_PUBLIC_KEY });
    const event = handler.verify(sgDeliveryPayload, sgHeaders(sgDeliveryPayload));
    expect((event.raw as Record<string, unknown>).event).toBe('delivered');
  });
});
