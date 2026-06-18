import type { CSSProperties } from 'react';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { PALETTE } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface GiftCardStrings {
  subject: (senderName: string, appName: string) => string;
  heading: (senderName: string) => string;
  greeting: (recipientName: string) => string;
  amountLabel: string;
  codeLabel: string;
  expiresNote: (expiresAt: string) => string;
  ctaLabel: string;
  termsNote: string;
  footer: (year: string, appName: string) => string;
}

export const GIFT_CARD_STRINGS: GiftCardStrings = {
  subject: (senderName, appName) => `${senderName} sent you a gift card for ${appName}`,
  heading: (senderName) => `You've received a gift card from ${senderName}!`,
  greeting: (recipientName) => `Hi ${recipientName},`,
  amountLabel: 'Gift card value',
  codeLabel: 'Your code',
  expiresNote: (expiresAt) => `Valid until ${expiresAt}`,
  ctaLabel: 'Redeem Now',
  termsNote: 'Gift cards cannot be combined with other offers and are non-refundable.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface GiftCardProps extends BaseTemplateProps<GiftCardStrings> {
  recipientName: string;
  senderName: string;
  amount: string;
  code: string;
  redeemUrl: string;
  message?: string;
  expiresAt?: string;
}

const codeBoxStyle: CSSProperties = {
  textAlign: 'center' as const,
  padding: '28px 24px',
  borderRadius: '10px',
  backgroundColor: PALETTE.trial.bg,
  margin: '8px 0',
};

const amountStyle: CSSProperties = {
  fontWeight: '800',
  fontSize: '42px',
  display: 'block',
  marginBottom: '12px',
  color: PALETTE.trial.text,
};

const codeLabelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: PALETTE.trial.text,
  opacity: 0.8,
  display: 'block',
  marginBottom: '6px',
};

const codeValueStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '26px',
  fontWeight: '700',
  letterSpacing: '0.2em',
  display: 'block',
  color: PALETTE.trial.text,
  marginBottom: '10px',
};

const expiresStyle: CSSProperties = {
  fontSize: '12px',
  color: PALETTE.trial.text,
  opacity: 0.7,
  display: 'block',
};

export const GiftCard: EmailTemplateType<GiftCardProps> = defineEmail<GiftCardProps>({
  subject: ({ senderName, appName = 'Our App', strings }) => {
    const s = { ...GIFT_CARD_STRINGS, ...strings };
    return s.subject(senderName, appName);
  },
  component: ({
    recipientName,
    senderName,
    amount,
    code,
    redeemUrl,
    message,
    expiresAt,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...GIFT_CARD_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate preview={s.subject(senderName, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(senderName)}</Heading>
        <Text>{s.greeting(recipientName)}</Text>
        {message && <Text>{message}</Text>}
        <Section>
          <div style={codeBoxStyle}>
            <span style={amountStyle}>{amount}</span>
            <span style={codeLabelStyle}>{s.codeLabel}</span>
            <span className="tierde-code" style={codeValueStyle}>
              {code}
            </span>
            {expiresAt && <span style={expiresStyle}>{s.expiresNote(expiresAt)}</span>}
          </div>
        </Section>
        <Button href={redeemUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.termsNote}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
