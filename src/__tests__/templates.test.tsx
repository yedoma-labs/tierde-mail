import { describe, it, expect } from 'vitest';
import { renderEmail } from '../render.js';
import { Welcome } from '../templates/Welcome.js';
import { PasswordReset } from '../templates/PasswordReset.js';
import { EmailVerification } from '../templates/EmailVerification.js';
import { TwoFactorAuth } from '../templates/TwoFactorAuth.js';
import { Invoice } from '../templates/Invoice.js';
import { MagicLink } from '../templates/MagicLink.js';

describe('built-in templates', () => {
  it('Welcome renders with required props', () => {
    const subject = Welcome.subject({ name: 'Alice', loginUrl: 'https://app.com' });
    expect(subject).toContain('Alice');

    const html = renderEmail(Welcome.component({ name: 'Alice', loginUrl: 'https://app.com' }));
    expect(html).toContain('Alice');
    expect(html).toContain('https://app.com');
  });

  it('PasswordReset renders reset URL', () => {
    const html = renderEmail(
      PasswordReset.component({
        username: 'alice',
        resetUrl: 'https://app.com/reset?token=abc',
      }),
    );
    expect(html).toContain('https://app.com/reset?token=abc');
    expect(html).toContain('alice');
  });

  it('EmailVerification renders verify URL', () => {
    const html = renderEmail(
      EmailVerification.component({
        name: 'Alice',
        verifyUrl: 'https://app.com/verify?token=xyz',
      }),
    );
    expect(html).toContain('https://app.com/verify?token=xyz');
  });

  it('TwoFactorAuth renders code', () => {
    const html = renderEmail(
      TwoFactorAuth.component({ username: 'alice', code: '123456' }),
    );
    expect(html).toContain('123456');
  });

  it('Invoice renders line items and total', () => {
    const html = renderEmail(
      Invoice.component({
        customerName: 'ACME Corp',
        invoiceNumber: 'INV-001',
        items: [
          { name: 'Pro Plan', price: 99.99 },
          { name: 'Support', price: 29.99, quantity: 2 },
        ],
      }),
    );
    expect(html).toContain('Pro Plan');
    expect(html).toContain('INV-001');
    expect(html).toContain('ACME Corp');
  });

  it('MagicLink renders login URL', () => {
    const html = renderEmail(
      MagicLink.component({
        email: 'user@example.com',
        loginUrl: 'https://app.com/auth?token=magic',
      }),
    );
    expect(html).toContain('https://app.com/auth?token=magic');
  });
});
