import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const BASE_ENV = {
  TIERDE_FROM_EMAIL: 'sender@example.com',
  TIERDE_FROM_NAME: undefined as string | undefined,
};

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

const PROVIDER_ENV_KEYS = [
  'TIERDE_PROVIDER', 'TIERDE_FROM_EMAIL', 'TIERDE_FROM_NAME',
  'RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE',
  'SES_REGION', 'AWS_REGION', 'SENDGRID_API_KEY', 'POSTMARK_SERVER_TOKEN',
  'MAILPIT_HOST', 'MAILPIT_PORT',
];

let savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  savedEnv = {};
  for (const k of PROVIDER_ENV_KEYS) savedEnv[k] = process.env[k];
  setEnv(Object.fromEntries(PROVIDER_ENV_KEYS.map((k) => [k, undefined])));
});

afterEach(() => {
  setEnv(savedEnv);
});

async function make(vars: Record<string, string>) {
  setEnv(vars);
  // Re-import fresh each test since createEnv reads process.env at call time
  const { createMailerFromEnv } = await import('../env-mailer.js');
  return createMailerFromEnv();
}

describe('createMailerFromEnv', () => {
  it('creates resend mailer', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'resend',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      RESEND_API_KEY: 're_test_key',
    });
    expect(mailer).toBeDefined();
  });

  it('throws when RESEND_API_KEY missing', async () => {
    setEnv({ TIERDE_PROVIDER: 'resend', TIERDE_FROM_EMAIL: 'sender@example.com' });
    const { createMailerFromEnv } = await import('../env-mailer.js');
    expect(() => createMailerFromEnv()).toThrow('RESEND_API_KEY');
  });

  it('creates smtp mailer with auth', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'smtp',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
    });
    expect(mailer).toBeDefined();
  });

  it('creates smtp mailer without auth', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'smtp',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      SMTP_HOST: 'smtp.example.com',
    });
    expect(mailer).toBeDefined();
  });

  it('throws when SMTP_HOST missing', async () => {
    setEnv({ TIERDE_PROVIDER: 'smtp', TIERDE_FROM_EMAIL: 'sender@example.com' });
    const { createMailerFromEnv } = await import('../env-mailer.js');
    expect(() => createMailerFromEnv()).toThrow('SMTP_HOST');
  });

  it('creates ses mailer with SES_REGION', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'ses',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      SES_REGION: 'us-east-1',
    });
    expect(mailer).toBeDefined();
  });

  it('creates ses mailer with AWS_REGION fallback', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'ses',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      AWS_REGION: 'eu-west-1',
    });
    expect(mailer).toBeDefined();
  });

  it('throws when no region for ses', async () => {
    setEnv({ TIERDE_PROVIDER: 'ses', TIERDE_FROM_EMAIL: 'sender@example.com' });
    const { createMailerFromEnv } = await import('../env-mailer.js');
    expect(() => createMailerFromEnv()).toThrow('SES_REGION');
  });

  it('creates sendgrid mailer', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'sendgrid',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      SENDGRID_API_KEY: 'SG.test',
    });
    expect(mailer).toBeDefined();
  });

  it('throws when SENDGRID_API_KEY missing', async () => {
    setEnv({ TIERDE_PROVIDER: 'sendgrid', TIERDE_FROM_EMAIL: 'sender@example.com' });
    const { createMailerFromEnv } = await import('../env-mailer.js');
    expect(() => createMailerFromEnv()).toThrow('SENDGRID_API_KEY');
  });

  it('creates postmark mailer', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'postmark',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      POSTMARK_SERVER_TOKEN: 'pm-tok',
    });
    expect(mailer).toBeDefined();
  });

  it('throws when POSTMARK_SERVER_TOKEN missing', async () => {
    setEnv({ TIERDE_PROVIDER: 'postmark', TIERDE_FROM_EMAIL: 'sender@example.com' });
    const { createMailerFromEnv } = await import('../env-mailer.js');
    expect(() => createMailerFromEnv()).toThrow('POSTMARK_SERVER_TOKEN');
  });

  it('creates mailpit mailer with defaults', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'mailpit',
      TIERDE_FROM_EMAIL: 'sender@example.com',
    });
    expect(mailer).toBeDefined();
  });

  it('creates mailpit mailer with custom host/port', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'mailpit',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      MAILPIT_HOST: 'mailpit.local',
      MAILPIT_PORT: '1026',
    });
    expect(mailer).toBeDefined();
  });

  it('builds from address with display name', async () => {
    const mailer = await make({
      TIERDE_PROVIDER: 'mailpit',
      TIERDE_FROM_EMAIL: 'sender@example.com',
      TIERDE_FROM_NAME: 'My App',
    });
    // mailer is created — from name wired through (no public API to inspect from, just verify no throw)
    expect(mailer).toBeDefined();
  });
});
