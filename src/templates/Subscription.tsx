import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { PALETTE } from '../theme.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type SubscriptionEvent = 'started' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'trial_started' | 'trial_ending';

export interface SubscriptionStrings {
  subject: (event: SubscriptionEvent, planName: string, appName: string) => string;
  heading: (event: SubscriptionEvent, planName: string) => string;
  greeting: (name: string) => string;
  body: (event: SubscriptionEvent, planName: string, nextBillingDate?: string) => string;
  ctaLabel: (event: SubscriptionEvent) => string;
  trialDaysNote: (days: number) => string;
  footer: (year: string, appName: string) => string;
}

export const SUBSCRIPTION_STRINGS: SubscriptionStrings = {
  subject: (event, planName, appName) => {
    const labels: Record<SubscriptionEvent, string> = {
      started: `Welcome to ${planName} — ${appName}`,
      upgraded: `You've upgraded to ${planName} — ${appName}`,
      downgraded: `Plan changed to ${planName} — ${appName}`,
      cancelled: `Your ${appName} subscription has been cancelled`,
      renewed: `Your ${planName} subscription has been renewed`,
      trial_started: `Your ${planName} trial has started — ${appName}`,
      trial_ending: `Your ${planName} trial is ending soon — ${appName}`,
    };
    return labels[event];
  },
  heading: (event, planName) => {
    const labels: Record<SubscriptionEvent, string> = {
      started: `You're now on ${planName}`,
      upgraded: `Upgraded to ${planName}`,
      downgraded: `Moved to ${planName}`,
      cancelled: 'Subscription cancelled',
      renewed: `${planName} renewed`,
      trial_started: `Your ${planName} trial has started`,
      trial_ending: 'Your trial is ending soon',
    };
    return labels[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event, planName, nextBillingDate) => {
    const messages: Record<SubscriptionEvent, string> = {
      started: `Thank you for subscribing to ${planName}! Your subscription is now active.`,
      upgraded: `You've successfully upgraded to ${planName}. Enjoy your new features!`,
      downgraded: `Your plan has been changed to ${planName}. The change will take effect at the end of your current billing period.`,
      cancelled: 'Your subscription has been cancelled. You can continue using the service until the end of your current billing period.',
      renewed: `Your ${planName} subscription has been renewed${nextBillingDate ? ` and your next billing date is ${nextBillingDate}` : ''}.`,
      trial_started: `Your ${planName} trial has started. Enjoy full access to all features during your trial period.`,
      trial_ending: `Your trial ends soon. Upgrade now to keep access to ${planName} features.`,
    };
    return messages[event];
  },
  ctaLabel: (event) => {
    const labels: Record<SubscriptionEvent, string> = {
      started: 'Get Started',
      upgraded: 'Explore Features',
      downgraded: 'View Plan',
      cancelled: 'Reactivate Subscription',
      renewed: 'View Account',
      trial_started: 'Start Exploring',
      trial_ending: 'Upgrade Now',
    };
    return labels[event];
  },
  trialDaysNote: (days) => `${days} days remaining in your trial.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface SubscriptionProps extends BaseTemplateProps<SubscriptionStrings> {
  name: string;
  event: SubscriptionEvent;
  planName: string;
  actionUrl: string;
  nextBillingDate?: string;
  trialDaysRemaining?: number;
}

const planBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.025em',
  textTransform: 'uppercase',
};

export const Subscription: EmailTemplateType<SubscriptionProps> = defineEmail<SubscriptionProps>({
  subject: ({ event, planName, appName = 'Our App', strings }) => {
    const s = { ...SUBSCRIPTION_STRINGS, ...strings };
    return s.subject(event, planName, appName);
  },
  component: ({
    name,
    event,
    planName,
    actionUrl,
    nextBillingDate,
    trialDaysRemaining,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...SUBSCRIPTION_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(event, planName, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(event, planName)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(event, planName, nextBillingDate)}</Text>
        {trialDaysRemaining !== undefined && event === 'trial_ending' && (
          <Section>
            <div style={{ ...planBadgeStyle, backgroundColor: PALETTE.trial.bg, color: PALETTE.trial.text }}>
              {s.trialDaysNote(trialDaysRemaining)}
            </div>
          </Section>
        )}
        <Button href={actionUrl}>{s.ctaLabel(event)}</Button>
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
