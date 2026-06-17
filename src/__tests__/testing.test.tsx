import { describe, it, expect } from 'vitest';
import { captureEmails, expectAttachment, expectAttachmentCount, expectNoAttachments } from '../testing/index.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';

const WelcomeEmail = defineEmail<{ name: string; loginUrl: string }>({
  subject: ({ name }) => `Welcome, ${name}!`,
  component: ({ name, loginUrl }) => (
    <EmailTemplate>
      <Heading>Welcome!</Heading>
      <Text>Hi {name}, <a href={loginUrl}>log in here</a></Text>
    </EmailTemplate>
  ),
});

// ─── Attachment helpers ─────────────────────────────────────────────────────

const pdfAttachment = {
  filename: 'invoice.pdf',
  content: Buffer.from('PDF content here'),
  contentType: 'application/pdf',
};

const csvAttachment = {
  filename: 'export.csv',
  content: 'col1,col2\n1,2',
  contentType: 'text/csv',
};

describe('expectAttachment', () => {
  it('passes when attachment with matching filename exists', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { filename: 'invoice.pdf' })).not.toThrow();
  });

  it('passes when attachment with matching contentType exists', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { contentType: 'application/pdf' })).not.toThrow();
  });

  it('passes with minBytes check when Buffer large enough', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { minBytes: 5 })).not.toThrow();
  });

  it('passes with minBytes check on string content', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [csvAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { minBytes: 5 })).not.toThrow();
  });

  it('throws when no attachment matches filename', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [csvAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { filename: 'invoice.pdf' })).toThrow(
      /Expected attachment matching.*invoice\.pdf/,
    );
  });

  it('throws when no attachment matches contentType', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [csvAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { contentType: 'application/pdf' })).toThrow(
      /Expected attachment matching.*application\/pdf/,
    );
  });

  it('throws when attachment too small', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [{ filename: 'tiny.txt', content: 'hi', contentType: 'text/plain' }],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { minBytes: 1000 })).toThrow(/Expected attachment matching/);
  });

  it('error message includes what was found', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [csvAttachment],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { filename: 'invoice.pdf' })).toThrow(/export\.csv/);
  });

  it('throws with "none" when no attachments', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [],
      headers: {},
    });
    expect(() => expectAttachment(inbox[0]!, { filename: 'invoice.pdf' })).toThrow(/none/);
  });
});

describe('expectAttachmentCount', () => {
  it('passes when count matches', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment, csvAttachment],
      headers: {},
    });
    expect(() => expectAttachmentCount(inbox[0]!, 2)).not.toThrow();
  });

  it('throws when count does not match', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment],
      headers: {},
    });
    expect(() => expectAttachmentCount(inbox[0]!, 2)).toThrow('Expected 2 attachment(s) but found 1');
  });
});

describe('expectNoAttachments', () => {
  it('passes when inbox has no attachments', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [],
      headers: {},
    });
    expect(() => expectNoAttachments(inbox[0]!)).not.toThrow();
  });

  it('throws when attachments present', () => {
    const { inbox } = captureEmails();
    inbox.push({
      from: { email: 'test@example.com' },
      to: [{ email: 'user@example.com' }],
      subject: 'Test',
      html: '<p>hi</p>',
      text: 'hi',
      attachments: [pdfAttachment],
      headers: {},
    });
    expect(() => expectNoAttachments(inbox[0]!)).toThrow('Expected 0 attachment(s) but found 1');
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe('captureEmails', () => {
  it('captures sent emails in inbox', async () => {
    const { mailer, inbox } = captureEmails();

    await mailer.send(WelcomeEmail, {
      to: 'user@example.com',
      props: { name: 'Alice', loginUrl: 'https://app.com/login' },
    });

    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.subject).toBe('Welcome, Alice!');
    expect(inbox[0]?.to[0]?.email).toBe('user@example.com');
    expect(inbox[0]?.html).toContain('Alice');
  });

  it('clears inbox', async () => {
    const { mailer, inbox, clear } = captureEmails();

    await mailer.send(WelcomeEmail, {
      to: 'user@example.com',
      props: { name: 'Bob', loginUrl: 'https://app.com' },
    });

    expect(inbox).toHaveLength(1);
    clear();
    expect(inbox).toHaveLength(0);
  });

  it('captures multiple emails', async () => {
    const { mailer, inbox } = captureEmails();

    await mailer.send(WelcomeEmail, {
      to: 'a@example.com',
      props: { name: 'A', loginUrl: 'https://app.com' },
    });
    await mailer.send(WelcomeEmail, {
      to: 'b@example.com',
      props: { name: 'B', loginUrl: 'https://app.com' },
    });

    expect(inbox).toHaveLength(2);
    expect(inbox[1]?.subject).toBe('Welcome, B!');
  });
});
