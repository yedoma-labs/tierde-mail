import { describe, expect, it } from 'vitest';
import { renderEmail } from '../render.js';
import { Invoice } from '../templates/Invoice.js';
import { PasswordReset } from '../templates/PasswordReset.js';
import { WELCOME_STRINGS, Welcome } from '../templates/Welcome.js';
import { resolveSubject } from '../types.js';

describe('template i18n — string overrides', () => {
  it('Welcome uses English defaults with no strings prop', () => {
    const subject = resolveSubject(Welcome.subject, { name: 'Alice', loginUrl: 'https://app.com' });
    expect(subject).toBe('Welcome to Our App, Alice!');
  });

  it('Welcome overrides subject and heading', () => {
    const subject = resolveSubject(Welcome.subject, {
      name: 'Alice',
      loginUrl: 'https://app.com',
      strings: {
        subject: (name: string, appName: string) => `Bienvenue sur ${appName}, ${name} !`,
        heading: (name: string) => `Bonjour ${name} !`,
      },
    });
    expect(subject).toBe('Bienvenue sur Our App, Alice !');

    const html = renderEmail(
      Welcome.component({
        name: 'Alice',
        loginUrl: 'https://app.com',
        strings: {
          heading: (name: string) => `Bonjour ${name} !`,
          ctaLabel: 'Commencer',
        },
      }),
    );
    expect(html).toContain('Bonjour Alice !');
    expect(html).toContain('Commencer');
  });

  it('Welcome passes lang and dir to html element', () => {
    const html = renderEmail(
      Welcome.component({
        name: 'أحمد',
        loginUrl: 'https://app.com',
        locale: 'ar',
        dir: 'rtl',
      }),
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });

  it('PasswordReset overrides all strings', () => {
    const html = renderEmail(
      PasswordReset.component({
        username: 'alice',
        resetUrl: 'https://app.com/reset',
        strings: {
          heading: 'Passwort zurücksetzen',
          greeting: (u: string) => `Hallo ${u},`,
          ctaLabel: 'Passwort zurücksetzen',
          securityNote:
            'Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.',
        },
      }),
    );
    expect(html).toContain('Passwort zurücksetzen');
    expect(html).toContain('Hallo alice,');
    expect(html).toContain('Falls Sie');
  });

  it('Invoice uses locale for currency formatting', () => {
    const html = renderEmail(
      Invoice.component({
        customerName: 'ACME Corp',
        invoiceNumber: 'INV-001',
        items: [{ name: 'Pro Plan', price: 99.99 }],
        currency: 'EUR',
        locale: 'de-DE',
      }),
    );
    // de-DE formats EUR with comma decimal separator
    expect(html).toContain('99');
  });

  it('Invoice overrides column headers', () => {
    const html = renderEmail(
      Invoice.component({
        customerName: 'ACME',
        invoiceNumber: 'INV-002',
        items: [{ name: 'Plan', price: 10 }],
        strings: {
          colItem: 'Artikel',
          colQty: 'Menge',
          colPrice: 'Preis',
          colTotal: 'Gesamt',
          totalLabel: 'Gesamt',
        },
      }),
    );
    expect(html).toContain('Artikel');
    expect(html).toContain('Menge');
  });

  it('WELCOME_STRINGS default object is exported and correct', () => {
    expect(WELCOME_STRINGS.ctaLabel).toBe('Get Started');
    expect(WELCOME_STRINGS.subject('Alice', 'MyApp')).toBe('Welcome to MyApp, Alice!');
  });
});

describe('EmailTemplate dir/lang props', () => {
  it('defaults to ltr and en', () => {
    const html = renderEmail(Welcome.component({ name: 'X', loginUrl: 'https://x.com' }));
    expect(html).toContain('lang="en"');
    expect(html).toContain('dir="ltr"');
  });
});
