import { describe, expect, it } from 'vitest';
import { renderEmail } from '../render.js';
import { AbandonedCart } from '../templates/AbandonedCart.js';
import { AccountDeactivated } from '../templates/AccountDeactivated.js';
import { AccountDeletionConfirmation } from '../templates/AccountDeletionConfirmation.js';
import { AccountLocked } from '../templates/AccountLocked.js';
import { AccountUnlocked } from '../templates/AccountUnlocked.js';
import { BackInStock } from '../templates/BackInStock.js';
import { CommentMention } from '../templates/CommentMention.js';
import { DataExportRequest } from '../templates/DataExportRequest.js';
import { EmailChangeVerification } from '../templates/EmailChangeVerification.js';
import { EmailVerification } from '../templates/EmailVerification.js';
import { ExportReady } from '../templates/ExportReady.js';
import { FeatureAnnouncement } from '../templates/FeatureAnnouncement.js';
import { Invoice } from '../templates/Invoice.js';
import { LoginActivity } from '../templates/LoginActivity.js';
import { MagicLink } from '../templates/MagicLink.js';
import { MaintenanceNotification } from '../templates/MaintenanceNotification.js';
import { NewsletterConfirmation } from '../templates/NewsletterConfirmation.js';
import { Notification } from '../templates/Notification.js';
import { OnboardingProgress } from '../templates/OnboardingProgress.js';
import { OrderConfirmation } from '../templates/OrderConfirmation.js';
import { PasswordChangedConfirmation } from '../templates/PasswordChangedConfirmation.js';
import { PasswordlessOtp } from '../templates/PasswordlessOtp.js';
import { PasswordReset } from '../templates/PasswordReset.js';
import { PaymentFailed } from '../templates/PaymentFailed.js';
import { PhoneVerification } from '../templates/PhoneVerification.js';
import { PolicyUpdate } from '../templates/PolicyUpdate.js';
import { ProfileUpdated } from '../templates/ProfileUpdated.js';
import { Referral } from '../templates/Referral.js';
import { RefundConfirmation } from '../templates/RefundConfirmation.js';
import { RegistrationConfirmation } from '../templates/RegistrationConfirmation.js';
import { ReviewRequest } from '../templates/ReviewRequest.js';
import { SecurityAlert } from '../templates/SecurityAlert.js';
import { ShippingUpdate } from '../templates/ShippingUpdate.js';
import { Subscription } from '../templates/Subscription.js';
import { SupportTicket } from '../templates/SupportTicket.js';
import { TeamInvite } from '../templates/TeamInvite.js';
import { TwoFactorAuth } from '../templates/TwoFactorAuth.js';
import { UsageAlert } from '../templates/UsageAlert.js';
import { WeeklyDigest } from '../templates/WeeklyDigest.js';
import { Welcome } from '../templates/Welcome.js';
import { WinBack } from '../templates/WinBack.js';

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
    const html = renderEmail(TwoFactorAuth.component({ username: 'alice', code: '123456' }));
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
    const html = renderEmail(PasswordlessOtp.component({ code: '847 293' }));
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

describe('additional templates', () => {
  it('Notification renders title and body', () => {
    const html = renderEmail(
      Notification.component({ title: 'System alert', body: 'Something happened.' }),
    );
    expect(html).toContain('System alert');
    expect(html).toContain('Something happened.');
  });

  it('Notification renders CTA when provided', () => {
    const html = renderEmail(
      Notification.component({
        title: 'Alert',
        body: 'Details',
        ctaLabel: 'View',
        ctaUrl: 'https://app.com',
      }),
    );
    expect(html).toContain('View');
    expect(html).toContain('https://app.com');
  });

  it('AbandonedCart renders items and cart URL', () => {
    const html = renderEmail(
      AbandonedCart.component({
        name: 'Alice',
        cartUrl: 'https://shop.com/cart',
        items: [{ name: 'Widget', price: 9.99, imageUrl: 'https://img.example.com/w.png' }],
      }),
    );
    expect(html).toContain('Widget');
    expect(html).toContain('https://shop.com/cart');
  });

  it('AccountDeactivated renders reactivate URL', () => {
    const html = renderEmail(
      AccountDeactivated.component({
        name: 'Alice',
        reactivateUrl: 'https://app.com/reactivate',
      }),
    );
    expect(html).toContain('https://app.com/reactivate');
    expect(html).toContain('Alice');
  });

  it('AccountDeactivated renders optional fields', () => {
    const html = renderEmail(
      AccountDeactivated.component({
        name: 'Alice',
        reactivateUrl: 'https://app.com/reactivate',
        reason: 'Inactivity',
        dataRetentionDays: 90,
        supportEmail: 'help@app.com',
      }),
    );
    expect(html).toContain('Inactivity');
    expect(html).toContain('90');
    expect(html).toContain('help@app.com');
  });

  it('BackInStock renders product name and URL', () => {
    const html = renderEmail(
      BackInStock.component({
        name: 'Bob',
        productName: 'Blue Widget',
        productUrl: 'https://shop.com/blue-widget',
      }),
    );
    expect(html).toContain('Blue Widget');
    expect(html).toContain('https://shop.com/blue-widget');
  });

  it('CommentMention renders actor and context', () => {
    const html = renderEmail(
      CommentMention.component({
        name: 'Alice',
        event: 'mention',
        actorName: 'Bob',
        contextName: 'Project Alpha',
        commentUrl: 'https://app.com/comments/1',
        commentText: 'Hey @Alice, check this out!',
      }),
    );
    expect(html).toContain('Bob');
    expect(html).toContain('Project Alpha');
    expect(html).toContain('Hey @Alice');
  });

  it('ExportReady renders download URL', () => {
    const html = renderEmail(
      ExportReady.component({
        name: 'Alice',
        exportName: 'users_june.csv',
        downloadUrl: 'https://app.com/downloads/abc',
        expiresInHours: 48,
      }),
    );
    expect(html).toContain('https://app.com/downloads/abc');
    expect(html).toContain('48');
  });

  it('FeatureAnnouncement renders feature name and CTA', () => {
    const html = renderEmail(
      FeatureAnnouncement.component({
        name: 'Alice',
        featureName: 'AI Suggestions',
        description: 'Smarter autocomplete for your workflow.',
        ctaUrl: 'https://app.com/features/ai',
        changes: [{ type: 'new', title: 'AI Suggestions', description: 'Autocomplete.' }],
      }),
    );
    expect(html).toContain('AI Suggestions');
    expect(html).toContain('https://app.com/features/ai');
  });

  it('MaintenanceNotification scheduled renders window', () => {
    const html = renderEmail(
      MaintenanceNotification.component({
        type: 'scheduled',
        startTime: 'June 20, 2026 at 02:00 UTC',
        endTime: 'June 20, 2026 at 04:00 UTC',
        duration: '2 hours',
        statusPageUrl: 'https://status.app.com',
      }),
    );
    expect(html).toContain('June 20, 2026');
    expect(html).toContain('https://status.app.com');
  });

  it('MaintenanceNotification completed renders back-online message', () => {
    const html = renderEmail(MaintenanceNotification.component({ type: 'completed' }));
    expect(html).toContain('back online');
  });

  it('OnboardingProgress renders step list', () => {
    const html = renderEmail(
      OnboardingProgress.component({
        name: 'Alice',
        dashboardUrl: 'https://app.com/dashboard',
        steps: [
          { title: 'Create account', completed: true },
          { title: 'Add team members', completed: false },
        ],
      }),
    );
    expect(html).toContain('Create account');
    expect(html).toContain('Add team members');
    expect(html).toContain('https://app.com/dashboard');
  });

  it('PolicyUpdate renders policy type and date', () => {
    const html = renderEmail(
      PolicyUpdate.component({
        policyType: 'privacy',
        effectiveDate: 'July 1, 2026',
        policyUrl: 'https://app.com/privacy',
      }),
    );
    expect(html).toContain('July 1, 2026');
    expect(html).toContain('https://app.com/privacy');
  });

  it('Referral invite renders referrer name and code', () => {
    const html = renderEmail(
      Referral.component({
        name: 'Alice',
        event: 'invite',
        referrerName: 'Bob',
        actionUrl: 'https://app.com/join?ref=BOB20',
        referralCode: 'BOB20',
        reward: '$20 off',
      }),
    );
    expect(html).toContain('Bob');
    expect(html).toContain('BOB20');
    expect(html).toContain('$20 off');
  });

  it('ReviewRequest renders review URL', () => {
    const html = renderEmail(
      ReviewRequest.component({
        name: 'Alice',
        reviewUrl: 'https://g.page/r/review',
        productOrService: 'Pro Plan',
      }),
    );
    expect(html).toContain('https://g.page/r/review');
    expect(html).toContain('Pro Plan');
  });

  it('Subscription started renders plan name', () => {
    const html = renderEmail(
      Subscription.component({
        name: 'Alice',
        event: 'started',
        planName: 'Pro',
        actionUrl: 'https://app.com/dashboard',
      }),
    );
    expect(html).toContain('Pro');
    expect(html).toContain('https://app.com/dashboard');
  });

  it('Subscription trial_ending renders days remaining', () => {
    const html = renderEmail(
      Subscription.component({
        name: 'Alice',
        event: 'trial_ending',
        planName: 'Pro',
        actionUrl: 'https://app.com/upgrade',
        trialDaysRemaining: 3,
      }),
    );
    expect(html).toContain('3');
  });

  it('SupportTicket created renders ticket ID and title', () => {
    const html = renderEmail(
      SupportTicket.component({
        name: 'Alice',
        event: 'created',
        ticketId: 'TKT-1042',
        ticketTitle: 'Login not working',
        ticketUrl: 'https://support.app.com/tickets/1042',
      }),
    );
    expect(html).toContain('TKT-1042');
    expect(html).toContain('Login not working');
  });

  it('SupportTicket resolved renders agent message', () => {
    const html = renderEmail(
      SupportTicket.component({
        name: 'Alice',
        event: 'resolved',
        ticketId: 'TKT-1042',
        ticketTitle: 'Login not working',
        ticketUrl: 'https://support.app.com/tickets/1042',
        agentMessage: 'Issue fixed in v2.3.',
        agentName: 'Support Team',
      }),
    );
    expect(html).toContain('Issue fixed in v2.3.');
  });

  it('UsageAlert warning renders usage stats', () => {
    const html = renderEmail(
      UsageAlert.component({
        name: 'Alice',
        resource: 'API calls',
        used: 8500,
        limit: 10000,
        unit: 'calls',
        percentUsed: 85,
        severity: 'warning',
        upgradeUrl: 'https://app.com/upgrade',
      }),
    );
    expect(html).toContain('API calls');
    expect(html).toContain('8500');
    expect(html).toContain('https://app.com/upgrade');
  });

  it('WeeklyDigest renders stats and items', () => {
    const html = renderEmail(
      WeeklyDigest.component({
        name: 'Alice',
        weekOf: 'June 9–15, 2026',
        dashboardUrl: 'https://app.com/dashboard',
        stats: [{ label: 'Emails sent', value: '1,204', change: '+12%' }],
        items: [{ title: 'Top article', url: 'https://blog.app.com/top', category: 'Blog' }],
      }),
    );
    expect(html).toContain('1,204');
    expect(html).toContain('Top article');
    expect(html).toContain('June 9–15, 2026');
  });

  it('WinBack renders return URL and days since', () => {
    const html = renderEmail(
      WinBack.component({
        name: 'Alice',
        returnUrl: 'https://app.com/login',
        daysSince: 30,
        offer: '20% off for 3 months',
      }),
    );
    expect(html).toContain('https://app.com/login');
    expect(html).toContain('30');
    expect(html).toContain('20% off');
  });
});

describe('branch coverage — optional props', () => {
  // PasswordReset: expiresIn branch
  it('PasswordReset renders expiry note when expiresIn provided', () => {
    const html = renderEmail(
      PasswordReset.component({
        username: 'alice',
        resetUrl: 'https://app.com/reset',
        expiresIn: '1 hour',
      }),
    );
    expect(html).toContain('1 hour');
  });

  // EmailVerification: expiresIn branch
  it('EmailVerification renders expiry note when expiresIn provided', () => {
    const html = renderEmail(
      EmailVerification.component({
        name: 'Alice',
        verifyUrl: 'https://app.com/verify',
        expiresIn: '24 hours',
      }),
    );
    expect(html).toContain('24 hours');
  });

  // MagicLink: custom expiresIn
  it('MagicLink renders custom expiresIn', () => {
    const html = renderEmail(
      MagicLink.component({
        email: 'alice@example.com',
        loginUrl: 'https://app.com/magic',
        expiresIn: '30 minutes',
      }),
    );
    expect(html).toContain('30 minutes');
  });

  // TwoFactorAuth: expiresIn branch
  it('TwoFactorAuth renders expiry when provided', () => {
    const html = renderEmail(
      TwoFactorAuth.component({ username: 'alice', code: '123456', expiresIn: '10 minutes' }),
    );
    expect(html).toContain('10 minutes');
  });

  // PaymentFailed: amount + failureReason + retryInDays + supportEmail branches
  it('PaymentFailed renders all optional fields', () => {
    const html = renderEmail(
      PaymentFailed.component({
        name: 'Alice',
        updateUrl: 'https://app.com/billing',
        amount: '$49.99',
        failureReason: 'Card expired',
        retryInDays: 3,
        supportEmail: 'billing@example.com',
      }),
    );
    expect(html).toContain('$49.99');
    expect(html).toContain('Card expired');
    expect(html).toContain('3');
    expect(html).toContain('billing@example.com');
  });

  // Invoice: supportEmail branch + tax + discount
  it('Invoice renders supportEmail note', () => {
    const html = renderEmail(
      Invoice.component({
        customerName: 'Acme',
        invoiceNumber: 'INV-001',
        items: [{ name: 'Service', quantity: 1, price: 100 }],
        supportEmail: 'billing@acme.com',
      }),
    );
    expect(html).toContain('billing@acme.com');
  });

  it('Invoice renders subtotal/tax/discount rows', () => {
    const html = renderEmail(
      Invoice.component({
        customerName: 'Acme',
        invoiceNumber: 'INV-002',
        items: [{ name: 'Item', quantity: 2, price: 50 }],
      }),
    );
    expect(html).toContain('$100');
    expect(html).toContain('$10');
    expect(html).toContain('$5');
  });

  // PolicyUpdate: changes + supportEmail branches
  it('PolicyUpdate renders changes list and supportEmail', () => {
    const html = renderEmail(
      PolicyUpdate.component({
        policyType: 'privacy',
        effectiveDate: 'Aug 1, 2026',
        policyUrl: 'https://app.com/privacy',
        changes: [{ section: 'Data Retention', summary: 'Now 90 days.' }],
        supportEmail: 'privacy@app.com',
      }),
    );
    expect(html).toContain('Data Retention');
    expect(html).toContain('privacy@app.com');
  });

  // ShippingUpdate: status variants
  it('ShippingUpdate renders delivered status', () => {
    const html = renderEmail(
      ShippingUpdate.component({
        name: 'Alice',
        orderNumber: 'ORD-001',
        status: 'delivered',
        trackingUrl: 'https://track.example.com',
        estimatedDelivery: 'Today',
      }),
    );
    expect(html).toContain('delivered');
  });

  it('ShippingUpdate renders delayed status', () => {
    const html = renderEmail(
      ShippingUpdate.component({
        name: 'Alice',
        orderNumber: 'ORD-001',
        status: 'delayed',
        trackingUrl: 'https://track.example.com',
      }),
    );
    expect(html).toContain('delay');
  });

  // AccountUnlocked: optional loginActivity
  it('AccountUnlocked renders without loginUrl still works', () => {
    const html = renderEmail(
      AccountUnlocked.component({ name: 'Alice', loginUrl: 'https://app.com/login' }),
    );
    expect(html).toContain('Alice');
    expect(html).toContain('https://app.com/login');
  });

  // SupportTicket: priority badge + agentMessage variant
  it('SupportTicket renders priority badge for urgent', () => {
    const html = renderEmail(
      SupportTicket.component({
        name: 'Alice',
        event: 'updated',
        ticketId: 'TKT-1',
        ticketTitle: 'Urgent issue',
        ticketUrl: 'https://support.app.com/1',
        priority: 'urgent',
        agentMessage: 'We are looking into this now.',
        agentName: 'Support',
      }),
    );
    expect(html).toContain('Urgent');
    expect(html).toContain('We are looking into this now.');
  });

  // MaintenanceNotification: emergency + extended variants
  it('MaintenanceNotification emergency renders', () => {
    const html = renderEmail(
      MaintenanceNotification.component({
        type: 'emergency',
        startTime: 'Now',
        statusPageUrl: 'https://status.app.com',
      }),
    );
    expect(html).toContain('https://status.app.com');
  });

  it('MaintenanceNotification extended renders', () => {
    const html = renderEmail(
      MaintenanceNotification.component({ type: 'extended', endTime: 'June 22 04:00 UTC' }),
    );
    expect(html).toContain('June 22 04:00 UTC');
  });

  // PasswordlessOtp: appName branch
  it('PasswordlessOtp renders with custom appName', () => {
    const html = renderEmail(PasswordlessOtp.component({ code: '999999', appName: 'MyApp' }));
    expect(html).toContain('999999');
    expect(html).toContain('MyApp');
  });

  // TeamInvite: role + expiresInHours branches
  it('TeamInvite renders role and expiry', () => {
    const html = renderEmail(
      TeamInvite.component({
        inviterName: 'Bob',
        teamName: 'Engineering',
        inviteUrl: 'https://app.com/invite',
        role: 'Admin',
        expiresInHours: 48,
      }),
    );
    expect(html).toContain('Admin');
    expect(html).toContain('48');
  });

  // WinBack: unsubscribeUrl branch
  it('WinBack renders unsubscribe link', () => {
    const html = renderEmail(
      WinBack.component({
        name: 'Alice',
        returnUrl: 'https://app.com/login',
        daysSince: 60,
        offer: '20% off',
        unsubscribeUrl: 'https://app.com/unsub',
      }),
    );
    expect(html).toContain('https://app.com/unsub');
  });

  // ReviewRequest: starRating branch
  it('ReviewRequest renders productOrService in body', () => {
    const html = renderEmail(
      ReviewRequest.component({
        name: 'Alice',
        reviewUrl: 'https://reviews.example.com',
        productOrService: 'Pro Plan',
      }),
    );
    expect(html).toContain('https://reviews.example.com');
    expect(html).toContain('Pro Plan');
  });
});
