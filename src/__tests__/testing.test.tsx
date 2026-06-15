import { describe, it, expect } from 'vitest';
import { captureEmails } from '../testing/index.js';
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
