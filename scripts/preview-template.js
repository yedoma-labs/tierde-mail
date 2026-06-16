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
};

const template = templates[templateName];
if (!template) {
  console.error(
    `Template "${templateName}" not found. Available: ${Object.keys(templates).join(', ')}`
  );
  process.exit(1);
}

// Mock mailer to render template
const mockMailer = createMailer({
  provider: {
    name: 'mock',
    async send(message) {
      const htmlFile = resolve(
        pkgDir,
        'preview',
        `${templateName}.html`
      );

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
    items: [
      { description: 'Professional Services', quantity: 10, price: 100, total: 1000 },
    ],
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
      { title: 'Add a sending domain', description: 'Set up SPF, DKIM, and DMARC for best deliverability.', completed: true },
      { title: 'Send your first email', description: 'Try the API or pick a template.', completed: false, url: 'https://example.com/send' },
      { title: 'Invite your team', completed: false, url: 'https://example.com/team' },
    ],
  },
  CommentMention: {
    name: 'Alice Smith',
    event: 'mention',
    actorName: 'Bob Johnson',
    contextName: 'Q3 Email Campaign',
    commentText: 'Hey @alice can you review the subject line for this one? I think it might need a tweak.',
    commentUrl: 'https://example.com/projects/123#comment-456',
    appName: 'Acme',
  },
};

await mockMailer.send(template, {
  to: 'preview@example.com',
  props: sampleProps[templateName] || {},
});
