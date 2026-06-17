#!/usr/bin/env tsx
/**
 * WCAG AA contrast check for all built-in templates.
 *
 * Usage:
 *   pnpm wcag              — check all templates
 *   pnpm wcag Welcome      — check one template by name (substring match)
 *
 * Exit code 1 when any failure is found (CI-friendly).
 */
import { renderEmail } from '../src/render.js';
import { AbandonedCart } from '../src/templates/AbandonedCart.js';
import { AccountDeactivated } from '../src/templates/AccountDeactivated.js';
import { AccountDeletionConfirmation } from '../src/templates/AccountDeletionConfirmation.js';
import { AccountLocked } from '../src/templates/AccountLocked.js';
import { AccountUnlocked } from '../src/templates/AccountUnlocked.js';
import { BackInStock } from '../src/templates/BackInStock.js';
import { CommentMention } from '../src/templates/CommentMention.js';
import { DataExportRequest } from '../src/templates/DataExportRequest.js';
import { EmailChangeVerification } from '../src/templates/EmailChangeVerification.js';
import { EmailVerification } from '../src/templates/EmailVerification.js';
import { ExportReady } from '../src/templates/ExportReady.js';
import { FeatureAnnouncement } from '../src/templates/FeatureAnnouncement.js';
import { Invoice } from '../src/templates/Invoice.js';
import { LoginActivity } from '../src/templates/LoginActivity.js';
import { MagicLink } from '../src/templates/MagicLink.js';
import { MaintenanceNotification } from '../src/templates/MaintenanceNotification.js';
import { NewsletterConfirmation } from '../src/templates/NewsletterConfirmation.js';
import { Notification } from '../src/templates/Notification.js';
import { OnboardingProgress } from '../src/templates/OnboardingProgress.js';
import { OrderConfirmation } from '../src/templates/OrderConfirmation.js';
import { PasswordChangedConfirmation } from '../src/templates/PasswordChangedConfirmation.js';
import { PasswordReset } from '../src/templates/PasswordReset.js';
import { PasswordlessOtp } from '../src/templates/PasswordlessOtp.js';
import { PaymentFailed } from '../src/templates/PaymentFailed.js';
import { PhoneVerification } from '../src/templates/PhoneVerification.js';
import { PolicyUpdate } from '../src/templates/PolicyUpdate.js';
import { ProfileUpdated } from '../src/templates/ProfileUpdated.js';
import { Referral } from '../src/templates/Referral.js';
import { RefundConfirmation } from '../src/templates/RefundConfirmation.js';
import { RegistrationConfirmation } from '../src/templates/RegistrationConfirmation.js';
import { ReviewRequest } from '../src/templates/ReviewRequest.js';
import { SecurityAlert } from '../src/templates/SecurityAlert.js';
import { ShippingUpdate } from '../src/templates/ShippingUpdate.js';
import { Subscription } from '../src/templates/Subscription.js';
import { SupportTicket } from '../src/templates/SupportTicket.js';
import { TeamInvite } from '../src/templates/TeamInvite.js';
import { TwoFactorAuth } from '../src/templates/TwoFactorAuth.js';
import { UsageAlert } from '../src/templates/UsageAlert.js';
import { WeeklyDigest } from '../src/templates/WeeklyDigest.js';
import { Welcome } from '../src/templates/Welcome.js';
import { WinBack } from '../src/templates/WinBack.js';

// ─── Contrast utilities ───────────────────────────────────────────────────────

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 0xff), ((n >> 8) & 0xff), n & 0xff]
    .map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
}

function contrastRatio(fg: string, bg: string): number {
  const [l1, l2] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

function extractInlineTextColors(html: string): Set<string> {
  const styleAttrRe = /style="([^"]*)"/g;
  const colorRe = /(?<![\w-])color:\s*(#[0-9a-fA-F]{6})/g;
  const colors = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = styleAttrRe.exec(html)) !== null) {
    const styleVal = m[1];
    let c: RegExpExecArray | null;
    colorRe.lastIndex = 0;
    while ((c = colorRe.exec(styleVal)) !== null) colors.add(c[1]!.toLowerCase());
  }
  colors.delete('#ffffff'); // white text on colored buttons — passes on actual bg
  colors.delete('#fefefe'); // preview ghost text — invisible
  return colors;
}

// ─── Template render map ──────────────────────────────────────────────────────

const templates: Record<string, string> = {
  AbandonedCart: renderEmail(AbandonedCart.component({
    name: 'Alice', cartUrl: 'https://app.com/cart',
    items: [{ name: 'Widget', price: 9.99, imageUrl: 'https://img.example.com/w.png' }],
  })),
  AccountDeactivated: renderEmail(AccountDeactivated.component({
    name: 'Alice', reactivateUrl: 'https://app.com/reactivate',
  })),
  AccountDeletionConfirmation_scheduled: renderEmail(AccountDeletionConfirmation.component({
    name: 'Alice', event: 'scheduled', cancelUrl: 'https://app.com/cancel',
    deletionDate: 'July 16, 2026', dataRetentionDays: 30,
  })),
  AccountDeletionConfirmation_completed: renderEmail(AccountDeletionConfirmation.component({
    name: 'Alice', event: 'completed',
  })),
  AccountLocked_tooMany: renderEmail(AccountLocked.component({
    name: 'Alice', reason: 'too_many_attempts', unlockUrl: 'https://app.com/unlock',
  })),
  AccountLocked_suspicious: renderEmail(AccountLocked.component({
    name: 'Alice', reason: 'suspicious_activity', unlockUrl: 'https://app.com/unlock',
  })),
  AccountUnlocked: renderEmail(AccountUnlocked.component({
    name: 'Alice', loginUrl: 'https://app.com/login',
  })),
  BackInStock: renderEmail(BackInStock.component({
    name: 'Bob', productName: 'Blue Widget', productUrl: 'https://shop.com/blue-widget',
  })),
  CommentMention_mention: renderEmail(CommentMention.component({
    name: 'Alice', event: 'mention', actorName: 'Bob', contextName: 'Project Alpha',
    commentUrl: 'https://app.com/comments/1', commentText: 'Hey @Alice!',
  })),
  CommentMention_reply: renderEmail(CommentMention.component({
    name: 'Alice', event: 'reply', actorName: 'Bob', contextName: 'Project Alpha',
    commentUrl: 'https://app.com/comments/2', commentText: 'Replying here.',
  })),
  DataExportRequest_ready: renderEmail(DataExportRequest.component({
    name: 'Alice', event: 'ready', actionUrl: 'https://app.com/download', expiresInHours: 24,
  })),
  DataExportRequest_expired: renderEmail(DataExportRequest.component({
    name: 'Alice', event: 'expired', actionUrl: 'https://app.com/settings',
  })),
  EmailChangeVerification: renderEmail(EmailChangeVerification.component({
    name: 'Alice', newEmail: 'alice.new@example.com', verifyUrl: 'https://app.com/verify?token=abc',
  })),
  EmailVerification: renderEmail(EmailVerification.component({
    name: 'Alice', verifyUrl: 'https://app.com/verify?token=xyz',
  })),
  ExportReady: renderEmail(ExportReady.component({
    name: 'Alice', exportName: 'users.csv', downloadUrl: 'https://app.com/downloads/abc', expiresInHours: 48,
  })),
  FeatureAnnouncement: renderEmail(FeatureAnnouncement.component({
    name: 'Alice', featureName: 'AI Suggestions', description: 'Smarter autocomplete.',
    ctaUrl: 'https://app.com/features/ai',
    changes: [{ type: 'new', title: 'AI Suggestions', description: 'Autocomplete.' }],
  })),
  Invoice: renderEmail(Invoice.component({
    customerName: 'ACME Corp', invoiceNumber: 'INV-001',
    items: [{ name: 'Pro Plan', price: 99.99 }, { name: 'Support', price: 29.99, quantity: 2 }],
    subtotal: 159.97, tax: 15.99, total: 175.96,
  })),
  LoginActivity: renderEmail(LoginActivity.component({
    name: 'Alice',
    events: [
      { timestamp: 'June 16, 2026', location: 'Berlin', device: 'Chrome', status: 'success' },
      { timestamp: 'June 15, 2026', location: 'Unknown', device: 'Firefox', status: 'failed' },
    ],
    securityUrl: 'https://app.com/security',
  })),
  MagicLink: renderEmail(MagicLink.component({
    email: 'user@example.com', loginUrl: 'https://app.com/auth?token=magic',
  })),
  MaintenanceNotification_scheduled: renderEmail(MaintenanceNotification.component({
    type: 'scheduled', startTime: 'June 20, 2026 at 02:00 UTC',
    endTime: 'June 20, 2026 at 04:00 UTC', duration: '2 hours',
    statusPageUrl: 'https://status.app.com',
  })),
  MaintenanceNotification_started: renderEmail(MaintenanceNotification.component({
    type: 'started', affectedServices: ['API', 'Dashboard'], impact: 'partial',
    statusPageUrl: 'https://status.app.com',
  })),
  MaintenanceNotification_completed: renderEmail(MaintenanceNotification.component({
    type: 'completed',
  })),
  NewsletterConfirmation: renderEmail(NewsletterConfirmation.component({
    email: 'alice@example.com', confirmUrl: 'https://app.com/confirm?token=abc', listName: 'Acme Weekly',
  })),
  Notification_simple: renderEmail(Notification.component({
    title: 'System alert', body: 'Something happened.',
  })),
  Notification_withCta: renderEmail(Notification.component({
    title: 'Alert', body: 'Details', ctaLabel: 'View', ctaUrl: 'https://app.com',
  })),
  OnboardingProgress: renderEmail(OnboardingProgress.component({
    name: 'Alice', dashboardUrl: 'https://app.com/dashboard',
    steps: [
      { title: 'Create account', completed: true },
      { title: 'Add team members', completed: false },
    ],
  })),
  OrderConfirmation: renderEmail(OrderConfirmation.component({
    name: 'Alice', orderNumber: 'ORD-42', orderUrl: 'https://app.com/orders/42',
    items: [{ name: 'Widget', quantity: 2, price: 9.99 }],
  })),
  PasswordChangedConfirmation: renderEmail(PasswordChangedConfirmation.component({
    name: 'Alice', securityUrl: 'https://app.com/security',
    timestamp: 'June 16, 2026', ipAddress: '1.2.3.4',
  })),
  PasswordReset: renderEmail(PasswordReset.component({
    username: 'alice', resetUrl: 'https://app.com/reset?token=abc',
  })),
  PasswordlessOtp: renderEmail(PasswordlessOtp.component({ code: '847 293' })),
  PaymentFailed: renderEmail(PaymentFailed.component({
    name: 'Alice', updateUrl: 'https://app.com/billing',
    amount: '$49.99', failureReason: 'Insufficient funds',
  })),
  PhoneVerification: renderEmail(PhoneVerification.component({
    name: 'Alice', phone: '+49 170 1234567', code: '847 293',
  })),
  PolicyUpdate: renderEmail(PolicyUpdate.component({
    policyType: 'privacy', effectiveDate: 'July 1, 2026', policyUrl: 'https://app.com/privacy',
    changes: [{ title: 'Data retention', description: 'We now retain data for 1 year.' }],
  })),
  ProfileUpdated: renderEmail(ProfileUpdated.component({
    name: 'Alice',
    changes: [{ field: 'Display name', oldValue: 'Alice S.', newValue: 'Alice Smith' }],
    accountUrl: 'https://app.com/account',
  })),
  Referral_invite: renderEmail(Referral.component({
    name: 'Alice', event: 'invite', referrerName: 'Bob',
    actionUrl: 'https://app.com/join?ref=BOB20', referralCode: 'BOB20', reward: '$20 off',
  })),
  Referral_joined: renderEmail(Referral.component({
    name: 'Bob', event: 'joined', refereeName: 'Alice',
    actionUrl: 'https://app.com/dashboard',
  })),
  RefundConfirmation: renderEmail(RefundConfirmation.component({
    name: 'Alice', refundAmount: '$129.98', refundId: 'ref_abc123',
    paymentMethod: 'Visa ending in 4242',
  })),
  RegistrationConfirmation: renderEmail(RegistrationConfirmation.component({
    name: 'Alice', dashboardUrl: 'https://app.com/dashboard', email: 'alice@example.com',
  })),
  ReviewRequest: renderEmail(ReviewRequest.component({
    name: 'Alice', reviewUrl: 'https://g.page/r/review', productOrService: 'Pro Plan',
  })),
  SecurityAlert_newLogin: renderEmail(SecurityAlert.component({
    name: 'Alice', event: 'new_login', reviewUrl: 'https://app.com/security',
  })),
  SecurityAlert_suspicious: renderEmail(SecurityAlert.component({
    name: 'Alice', event: 'suspicious_activity', reviewUrl: 'https://app.com/security',
  })),
  ShippingUpdate: renderEmail(ShippingUpdate.component({
    name: 'Bob', orderNumber: 'ORD-99', status: 'shipped',
    trackingUrl: 'https://track.example.com/TRK123',
  })),
  Subscription_started: renderEmail(Subscription.component({
    name: 'Alice', event: 'started', planName: 'Pro', actionUrl: 'https://app.com/dashboard',
  })),
  Subscription_trialEnding: renderEmail(Subscription.component({
    name: 'Alice', event: 'trial_ending', planName: 'Pro',
    actionUrl: 'https://app.com/upgrade', trialDaysRemaining: 3,
  })),
  SupportTicket_created: renderEmail(SupportTicket.component({
    name: 'Alice', event: 'created', ticketId: 'TKT-1042',
    ticketTitle: 'Login not working', ticketUrl: 'https://support.app.com/tickets/1042',
  })),
  SupportTicket_resolved: renderEmail(SupportTicket.component({
    name: 'Alice', event: 'resolved', ticketId: 'TKT-1042',
    ticketTitle: 'Login not working', ticketUrl: 'https://support.app.com/tickets/1042',
    agentMessage: 'Issue fixed in v2.3.', agentName: 'Support Team',
  })),
  TeamInvite: renderEmail(TeamInvite.component({
    inviterName: 'Bob', teamName: 'Acme Engineering', inviteUrl: 'https://app.com/invite/xyz',
  })),
  TwoFactorAuth: renderEmail(TwoFactorAuth.component({ username: 'alice', code: '123456' })),
  UsageAlert: renderEmail(UsageAlert.component({
    name: 'Alice', resource: 'API calls', used: 8500, limit: 10000,
    unit: 'calls', percentUsed: 85, severity: 'warning', upgradeUrl: 'https://app.com/upgrade',
  })),
  WeeklyDigest: renderEmail(WeeklyDigest.component({
    name: 'Alice', weekOf: 'June 9–15, 2026', dashboardUrl: 'https://app.com/dashboard',
    stats: [{ label: 'Emails sent', value: '1,204', change: '+12%', positive: true }],
    items: [{ title: 'Top article', url: 'https://blog.app.com/top', category: 'Blog' }],
  })),
  Welcome: renderEmail(Welcome.component({ name: 'Alice', loginUrl: 'https://app.com' })),
  WinBack: renderEmail(WinBack.component({
    name: 'Alice', returnUrl: 'https://app.com/login', daysSince: 30, offer: '20% off for 3 months',
  })),
};

// ─── CLI output ───────────────────────────────────────────────────────────────

const WCAG_AA = 4.5;
const CARD_BG = '#ffffff';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const filter = process.argv[2]?.toLowerCase();

let totalTemplates = 0;
let passedTemplates = 0;
let totalFailures = 0;

for (const [name, html] of Object.entries(templates)) {
  if (filter && !name.toLowerCase().includes(filter)) continue;
  totalTemplates++;

  const colors = extractInlineTextColors(html);
  const failures: Array<{ color: string; ratio: number }> = [];

  for (const color of colors) {
    const ratio = contrastRatio(color, CARD_BG);
    if (ratio < WCAG_AA) failures.push({ color, ratio });
  }

  if (failures.length === 0) {
    passedTemplates++;
    const ratios = [...colors].map((c) => contrastRatio(c, CARD_BG).toFixed(1));
    const min = Math.min(...[...colors].map((c) => contrastRatio(c, CARD_BG)));
    console.log(`${GREEN}✓${RESET} ${name.padEnd(42)} ${DIM}min ${min.toFixed(1)}:1${RESET}`);
  } else {
    totalFailures += failures.length;
    console.log(`${RED}✗${RESET} ${BOLD}${name}${RESET}`);
    for (const { color, ratio } of failures) {
      console.log(`    ${RED}${color}${RESET}  ${ratio.toFixed(2)}:1  ${YELLOW}(need ${WCAG_AA}:1)${RESET}`);
    }
  }
}

console.log('');
console.log(`${DIM}──────────────────────────────────────────────────────${RESET}`);

if (totalFailures === 0) {
  console.log(`${GREEN}${BOLD}All ${totalTemplates} templates pass WCAG AA (${WCAG_AA}:1)${RESET}`);
} else {
  console.log(`${RED}${BOLD}${totalFailures} failure(s) across ${totalTemplates - passedTemplates} template(s)${RESET}`);
  process.exit(1);
}
