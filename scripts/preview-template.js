#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, '..');

const templateName = process.argv[2];
if (!templateName) {
  console.error('Usage: node scripts/preview-template.js <template-name>');
  console.error('Example: node scripts/preview-template.js Welcome');
  process.exit(1);
}

// Import built modules
const { createMailer } = await import(resolve(pkgDir, 'dist/index.js'));
const {
  Welcome,
  PasswordReset,
  EmailVerification,
  TwoFactorAuth,
  Invoice,
  MagicLink,
  Notification,
  OrderConfirmation,
  ShippingUpdate,
  TeamInvite,
  PaymentFailed,
  Subscription,
  AccountDeactivated,
  PasswordlessOtp,
  AbandonedCart,
  SecurityAlert,
  ReviewRequest,
  PolicyUpdate,
  WeeklyDigest,
  OnboardingProgress,
  CommentMention,
  RefundConfirmation,
  UsageAlert,
  BackInStock,
  MaintenanceNotification,
  ExportReady,
  WinBack,
  SupportTicket,
  Referral,
  FeatureAnnouncement,
  AccountLocked,
  AccountUnlocked,
  RegistrationConfirmation,
  EmailChangeVerification,
  PhoneVerification,
  ProfileUpdated,
  PasswordChangedConfirmation,
  LoginActivity,
  DataExportRequest,
  AccountDeletionConfirmation,
  NewsletterConfirmation,
} = await import(resolve(pkgDir, 'dist/templates/index.js'));

const templates = {
  Welcome,
  PasswordReset,
  EmailVerification,
  TwoFactorAuth,
  Invoice,
  MagicLink,
  Notification,
  OrderConfirmation,
  AccountUnlocked,
  RegistrationConfirmation,
  EmailChangeVerification,
  PhoneVerification,
  ProfileUpdated,
  PasswordChangedConfirmation,
  LoginActivity,
  DataExportRequest,
  AccountDeletionConfirmation,
  NewsletterConfirmation,
  ShippingUpdate,
  TeamInvite,
  PaymentFailed,
  Subscription,
  AccountDeactivated,
  PasswordlessOtp,
  AbandonedCart,
  SecurityAlert,
  ReviewRequest,
  PolicyUpdate,
  WeeklyDigest,
  OnboardingProgress,
  CommentMention,
  RefundConfirmation,
  UsageAlert,
  BackInStock,
  MaintenanceNotification,
  ExportReady,
  WinBack,
  SupportTicket,
  Referral,
  FeatureAnnouncement,
  AccountLocked,
};

const template = templates[templateName];
if (!template) {
  console.error(
    `Template "${templateName}" not found. Available: ${Object.keys(templates).join(', ')}`,
  );
  process.exit(1);
}

// Mock mailer to render template
const mockMailer = createMailer({
  provider: {
    name: 'mock',
    async send(message) {
      const htmlFile = resolve(pkgDir, 'preview', `${templateName}.html`);

      // Write HTML with auto-refresh meta tag for browser
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName} Template Preview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f5f5f5;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .preview {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    iframe {
      width: 100%;
      height: 600px;
      border: none;
      display: block;
    }
    .meta {
      background: white;
      border-top: 1px solid #eee;
      padding: 16px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${templateName} Template</h1>
    <div class="preview">
      <iframe srcdoc="${message.html.replace(/"/g, '&quot;')}"></iframe>
    </div>
    <div class="meta">
      <p><strong>To:</strong> ${message.to.join(', ')}</p>
      <p><strong>Subject:</strong> ${message.subject}</p>
      <p><em>Open in browser to view the rendered email.</em></p>
    </div>
  </div>
</body>
</html>`;

      const dir = dirname(htmlFile);
      if (!existsSync(dir)) {
        const fs = await import('node:fs/promises');
        await fs.mkdir(dir, { recursive: true });
      }

      writeFileSync(htmlFile, html);
      console.log(`Preview written to: ${htmlFile}`);
      console.log(`Open in browser: file://${htmlFile}`);

      return { messageId: 'preview', provider: 'preview' };
    },
  },
  from: 'noreply@example.com',
});

// Render template with sample data
const sampleProps = {
  Welcome: {
    name: 'Alice Smith',
    loginUrl: 'https://example.com/login',
    appName: 'Acme',
    supportEmail: 'support@example.com',
  },
  PasswordReset: {
    username: 'alice',
    resetUrl: 'https://example.com/reset?token=xyz',
  },
  EmailVerification: {
    name: 'Alice Smith',
    verifyUrl: 'https://example.com/verify?token=abc',
  },
  TwoFactorAuth: {
    username: 'alice',
    code: '123456',
  },
  Invoice: {
    customerName: 'Alice Smith',
    invoiceNumber: 'INV-2024-001',
    items: [{ description: 'Professional Services', quantity: 10, price: 100, total: 1000 }],
    subtotal: 1000,
    tax: 100,
    total: 1100,
  },
  MagicLink: {
    email: 'alice@example.com',
    loginUrl: 'https://example.com/login?magic=token123',
  },
  Notification: {
    title: 'Important Alert',
    body: 'Your password was changed successfully.',
  },
  OrderConfirmation: {
    name: 'Alice Smith',
    orderNumber: 'ORD-2024-001',
    orderUrl: 'https://example.com/orders/ORD-2024-001',
    items: [
      { name: 'Wireless Headphones', quantity: 1, price: 99.99 },
      { name: 'Phone Case', description: 'Black, slim fit', quantity: 2, price: 14.99 },
    ],
  },
  ShippingUpdate: {
    name: 'Alice Smith',
    orderNumber: 'ORD-2024-001',
    status: 'shipped',
    trackingUrl: 'https://example.com/track/TRK123456',
    trackingNumber: 'TRK123456',
    carrier: 'FedEx',
    estimatedDelivery: 'Tuesday, June 18',
  },
  TeamInvite: {
    inviterName: 'Bob Johnson',
    teamName: 'Acme Engineering',
    inviteUrl: 'https://example.com/invite/abc123',
    role: 'Developer',
    expiresInHours: 72,
  },
  PaymentFailed: {
    name: 'Alice Smith',
    updateUrl: 'https://example.com/billing',
    amount: '$49.99',
    failureReason: 'Insufficient funds',
    retryInDays: 3,
    supportEmail: 'billing@example.com',
  },
  Subscription: {
    name: 'Alice Smith',
    event: 'upgraded',
    planName: 'Pro',
    actionUrl: 'https://example.com/dashboard',
    nextBillingDate: 'July 16, 2026',
  },
  AccountDeactivated: {
    name: 'Alice Smith',
    reactivateUrl: 'https://example.com/reactivate',
    reason: 'Requested by user',
    dataRetentionDays: 30,
    supportEmail: 'support@example.com',
  },
  PasswordlessOtp: {
    code: '847 293',
    expiresInMinutes: 10,
    appName: 'Acme',
  },
  AbandonedCart: {
    name: 'Alice Smith',
    cartUrl: 'https://example.com/cart',
    items: [
      { name: 'Merino Wool Sweater', description: 'Size M, Navy', price: 89.99, quantity: 1 },
      { name: 'Leather Belt', price: 34.99, quantity: 1 },
    ],
  },
  SecurityAlert: {
    name: 'Alice Smith',
    event: 'new_login',
    reviewUrl: 'https://example.com/security',
    ipAddress: '203.0.113.42',
    location: 'Berlin, Germany',
    device: 'Chrome on macOS',
    timestamp: 'June 16, 2026 at 14:32 UTC',
  },
  ReviewRequest: {
    name: 'Alice Smith',
    reviewUrl: 'https://example.com/review',
    productOrService: 'Acme Pro',
    appName: 'Acme',
  },
  PolicyUpdate: {
    policyType: 'privacy',
    effectiveDate: 'July 1, 2026',
    policyUrl: 'https://example.com/privacy',
    changes: [
      { section: 'Data Retention', summary: 'We now retain logs for 90 days instead of 180 days.' },
      { section: 'Third-Party Sharing', summary: 'Added clarity on analytics providers we use.' },
    ],
    supportEmail: 'privacy@example.com',
    appName: 'Acme',
  },
  WeeklyDigest: {
    name: 'Alice Smith',
    weekOf: 'June 9, 2026',
    dashboardUrl: 'https://example.com/dashboard',
    stats: [
      { label: 'Emails Sent', value: '1,248', change: '+12%', positive: true },
      { label: 'Open Rate', value: '38.4%', change: '+2.1%', positive: true },
      { label: 'Clicks', value: '247', change: '-4%', positive: false },
    ],
    items: [
      {
        title: 'New deliverability improvements',
        summary: 'SPF and DKIM alignment now validated automatically on every send.',
        url: 'https://example.com/changelog/1',
        category: 'Product',
        meta: 'June 12',
      },
      {
        title: 'Template library expanded',
        summary: '14 new ready-to-use templates added this week.',
        url: 'https://example.com/changelog/2',
        category: 'Product',
        meta: 'June 10',
      },
    ],
  },
  OnboardingProgress: {
    name: 'Alice Smith',
    dashboardUrl: 'https://example.com/setup',
    steps: [
      { title: 'Create your account', completed: true },
      { title: 'Verify your email address', completed: true },
      {
        title: 'Add a sending domain',
        description: 'Set up SPF, DKIM, and DMARC for best deliverability.',
        completed: true,
      },
      {
        title: 'Send your first email',
        description: 'Try the API or pick a template.',
        completed: false,
        url: 'https://example.com/send',
      },
      { title: 'Invite your team', completed: false, url: 'https://example.com/team' },
    ],
  },
  RefundConfirmation: {
    name: 'Alice Smith',
    refundAmount: '$129.98',
    refundId: 'ref_01HZXK8M9N2P3Q4R5S6T7U8V9',
    originalOrderId: 'ORD-2024-001',
    paymentMethod: 'Visa ending in 4242',
    processingDays: 5,
    supportEmail: 'support@example.com',
  },
  UsageAlert: {
    name: 'Alice Smith',
    resource: 'API Calls',
    used: '8,432',
    limit: '10,000',
    unit: '',
    percentUsed: 84,
    severity: 'warning',
    upgradeUrl: 'https://example.com/upgrade',
    resetDate: 'July 1, 2026',
    appName: 'Acme',
  },
  BackInStock: {
    name: 'Alice Smith',
    productName: 'Merino Wool Crew Sweater — Navy / M',
    productUrl: 'https://example.com/products/merino-crew',
    price: '$89.99',
    variant: 'Size M, Navy',
    appName: 'Acme Store',
  },
  MaintenanceNotification: {
    type: 'scheduled',
    startTime: 'Saturday, June 21, 2026 at 02:00 UTC',
    endTime: 'Saturday, June 21, 2026 at 04:00 UTC',
    duration: '~2 hours',
    affectedServices: [
      { name: 'API', impact: 'full_outage' },
      { name: 'Dashboard', impact: 'partial_outage' },
      { name: 'Email Sending', impact: 'degraded' },
    ],
    statusPageUrl: 'https://status.example.com',
    appName: 'Acme',
  },
  ExportReady: {
    name: 'Alice Smith',
    exportName: 'Contacts',
    downloadUrl: 'https://example.com/exports/download/xyz123',
    fileFormat: 'CSV',
    rowCount: 12847,
    fileSize: '4.2 MB',
    expiresInHours: 24,
    appName: 'Acme',
  },
  WinBack: {
    name: 'Alice Smith',
    returnUrl: 'https://example.com/login',
    daysSince: 45,
    offer: 'Come back and get 20% off your next month — use code COMEBACK20.',
    unsubscribeUrl: 'https://example.com/unsubscribe',
    appName: 'Acme',
  },
  SupportTicket: {
    name: 'Alice Smith',
    event: 'updated',
    ticketId: 'SUP-1042',
    ticketTitle: 'Emails not delivering to Gmail',
    ticketUrl: 'https://example.com/support/SUP-1042',
    agentName: 'Sarah from Support',
    agentMessage:
      "Hi Alice, I've investigated your issue and found that your SPF record is missing the Acme mail server. I've added instructions to your ticket. Please update the record and let us know if that resolves it.",
    priority: 'high',
    appName: 'Acme',
  },
  Referral: {
    name: 'Bob Johnson',
    event: 'invite',
    referrerName: 'Alice Smith',
    actionUrl: 'https://example.com/signup?ref=ALICE123',
    referralCode: 'ALICE123',
    reward: '1 month free',
    appName: 'Acme',
  },
  FeatureAnnouncement: {
    name: 'Alice Smith',
    featureName: 'Dark Mode Support',
    description:
      "All your emails now automatically adapt to your recipients' system dark mode preference — no extra configuration needed.",
    ctaUrl: 'https://example.com/changelog',
    changes: [
      {
        type: 'new',
        title: 'Dark mode for all templates',
        description:
          'Automatic @media (prefers-color-scheme: dark) support across all 31 templates.',
      },
      {
        type: 'improvement',
        title: 'Faster rendering',
        description: 'CSS inlining is now 3x faster using our Rust-based engine.',
      },
      {
        type: 'fix',
        title: 'Outlook button border radius',
        description: 'Fixed rounded corners on buttons not rendering correctly in Outlook 2019.',
      },
    ],
    appName: 'Acme',
  },
  AccountLocked: {
    name: 'Alice Smith',
    reason: 'too_many_attempts',
    unlockUrl: 'https://example.com/unlock?token=abc123',
    ipAddress: '203.0.113.42',
    location: 'Berlin, Germany',
    timestamp: 'June 16, 2026 at 09:14 UTC',
    supportEmail: 'security@example.com',
    appName: 'Acme',
  },
  CommentMention: {
    name: 'Alice Smith',
    event: 'mention',
    actorName: 'Bob Johnson',
    contextName: 'Q3 Email Campaign',
    commentText:
      'Hey @alice can you review the subject line for this one? I think it might need a tweak.',
    commentUrl: 'https://example.com/projects/123#comment-456',
    appName: 'Acme',
  },
  AccountUnlocked: {
    name: 'Alice Smith',
    loginUrl: 'https://example.com/login',
    appName: 'Acme',
  },
  RegistrationConfirmation: {
    name: 'Alice Smith',
    dashboardUrl: 'https://example.com/dashboard',
    email: 'alice@example.com',
    appName: 'Acme',
  },
  EmailChangeVerification: {
    name: 'Alice Smith',
    newEmail: 'alice.new@example.com',
    verifyUrl: 'https://example.com/verify-email?token=abc123',
    expiresInMinutes: 60,
    appName: 'Acme',
  },
  PhoneVerification: {
    name: 'Alice Smith',
    phone: '+49 170 1234567',
    code: '847 293',
    expiresInMinutes: 10,
    appName: 'Acme',
  },
  ProfileUpdated: {
    name: 'Alice Smith',
    changes: [
      { field: 'Display name', oldValue: 'Alice S.', newValue: 'Alice Smith' },
      { field: 'Timezone', oldValue: 'UTC', newValue: 'Europe/Berlin' },
      { field: 'Language', newValue: 'English (UK)' },
    ],
    accountUrl: 'https://example.com/account',
    appName: 'Acme',
  },
  PasswordChangedConfirmation: {
    name: 'Alice Smith',
    securityUrl: 'https://example.com/account/security',
    timestamp: 'June 16, 2026 at 11:42 UTC',
    ipAddress: '203.0.113.42',
    location: 'Berlin, Germany',
    appName: 'Acme',
  },
  LoginActivity: {
    name: 'Alice Smith',
    events: [
      {
        timestamp: 'June 16, 2026 14:32 UTC',
        location: 'Berlin, Germany',
        device: 'Chrome on macOS',
        status: 'success',
      },
      {
        timestamp: 'June 15, 2026 09:11 UTC',
        location: 'Hamburg, Germany',
        device: 'Safari on iPhone',
        status: 'success',
      },
      {
        timestamp: 'June 14, 2026 22:45 UTC',
        location: 'Unknown',
        device: 'Firefox on Windows',
        status: 'failed',
      },
    ],
    securityUrl: 'https://example.com/account/security',
    appName: 'Acme',
  },
  DataExportRequest: {
    name: 'Alice Smith',
    event: 'ready',
    actionUrl: 'https://example.com/exports/download/xyz123',
    expiresInHours: 24,
    appName: 'Acme',
  },
  AccountDeletionConfirmation: {
    name: 'Alice Smith',
    event: 'scheduled',
    cancelUrl: 'https://example.com/account/cancel-deletion',
    deletionDate: 'July 16, 2026',
    dataRetentionDays: 30,
    appName: 'Acme',
  },
  NewsletterConfirmation: {
    email: 'alice@example.com',
    confirmUrl: 'https://example.com/newsletter/confirm?token=abc123',
    unsubscribeUrl: 'https://example.com/unsubscribe',
    listName: 'Acme Weekly',
    appName: 'Acme',
  },
};

await mockMailer.send(template, {
  to: 'preview@example.com',
  props: sampleProps[templateName] || {},
});
