import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// Template sources embedded at build time via Vite's ?raw imports.
// No file-system access needed at runtime — works correctly when installed from npm.
import WelcomeRaw from '../src/templates/Welcome.tsx?raw';
import PasswordResetRaw from '../src/templates/PasswordReset.tsx?raw';
import EmailVerificationRaw from '../src/templates/EmailVerification.tsx?raw';
import TwoFactorAuthRaw from '../src/templates/TwoFactorAuth.tsx?raw';
import InvoiceRaw from '../src/templates/Invoice.tsx?raw';
import MagicLinkRaw from '../src/templates/MagicLink.tsx?raw';
import NotificationRaw from '../src/templates/Notification.tsx?raw';
import OrderConfirmationRaw from '../src/templates/OrderConfirmation.tsx?raw';
import ShippingUpdateRaw from '../src/templates/ShippingUpdate.tsx?raw';
import TeamInviteRaw from '../src/templates/TeamInvite.tsx?raw';
import PaymentFailedRaw from '../src/templates/PaymentFailed.tsx?raw';
import SubscriptionRaw from '../src/templates/Subscription.tsx?raw';
import AccountDeactivatedRaw from '../src/templates/AccountDeactivated.tsx?raw';
import PasswordlessOtpRaw from '../src/templates/PasswordlessOtp.tsx?raw';
import AbandonedCartRaw from '../src/templates/AbandonedCart.tsx?raw';
import SecurityAlertRaw from '../src/templates/SecurityAlert.tsx?raw';
import ReviewRequestRaw from '../src/templates/ReviewRequest.tsx?raw';
import PolicyUpdateRaw from '../src/templates/PolicyUpdate.tsx?raw';
import WeeklyDigestRaw from '../src/templates/WeeklyDigest.tsx?raw';
import OnboardingProgressRaw from '../src/templates/OnboardingProgress.tsx?raw';
import CommentMentionRaw from '../src/templates/CommentMention.tsx?raw';
import RefundConfirmationRaw from '../src/templates/RefundConfirmation.tsx?raw';
import UsageAlertRaw from '../src/templates/UsageAlert.tsx?raw';
import BackInStockRaw from '../src/templates/BackInStock.tsx?raw';
import MaintenanceNotificationRaw from '../src/templates/MaintenanceNotification.tsx?raw';
import ExportReadyRaw from '../src/templates/ExportReady.tsx?raw';
import WinBackRaw from '../src/templates/WinBack.tsx?raw';
import SupportTicketRaw from '../src/templates/SupportTicket.tsx?raw';
import ReferralRaw from '../src/templates/Referral.tsx?raw';
import FeatureAnnouncementRaw from '../src/templates/FeatureAnnouncement.tsx?raw';
import AccountLockedRaw from '../src/templates/AccountLocked.tsx?raw';
import AccountUnlockedRaw from '../src/templates/AccountUnlocked.tsx?raw';
import RegistrationConfirmationRaw from '../src/templates/RegistrationConfirmation.tsx?raw';
import EmailChangeVerificationRaw from '../src/templates/EmailChangeVerification.tsx?raw';
import PhoneVerificationRaw from '../src/templates/PhoneVerification.tsx?raw';
import ProfileUpdatedRaw from '../src/templates/ProfileUpdated.tsx?raw';
import PasswordChangedConfirmationRaw from '../src/templates/PasswordChangedConfirmation.tsx?raw';
import LoginActivityRaw from '../src/templates/LoginActivity.tsx?raw';
import DataExportRequestRaw from '../src/templates/DataExportRequest.tsx?raw';
import AccountDeletionConfirmationRaw from '../src/templates/AccountDeletionConfirmation.tsx?raw';
import NewsletterConfirmationRaw from '../src/templates/NewsletterConfirmation.tsx?raw';

const TEMPLATES: Record<string, string> = {
  welcome: WelcomeRaw,
  'password-reset': PasswordResetRaw,
  'email-verification': EmailVerificationRaw,
  'two-factor-auth': TwoFactorAuthRaw,
  invoice: InvoiceRaw,
  'magic-link': MagicLinkRaw,
  notification: NotificationRaw,
  'order-confirmation': OrderConfirmationRaw,
  'shipping-update': ShippingUpdateRaw,
  'team-invite': TeamInviteRaw,
  'payment-failed': PaymentFailedRaw,
  subscription: SubscriptionRaw,
  'account-deactivated': AccountDeactivatedRaw,
  'passwordless-otp': PasswordlessOtpRaw,
  'abandoned-cart': AbandonedCartRaw,
  'security-alert': SecurityAlertRaw,
  'review-request': ReviewRequestRaw,
  'policy-update': PolicyUpdateRaw,
  'weekly-digest': WeeklyDigestRaw,
  'onboarding-progress': OnboardingProgressRaw,
  'comment-mention': CommentMentionRaw,
  'refund-confirmation': RefundConfirmationRaw,
  'usage-alert': UsageAlertRaw,
  'back-in-stock': BackInStockRaw,
  'maintenance-notification': MaintenanceNotificationRaw,
  'export-ready': ExportReadyRaw,
  'win-back': WinBackRaw,
  'support-ticket': SupportTicketRaw,
  referral: ReferralRaw,
  'feature-announcement': FeatureAnnouncementRaw,
  'account-locked': AccountLockedRaw,
  'account-unlocked': AccountUnlockedRaw,
  'registration-confirmation': RegistrationConfirmationRaw,
  'email-change-verification': EmailChangeVerificationRaw,
  'phone-verification': PhoneVerificationRaw,
  'profile-updated': ProfileUpdatedRaw,
  'password-changed-confirmation': PasswordChangedConfirmationRaw,
  'login-activity': LoginActivityRaw,
  'data-export-request': DataExportRequestRaw,
  'account-deletion-confirmation': AccountDeletionConfirmationRaw,
  'newsletter-confirmation': NewsletterConfirmationRaw,
};

/**
 * Rewrites internal library imports to point at the published package,
 * and replaces the currentYear() helper with an inline implementation
 * so ejected templates have zero internal dependencies.
 */
function rewriteImports(source: string): string {
  // Remove utils import — we inline currentYear below
  let result = source.replace(/^import \{ currentYear \} from '\.\/utils\.js';\n/m, '');

  // Inline currentYear — year is locale-independent so no deps needed
  result = result.replace(
    /const year = currentYear\([^)]*\);/g,
    'const year = new Date().getFullYear().toString();',
  );

  // Collect all named imports from internal paths that map to the published package,
  // then replace all individual import lines with a single consolidated import.
  const names: string[] = [];
  result = result.replace(
    /^import \{ ([^}]+) \} from '(?:\.\.\/define-email\.js|\.\.\/components\/[^']+|\.\.\/theme\.js)';\n/gm,
    (_, captured: string) => {
      names.push(...captured.split(',').map((s: string) => s.trim()));
      return '';
    },
  );

  // Collect type-only imports from internal paths and consolidate into a single type import
  const typeNames: string[] = [];
  result = result.replace(
    /^import type \{ ([^}]+) \} from '(?:\.\.\/theme\.js|\.\.\/define-email\.js|\.\.\/components\/[^']+|\.\/shared\.js)';\n/gm,
    (_, captured: string) => {
      typeNames.push(...captured.split(',').map((s: string) => s.trim()));
      return '';
    },
  );

  if (typeNames.length > 0) {
    const uniqueTypes = [...new Set(typeNames)];
    result = `import type { ${uniqueTypes.join(', ')} } from '@yedoma-labs/tierde-mail';\n` + result;
  }

  if (names.length > 0) {
    const unique = [...new Set(names)];
    result = `import { ${unique.join(', ')} } from '@yedoma-labs/tierde-mail';\n` + result;
  }

  return result;
}

function toPascalCase(kebab: string): string {
  return kebab.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function usage(): void {
  console.log(`
tierde — email template CLI

Commands:
  eject --template <name> <output-path>   Copy one template to your project
  eject --all <output-dir>                Copy all templates to a directory
  eject --list                            Print all available template names

Examples:
  npx tierde eject --template password-reset ./emails/PasswordReset.tsx
  npx tierde eject --all ./emails
  npx tierde eject --list

Available templates:
  ${Object.keys(TEMPLATES).join('\n  ')}
`);
}

function eject(args: string[]): void {
  // --list: print all template names and exit
  if (args.includes('--list')) {
    Object.keys(TEMPLATES).forEach((name) => console.log(name));
    return;
  }

  // --all <output-dir>: eject every template into a directory
  if (args.includes('--all')) {
    const allIdx = args.indexOf('--all');
    const outputDir = args[allIdx + 1];
    if (!outputDir) {
      console.error('Error: output directory is required after --all');
      process.exit(1);
    }
    const resolvedDir = resolve(process.cwd(), outputDir);
    for (const [name, raw] of Object.entries(TEMPLATES)) {
      const filename = `${toPascalCase(name)}.tsx`;
      const content = rewriteImports(raw);
      const resolvedOutput = resolve(resolvedDir, filename);
      mkdirSync(dirname(resolvedOutput), { recursive: true });
      writeFileSync(resolvedOutput, content, 'utf-8');
      console.log(`  ✓ ${name} → ${filename}`);
    }
    console.log(`\nEjected ${Object.keys(TEMPLATES).length} templates to ${resolvedDir}`);
    return;
  }

  // --template <name> <output-path>: eject a single template
  const templateIdx = args.indexOf('--template');
  if (templateIdx === -1 || !args[templateIdx + 1]) {
    console.error('Error: --template <name>, --all <dir>, or --list is required');
    process.exit(1);
  }

  const templateName = args[templateIdx + 1] as string;
  const outputPath = args[templateIdx + 2];

  if (!outputPath) {
    console.error('Error: output path is required');
    process.exit(1);
  }

  const raw = TEMPLATES[templateName];
  if (!raw) {
    console.error(`Error: unknown template "${templateName}"`);
    console.error(`Available: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  const content = rewriteImports(raw);
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
