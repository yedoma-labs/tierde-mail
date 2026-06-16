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
    /^import type \{ ([^}]+) \} from '(?:\.\.\/theme\.js|\.\.\/define-email\.js|\.\.\/components\/[^']+)';\n/gm,
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

function usage(): void {
  console.log(`
tierde — email template CLI

Commands:
  eject --template <name> <output-path>   Copy a built-in template to your project

Available templates:
  ${Object.keys(TEMPLATES).join('\n  ')}

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
