/**
 * WCAG AA contrast audit for all built-in templates.
 *
 * Strategy: render every template to HTML, extract inline `color:` values from
 * style attributes (not <style> blocks, so @media dark rules are excluded), and
 * assert each ≥ 4.5:1 against #ffffff — the card background.
 *
 * Exclusions from the check:
 *   #ffffff — white text on colored button backgrounds (passes on its actual bg)
 *   #fefefe — preview ghost text (invisible: opacity 0, maxHeight 0)
 */
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

// ─── Contrast utilities ───────────────────────────────────────────────────────

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
}

function contrastRatio(fg: string, bg: string): number {
  const [l1, l2] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (l1 + 0.05) / (l2 + 0.05);
}

// Extract only inline text colors from style="..." attributes (not <style> blocks).
// Matches `color: #rrggbb` but not `background-color: #rrggbb`.
function extractInlineTextColors(html: string): Set<string> {
  const styleAttrRe = /style="([^"]*)"/g;
  const colorRe = /(?<![\w-])color:\s*(#[0-9a-fA-F]{6})/g;
  const colors = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = styleAttrRe.exec(html)) !== null) {
    const styleVal = m[1] as string;
    let c: RegExpExecArray | null;
    colorRe.lastIndex = 0;
    while ((c = colorRe.exec(styleVal)) !== null) colors.add((c[1] as string).toLowerCase());
  }
  // White text on colored buttons — valid use, background is not white.
  colors.delete('#ffffff');
  // Preview ghost text — invisible (opacity 0, maxHeight 0).
  colors.delete('#fefefe');
  return colors;
}

// ─── Template render map ──────────────────────────────────────────────────────

const templates: Record<string, string> = {
  AbandonedCart: renderEmail(
    AbandonedCart.component({
      name: 'Alice',
      cartUrl: 'https://app.com/cart',
      items: [{ name: 'Widget', price: 9.99, imageUrl: 'https://img.example.com/w.png' }],
    }),
  ),
  AccountDeactivated: renderEmail(
    AccountDeactivated.component({
      name: 'Alice',
      reactivateUrl: 'https://app.com/reactivate',
    }),
  ),
  AccountDeletionConfirmation_scheduled: renderEmail(
    AccountDeletionConfirmation.component({
      name: 'Alice',
      event: 'scheduled',
      cancelUrl: 'https://app.com/cancel',
      deletionDate: 'July 16, 2026',
      dataRetentionDays: 30,
    }),
  ),
  AccountDeletionConfirmation_completed: renderEmail(
    AccountDeletionConfirmation.component({
      name: 'Alice',
      event: 'completed',
    }),
  ),
  AccountLocked_tooMany: renderEmail(
    AccountLocked.component({
      name: 'Alice',
      reason: 'too_many_attempts',
      unlockUrl: 'https://app.com/unlock',
    }),
  ),
  AccountLocked_suspicious: renderEmail(
    AccountLocked.component({
      name: 'Alice',
      reason: 'suspicious_activity',
      unlockUrl: 'https://app.com/unlock',
    }),
  ),
  AccountUnlocked: renderEmail(
    AccountUnlocked.component({
      name: 'Alice',
      loginUrl: 'https://app.com/login',
    }),
  ),
  BackInStock: renderEmail(
    BackInStock.component({
      name: 'Bob',
      productName: 'Blue Widget',
      productUrl: 'https://shop.com/blue-widget',
    }),
  ),
  CommentMention_mention: renderEmail(
    CommentMention.component({
      name: 'Alice',
      event: 'mention',
      actorName: 'Bob',
      contextName: 'Project Alpha',
      commentUrl: 'https://app.com/comments/1',
      commentText: 'Hey @Alice!',
    }),
  ),
  CommentMention_reply: renderEmail(
    CommentMention.component({
      name: 'Alice',
      event: 'reply',
      actorName: 'Bob',
      contextName: 'Project Alpha',
      commentUrl: 'https://app.com/comments/2',
      commentText: 'Replying here.',
    }),
  ),
  DataExportRequest_ready: renderEmail(
    DataExportRequest.component({
      name: 'Alice',
      event: 'ready',
      actionUrl: 'https://app.com/download',
      expiresInHours: 24,
    }),
  ),
  DataExportRequest_expired: renderEmail(
    DataExportRequest.component({
      name: 'Alice',
      event: 'expired',
      actionUrl: 'https://app.com/settings',
    }),
  ),
  EmailChangeVerification: renderEmail(
    EmailChangeVerification.component({
      name: 'Alice',
      newEmail: 'alice.new@example.com',
      verifyUrl: 'https://app.com/verify?token=abc',
    }),
  ),
  EmailVerification: renderEmail(
    EmailVerification.component({
      name: 'Alice',
      verifyUrl: 'https://app.com/verify?token=xyz',
    }),
  ),
  ExportReady: renderEmail(
    ExportReady.component({
      name: 'Alice',
      exportName: 'users.csv',
      downloadUrl: 'https://app.com/downloads/abc',
      expiresInHours: 48,
    }),
  ),
  FeatureAnnouncement: renderEmail(
    FeatureAnnouncement.component({
      name: 'Alice',
      featureName: 'AI Suggestions',
      description: 'Smarter autocomplete.',
      ctaUrl: 'https://app.com/features/ai',
      changes: [{ type: 'new', title: 'AI Suggestions', description: 'Autocomplete.' }],
    }),
  ),
  Invoice: renderEmail(
    Invoice.component({
      customerName: 'ACME Corp',
      invoiceNumber: 'INV-001',
      items: [
        { name: 'Pro Plan', price: 99.99 },
        { name: 'Support', price: 29.99, quantity: 2 },
      ],
    }),
  ),
  LoginActivity: renderEmail(
    LoginActivity.component({
      name: 'Alice',
      events: [
        { timestamp: 'June 16, 2026', location: 'Berlin', device: 'Chrome', status: 'success' },
        { timestamp: 'June 15, 2026', location: 'Unknown', device: 'Firefox', status: 'failed' },
      ],
      securityUrl: 'https://app.com/security',
    }),
  ),
  MagicLink: renderEmail(
    MagicLink.component({
      email: 'user@example.com',
      loginUrl: 'https://app.com/auth?token=magic',
    }),
  ),
  MaintenanceNotification_scheduled: renderEmail(
    MaintenanceNotification.component({
      type: 'scheduled',
      startTime: 'June 20, 2026 at 02:00 UTC',
      endTime: 'June 20, 2026 at 04:00 UTC',
      duration: '2 hours',
      statusPageUrl: 'https://status.app.com',
    }),
  ),
  MaintenanceNotification_emergency: renderEmail(
    MaintenanceNotification.component({
      type: 'emergency',
      affectedServices: [
        { name: 'API', impact: 'full_outage' },
        { name: 'Dashboard', impact: 'degraded' },
      ],
      statusPageUrl: 'https://status.app.com',
    }),
  ),
  MaintenanceNotification_completed: renderEmail(
    MaintenanceNotification.component({
      type: 'completed',
    }),
  ),
  NewsletterConfirmation: renderEmail(
    NewsletterConfirmation.component({
      email: 'alice@example.com',
      confirmUrl: 'https://app.com/confirm?token=abc',
      listName: 'Acme Weekly',
    }),
  ),
  Notification_simple: renderEmail(
    Notification.component({
      title: 'System alert',
      body: 'Something happened.',
    }),
  ),
  Notification_withCta: renderEmail(
    Notification.component({
      title: 'Alert',
      body: 'Details',
      ctaLabel: 'View',
      ctaUrl: 'https://app.com',
    }),
  ),
  OnboardingProgress: renderEmail(
    OnboardingProgress.component({
      name: 'Alice',
      dashboardUrl: 'https://app.com/dashboard',
      steps: [
        { title: 'Create account', completed: true },
        { title: 'Add team members', completed: false },
      ],
    }),
  ),
  OrderConfirmation: renderEmail(
    OrderConfirmation.component({
      name: 'Alice',
      orderNumber: 'ORD-42',
      orderUrl: 'https://app.com/orders/42',
      items: [{ name: 'Widget', quantity: 2, price: 9.99 }],
    }),
  ),
  PasswordChangedConfirmation: renderEmail(
    PasswordChangedConfirmation.component({
      name: 'Alice',
      securityUrl: 'https://app.com/security',
      timestamp: 'June 16, 2026',
      ipAddress: '1.2.3.4',
    }),
  ),
  PasswordReset: renderEmail(
    PasswordReset.component({
      username: 'alice',
      resetUrl: 'https://app.com/reset?token=abc',
    }),
  ),
  PasswordlessOtp: renderEmail(PasswordlessOtp.component({ code: '847 293' })),
  PaymentFailed: renderEmail(
    PaymentFailed.component({
      name: 'Alice',
      updateUrl: 'https://app.com/billing',
      amount: '$49.99',
      failureReason: 'Insufficient funds',
    }),
  ),
  PhoneVerification: renderEmail(
    PhoneVerification.component({
      name: 'Alice',
      phone: '+49 170 1234567',
      code: '847 293',
    }),
  ),
  PolicyUpdate: renderEmail(
    PolicyUpdate.component({
      policyType: 'privacy',
      effectiveDate: 'July 1, 2026',
      policyUrl: 'https://app.com/privacy',
      changes: [{ section: 'Data retention', summary: 'We now retain data for 1 year.' }],
    }),
  ),
  ProfileUpdated: renderEmail(
    ProfileUpdated.component({
      name: 'Alice',
      changes: [{ field: 'Display name', oldValue: 'Alice S.', newValue: 'Alice Smith' }],
      accountUrl: 'https://app.com/account',
    }),
  ),
  Referral_invite: renderEmail(
    Referral.component({
      name: 'Alice',
      event: 'invite',
      referrerName: 'Bob',
      actionUrl: 'https://app.com/join?ref=BOB20',
      referralCode: 'BOB20',
      reward: '$20 off',
    }),
  ),
  Referral_reward: renderEmail(
    Referral.component({
      name: 'Bob',
      event: 'reward_credited',
      referrerName: 'Bob',
      actionUrl: 'https://app.com/dashboard',
      reward: '$20 off',
    }),
  ),
  RefundConfirmation: renderEmail(
    RefundConfirmation.component({
      name: 'Alice',
      refundAmount: '$129.98',
      refundId: 'ref_abc123',
      paymentMethod: 'Visa ending in 4242',
    }),
  ),
  RegistrationConfirmation: renderEmail(
    RegistrationConfirmation.component({
      name: 'Alice',
      dashboardUrl: 'https://app.com/dashboard',
      email: 'alice@example.com',
    }),
  ),
  ReviewRequest: renderEmail(
    ReviewRequest.component({
      name: 'Alice',
      reviewUrl: 'https://g.page/r/review',
      productOrService: 'Pro Plan',
    }),
  ),
  SecurityAlert_newLogin: renderEmail(
    SecurityAlert.component({
      name: 'Alice',
      event: 'new_login',
      reviewUrl: 'https://app.com/security',
    }),
  ),
  SecurityAlert_suspicious: renderEmail(
    SecurityAlert.component({
      name: 'Alice',
      event: 'suspicious_activity',
      reviewUrl: 'https://app.com/security',
    }),
  ),
  ShippingUpdate: renderEmail(
    ShippingUpdate.component({
      name: 'Bob',
      orderNumber: 'ORD-99',
      status: 'shipped',
      trackingUrl: 'https://track.example.com/TRK123',
    }),
  ),
  Subscription_started: renderEmail(
    Subscription.component({
      name: 'Alice',
      event: 'started',
      planName: 'Pro',
      actionUrl: 'https://app.com/dashboard',
    }),
  ),
  Subscription_trialEnding: renderEmail(
    Subscription.component({
      name: 'Alice',
      event: 'trial_ending',
      planName: 'Pro',
      actionUrl: 'https://app.com/upgrade',
      trialDaysRemaining: 3,
    }),
  ),
  SupportTicket_created: renderEmail(
    SupportTicket.component({
      name: 'Alice',
      event: 'created',
      ticketId: 'TKT-1042',
      ticketTitle: 'Login not working',
      ticketUrl: 'https://support.app.com/tickets/1042',
    }),
  ),
  SupportTicket_resolved: renderEmail(
    SupportTicket.component({
      name: 'Alice',
      event: 'resolved',
      ticketId: 'TKT-1042',
      ticketTitle: 'Login not working',
      ticketUrl: 'https://support.app.com/tickets/1042',
      agentMessage: 'Issue fixed in v2.3.',
      agentName: 'Support Team',
    }),
  ),
  TeamInvite: renderEmail(
    TeamInvite.component({
      inviterName: 'Bob',
      teamName: 'Acme Engineering',
      inviteUrl: 'https://app.com/invite/xyz',
    }),
  ),
  TwoFactorAuth: renderEmail(TwoFactorAuth.component({ username: 'alice', code: '123456' })),
  UsageAlert: renderEmail(
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
  ),
  WeeklyDigest: renderEmail(
    WeeklyDigest.component({
      name: 'Alice',
      weekOf: 'June 9–15, 2026',
      dashboardUrl: 'https://app.com/dashboard',
      stats: [{ label: 'Emails sent', value: '1,204', change: '+12%', positive: true }],
      items: [{ title: 'Top article', url: 'https://blog.app.com/top', category: 'Blog' }],
    }),
  ),
  Welcome: renderEmail(Welcome.component({ name: 'Alice', loginUrl: 'https://app.com' })),
  WinBack: renderEmail(
    WinBack.component({
      name: 'Alice',
      returnUrl: 'https://app.com/login',
      daysSince: 30,
      offer: '20% off for 3 months',
    }),
  ),
};

// ─── WCAG AA tests ────────────────────────────────────────────────────────────

describe('WCAG AA contrast — all templates', () => {
  for (const [templateName, html] of Object.entries(templates)) {
    it(`${templateName}: inline text colors ≥ 4.5:1 on card background (#ffffff)`, () => {
      const colors = extractInlineTextColors(html);
      const failures: string[] = [];
      for (const color of colors) {
        const ratio = contrastRatio(color, '#ffffff');
        if (ratio < 4.5) failures.push(`${color} = ${ratio.toFixed(2)}:1`);
      }
      expect(failures, `WCAG AA failures in ${templateName}: ${failures.join(', ')}`).toHaveLength(
        0,
      );
    });
  }
});
