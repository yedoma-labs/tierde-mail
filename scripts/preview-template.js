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
} = await import(resolve(pkgDir, 'dist/templates/index.js'));

const templates = {
  Welcome,
  PasswordReset,
  EmailVerification,
  TwoFactorAuth,
  Invoice,
  MagicLink,
  Notification,
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
};

await mockMailer.send(template, {
  to: 'preview@example.com',
  props: sampleProps[templateName] || {},
});
