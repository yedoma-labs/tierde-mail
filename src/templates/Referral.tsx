import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type ReferralEvent = 'invite' | 'reminder' | 'reward_earned' | 'reward_credited';

export interface ReferralStrings {
  subject: (event: ReferralEvent, referrerName: string, appName: string) => string;
  heading: (event: ReferralEvent) => string;
  greeting: (name: string) => string;
  body: (event: ReferralEvent, referrerName: string, appName: string, reward?: string) => string;
  codeLine: (code: string) => string;
  ctaLabel: (event: ReferralEvent) => string;
  footer: (year: string, appName: string) => string;
}

export const REFERRAL_STRINGS: ReferralStrings = {
  subject: (event, referrerName, appName) => {
    const labels: Record<ReferralEvent, string> = {
      invite: `${referrerName} invited you to try ${appName}`,
      reminder: `Don't forget — ${referrerName} is waiting for you on ${appName}`,
      reward_earned: `You earned a reward on ${appName}!`,
      reward_credited: `Your referral reward has been credited — ${appName}`,
    };
    return labels[event];
  },
  heading: (event) => {
    const labels: Record<ReferralEvent, string> = {
      invite: "You've been invited!",
      reminder: 'Your invitation is waiting',
      reward_earned: 'You earned a reward!',
      reward_credited: 'Reward credited',
    };
    return labels[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event, referrerName, appName, reward) => {
    const messages: Record<ReferralEvent, string> = {
      invite: `${referrerName} thinks you'd love ${appName}${reward ? ` — and you'll both get ${reward} when you sign up` : ''}.`,
      reminder: `${referrerName} is still waiting for you to join ${appName}${reward ? `. Sign up now and you'll both earn ${reward}` : ''}.`,
      reward_earned: `Someone you referred just signed up for ${appName}${reward ? `. You've earned ${reward}` : ''}!`,
      reward_credited: `Your referral reward${reward ? ` of ${reward}` : ''} has been credited to your account.`,
    };
    return messages[event];
  },
  codeLine: (code) => `Use referral code: ${code}`,
  ctaLabel: (event) => {
    const labels: Record<ReferralEvent, string> = {
      invite: 'Accept Invitation',
      reminder: 'Join Now',
      reward_earned: 'View Rewards',
      reward_credited: 'View Account',
    };
    return labels[event];
  },
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ReferralProps {
  name: string;
  event: ReferralEvent;
  referrerName: string;
  actionUrl: string;
  referralCode?: string;
  reward?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<ReferralStrings>;
  theme?: Theme;
}

const codeBoxStyle: CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '2px dashed #cbd5e1',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
};

const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, "Cascadia Code", monospace',
  fontSize: '24px',
  fontWeight: '800',
  letterSpacing: '0.15em',
  color: '#4f46e5',
  display: 'block',
};

const codeLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: '4px',
  display: 'block',
};

export const Referral: EmailTemplateType<ReferralProps> = defineEmail<ReferralProps>({
  subject: ({ event, referrerName, appName = 'Our App', strings }) => {
    const s = { ...REFERRAL_STRINGS, ...strings };
    return s.subject(event, referrerName, appName);
  },
  component: ({
    name,
    event,
    referrerName,
    actionUrl,
    referralCode,
    reward,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...REFERRAL_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(event, referrerName, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(event)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(event, referrerName, appName, reward)}</Text>
        {referralCode && (
          <Section>
            <div style={codeBoxStyle}>
              <span style={codeStyle}>{referralCode}</span>
              <span style={codeLabelStyle}>{s.codeLine(referralCode).split(':')[0]}</span>
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
