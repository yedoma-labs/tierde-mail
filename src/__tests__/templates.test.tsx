import { describe, it, expect } from 'vitest';
import { renderEmail } from '../render.js';
import { Welcome } from '../templates/Welcome.js';
import { PasswordReset } from '../templates/PasswordReset.js';
import { EmailVerification } from '../templates/EmailVerification.js';
import { TwoFactorAuth } from '../templates/TwoFactorAuth.js';
import { Invoice } from '../templates/Invoice.js';
import { MagicLink } from '../templates/MagicLink.js';
import { OrderConfirmation } from '../templates/OrderConfirmation.js';
import { ShippingUpdate } from '../templates/ShippingUpdate.js';
import { SecurityAlert } from '../templates/SecurityAlert.js';
import { AccountLocked } from '../templates/AccountLocked.js';
import { AccountUnlocked } from '../templates/AccountUnlocked.js';
import { RegistrationConfirmation } from '../templates/RegistrationConfirmation.js';
import { EmailChangeVerification } from '../templates/EmailChangeVerification.js';
import { PhoneVerification } from '../templates/PhoneVerification.js';
import { ProfileUpdated } from '../templates/ProfileUpdated.js';
import { PasswordChangedConfirmation } from '../templates/PasswordChangedConfirmation.js';
import { LoginActivity } from '../templates/LoginActivity.js';
import { DataExportRequest } from '../templates/DataExportRequest.js';
import { AccountDeletionConfirmation } from '../templates/AccountDeletionConfirmation.js';
import { NewsletterConfirmation } from '../templates/NewsletterConfirmation.js';
import { PaymentFailed } from '../templates/PaymentFailed.js';
import { PasswordlessOtp } from '../templates/PasswordlessOtp.js';
import { TeamInvite } from '../templates/TeamInvite.js';
import { RefundConfirmation } from '../templates/RefundConfirmation.js';

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

  it('OrderConfirmation renders order number and items', () => {
    const html = renderEmail(
      OrderConfirmation.component({
        name: 'Alice',
        orderNumber: 'ORD-42',
        orderUrl: 'https://app.com/orders/42',
        items: [{ name: 'Widget', quantity: 2, price: 9.99 }],
      }),
    );
    expect(html).toContain('ORD-42');
    expect(html).toContain('Widget');
    expect(html).toContain('Alice');
  });

  it('ShippingUpdate renders tracking URL', () => {
    const html = renderEmail(
      ShippingUpdate.component({
        name: 'Bob',
        orderNumber: 'ORD-99',
        status: 'shipped',
        trackingUrl: 'https://track.example.com/TRK123',
      }),
    );
    expect(html).toContain('https://track.example.com/TRK123');
    expect(html).toContain('ORD-99');
  });

  it('PasswordlessOtp renders the code', () => {
    const html = renderEmail(
      PasswordlessOtp.component({ code: '847 293' }),
    );
    expect(html).toContain('847 293');
  });

  it('TeamInvite renders team name and invite URL', () => {
    const html = renderEmail(
      TeamInvite.component({
        inviterName: 'Bob',
        teamName: 'Acme Engineering',
        inviteUrl: 'https://app.com/invite/xyz',
      }),
    );
    expect(html).toContain('Acme Engineering');
    expect(html).toContain('https://app.com/invite/xyz');
    expect(html).toContain('Bob');
  });

  it('PaymentFailed renders amount and reason in alert box', () => {
    const html = renderEmail(
      PaymentFailed.component({
        name: 'Alice',
        updateUrl: 'https://app.com/billing',
        amount: '$49.99',
        failureReason: 'Insufficient funds',
      }),
    );
    expect(html).toContain('$49.99');
    expect(html).toContain('Insufficient funds');
    expect(html).toContain('https://app.com/billing');
  });

  it('PaymentFailed renders without optional fields', () => {
    const html = renderEmail(
      PaymentFailed.component({
        name: 'Alice',
        updateUrl: 'https://app.com/billing',
      }),
    );
    expect(html).toContain('Alice');
    expect(html).not.toContain('Amount:');
  });

  it('RefundConfirmation renders refund amount and detail rows', () => {
    const html = renderEmail(
      RefundConfirmation.component({
        name: 'Alice',
        refundAmount: '$129.98',
        refundId: 'ref_abc123',
        paymentMethod: 'Visa ending in 4242',
      }),
    );
    expect(html).toContain('$129.98');
    expect(html).toContain('ref_abc123');
    expect(html).toContain('Visa ending in 4242');
  });
});

describe('security templates', () => {
  it('SecurityAlert renders event-specific heading and body', () => {
    const html = renderEmail(
      SecurityAlert.component({
        name: 'Alice',
        event: 'new_login',
        reviewUrl: 'https://app.com/security',
      }),
    );
    expect(html).toContain('New sign-in');
    expect(html).toContain('https://app.com/security');
  });

  it('SecurityAlert shows AlertBox for high-risk events', () => {
    const html = renderEmail(
      SecurityAlert.component({
        name: 'Alice',
        event: 'suspicious_activity',
        reviewUrl: 'https://app.com/security',
      }),
    );
    expect(html).toContain('#fef2f2');
  });

  it('SecurityAlert renders detail table when security details provided', () => {
    const html = renderEmail(
      SecurityAlert.component({
        name: 'Alice',
        event: 'new_login',
        reviewUrl: 'https://app.com/security',
        ipAddress: '203.0.113.42',
        location: 'Berlin, Germany',
        device: 'Chrome on macOS',
        timestamp: 'June 16, 2026 at 14:32 UTC',
      }),
    );
    expect(html).toContain('203.0.113.42');
    expect(html).toContain('Berlin, Germany');
    expect(html).toContain('Chrome on macOS');
  });

  it('SecurityAlert omits table when no security details', () => {
    const html = renderEmail(
      SecurityAlert.component({
        name: 'Alice',
        event: 'new_login',
        reviewUrl: 'https://app.com/security',
      }),
    );
    // Without detail data there should be no detail table cells
    expect(html).not.toContain('203.0.113.42');
  });

  it('AccountLocked renders reason-specific body', () => {
    const tooMany = renderEmail(
      AccountLocked.component({
        name: 'Alice',
        reason: 'too_many_attempts',
        unlockUrl: 'https://app.com/unlock',
      }),
    );
    expect(tooMany).toContain('too many failed');

    const suspicious = renderEmail(
      AccountLocked.component({
        name: 'Alice',
        reason: 'suspicious_activity',
        unlockUrl: 'https://app.com/unlock',
      }),
    );
    expect(suspicious).toContain('suspicious activity');
  });

  it('AccountLocked renders support email when provided', () => {
    const html = renderEmail(
      AccountLocked.component({
        name: 'Alice',
        reason: 'admin_action',
        unlockUrl: 'https://app.com/unlock',
        supportEmail: 'security@example.com',
      }),
    );
    expect(html).toContain('security@example.com');
  });

  it('AccountLocked omits support block when supportEmail absent', () => {
    const html = renderEmail(
      AccountLocked.component({
        name: 'Alice',
        reason: 'admin_action',
        unlockUrl: 'https://app.com/unlock',
      }),
    );
    expect(html).not.toContain('Contact our support');
  });

  it('AccountUnlocked renders login URL', () => {
    const html = renderEmail(
      AccountUnlocked.component({
        name: 'Alice',
        loginUrl: 'https://app.com/login',
      }),
    );
    expect(html).toContain('https://app.com/login');
    expect(html).toContain('unlocked');
  });

  it('PasswordChangedConfirmation renders detail table when details provided', () => {
    const html = renderEmail(
      PasswordChangedConfirmation.component({
        name: 'Alice',
        securityUrl: 'https://app.com/security',
        timestamp: 'June 16, 2026 at 11:42 UTC',
        ipAddress: '203.0.113.42',
        location: 'Berlin, Germany',
      }),
    );
    expect(html).toContain('June 16, 2026 at 11:42 UTC');
    expect(html).toContain('203.0.113.42');
    expect(html).toContain('Berlin, Germany');
  });
});

describe('account lifecycle templates', () => {
  it('RegistrationConfirmation renders name and dashboard URL', () => {
    const html = renderEmail(
      RegistrationConfirmation.component({
        name: 'Alice',
        dashboardUrl: 'https://app.com/dashboard',
        email: 'alice@example.com',
      }),
    );
    expect(html).toContain('Alice');
    expect(html).toContain('https://app.com/dashboard');
    expect(html).toContain('alice@example.com');
  });

  it('EmailChangeVerification shows new email address', () => {
    const html = renderEmail(
      EmailChangeVerification.component({
        name: 'Alice',
        newEmail: 'alice.new@example.com',
        verifyUrl: 'https://app.com/verify?token=abc',
      }),
    );
    expect(html).toContain('alice.new@example.com');
    expect(html).toContain('https://app.com/verify?token=abc');
  });

  it('PhoneVerification renders the OTP code', () => {
    const html = renderEmail(
      PhoneVerification.component({
        name: 'Alice',
        phone: '+49 170 1234567',
        code: '847 293',
      }),
    );
    expect(html).toContain('847 293');
    expect(html).toContain('+49 170 1234567');
  });

  it('ProfileUpdated renders change records with old/new values', () => {
    const html = renderEmail(
      ProfileUpdated.component({
        name: 'Alice',
        changes: [
          { field: 'Display name', oldValue: 'Alice S.', newValue: 'Alice Smith' },
          { field: 'Language', newValue: 'English (UK)' },
        ],
        accountUrl: 'https://app.com/account',
      }),
    );
    expect(html).toContain('Display name');
    expect(html).toContain('Alice S.');
    expect(html).toContain('Alice Smith');
    expect(html).toContain('Language');
    expect(html).toContain('English (UK)');
  });

  it('LoginActivity renders event rows with status badges', () => {
    const html = renderEmail(
      LoginActivity.component({
        name: 'Alice',
        events: [
          { timestamp: 'June 16, 2026', location: 'Berlin', device: 'Chrome', status: 'success' },
          { timestamp: 'June 15, 2026', location: 'Unknown', device: 'Firefox', status: 'failed' },
        ],
        securityUrl: 'https://app.com/security',
      }),
    );
    expect(html).toContain('Berlin');
    expect(html).toContain('Chrome');
    expect(html).toContain('Success');
    expect(html).toContain('Failed');
  });

  it('DataExportRequest shows correct content per event type', () => {
    const ready = renderEmail(
      DataExportRequest.component({
        name: 'Alice',
        event: 'ready',
        actionUrl: 'https://app.com/download',
        expiresInHours: 24,
      }),
    );
    expect(ready).toContain('Download Export');
    expect(ready).toContain('24 hours');

    const expired = renderEmail(
      DataExportRequest.component({
        name: 'Alice',
        event: 'expired',
        actionUrl: 'https://app.com/settings',
      }),
    );
    expect(expired).toContain('expired');
    expect(expired).toContain('Request New Export');
  });

  it('AccountDeletionConfirmation scheduled shows warning box and cancel button', () => {
    const html = renderEmail(
      AccountDeletionConfirmation.component({
        name: 'Alice',
        event: 'scheduled',
        cancelUrl: 'https://app.com/cancel',
        deletionDate: 'July 16, 2026',
        dataRetentionDays: 30,
      }),
    );
    expect(html).toContain('July 16, 2026');
    expect(html).toContain('https://app.com/cancel');
    expect(html).toContain('30 days');
    expect(html).toContain('#fff7ed');
  });

  it('AccountDeletionConfirmation completed shows danger box', () => {
    const html = renderEmail(
      AccountDeletionConfirmation.component({
        name: 'Alice',
        event: 'completed',
      }),
    );
    expect(html).toContain('#fef2f2');
    expect(html).toContain('permanently deleted');
  });

  it('AccountDeletionConfirmation cancelled shows no warning box', () => {
    const html = renderEmail(
      AccountDeletionConfirmation.component({
        name: 'Alice',
        event: 'cancelled',
      }),
    );
    expect(html).toContain('cancelled');
    expect(html).not.toContain('#fff7ed');
    expect(html).not.toContain('#fef2f2');
  });

  it('NewsletterConfirmation renders confirm URL', () => {
    const html = renderEmail(
      NewsletterConfirmation.component({
        email: 'alice@example.com',
        confirmUrl: 'https://app.com/confirm?token=abc',
        listName: 'Acme Weekly',
      }),
    );
    expect(html).toContain('alice@example.com');
    expect(html).toContain('https://app.com/confirm?token=abc');
    expect(html).toContain('Acme Weekly');
  });

  it('NewsletterConfirmation renders unsubscribe link when provided', () => {
    const html = renderEmail(
      NewsletterConfirmation.component({
        email: 'alice@example.com',
        confirmUrl: 'https://app.com/confirm',
        unsubscribeUrl: 'https://app.com/unsubscribe',
      }),
    );
    expect(html).toContain('https://app.com/unsubscribe');
    expect(html).toContain('Unsubscribe');
  });
});
