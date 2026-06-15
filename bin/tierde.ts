#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUNDLED_TEMPLATES: Record<string, string> = {
  welcome: resolve(__dirname, '../src/templates/Welcome.tsx'),
  'password-reset': resolve(__dirname, '../src/templates/PasswordReset.tsx'),
  'email-verification': resolve(__dirname, '../src/templates/EmailVerification.tsx'),
  'two-factor-auth': resolve(__dirname, '../src/templates/TwoFactorAuth.tsx'),
  invoice: resolve(__dirname, '../src/templates/Invoice.tsx'),
  'magic-link': resolve(__dirname, '../src/templates/MagicLink.tsx'),
  notification: resolve(__dirname, '../src/templates/Notification.tsx'),
};

function usage(): void {
  console.log(`
tierde — email template CLI

Commands:
  eject --template <name> <output-path>   Copy a built-in template to your project

Available templates:
  ${Object.keys(BUNDLED_TEMPLATES).join('\n  ')}

Example:
  npx tierde eject --template password-reset ./emails/PasswordReset.tsx
`);
}

function eject(args: string[]): void {
  const templateIdx = args.indexOf('--template');
  if (templateIdx === -1 || !args[templateIdx + 1]) {
    console.error('Error: --template <name> is required');
    process.exit(1);
  }

  const templateName = args[templateIdx + 1] as string;
  const outputPath = args[templateIdx + 2];

  if (!outputPath) {
    console.error('Error: output path is required');
    process.exit(1);
  }

  const srcPath = BUNDLED_TEMPLATES[templateName];
  if (!srcPath) {
    console.error(`Error: unknown template "${templateName}"`);
    console.error(`Available: ${Object.keys(BUNDLED_TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  let content: string;
  try {
    content = readFileSync(srcPath, 'utf-8');
  } catch {
    console.error(`Error: could not read template from ${srcPath}`);
    process.exit(1);
  }

  // Rewrite the import to point to the published package
  content = content
    .replace(/from '\.\.\/define-email\.js'/g, "from '@yedoma-labs/tierde-mail'")
    .replace(/from '\.\.\/components\/(\w+)\.js'/g, "from '@yedoma-labs/tierde-mail'")
    .replace(/from '\.\.\/components\/index\.js'/g, "from '@yedoma-labs/tierde-mail'");

  const resolvedOutput = resolve(process.cwd(), outputPath);
  mkdirSync(dirname(resolvedOutput), { recursive: true });
  writeFileSync(resolvedOutput, content, 'utf-8');
  console.log(`Ejected template "${templateName}" to ${resolvedOutput}`);
}

const [, , command, ...rest] = process.argv;

switch (command) {
  case 'eject':
    eject(rest);
    break;
  default:
    usage();
    break;
}
