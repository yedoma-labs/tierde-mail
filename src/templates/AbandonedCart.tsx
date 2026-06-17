import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
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

export interface AbandonedCartStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  ctaLabel: string;
  urgencyNote: string;
  footer: (year: string, appName: string) => string;
}

export const ABANDONED_CART_STRINGS: AbandonedCartStrings = {
  subject: (appName) => `You left something behind — ${appName}`,
  heading: 'Your cart is waiting',
  greeting: (name) => `Hi ${name},`,
  body: "You left some items in your cart. Complete your purchase before they sell out.",
  ctaLabel: 'Complete Your Purchase',
  urgencyNote: 'Items in your cart are not reserved and may sell out.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface CartItem {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  imageUrl?: string;
}

export interface AbandonedCartProps extends BaseTemplateProps<AbandonedCartStrings> {
  name: string;
  cartUrl: string;
  items: CartItem[];
  currency?: string;
}

function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale ?? 'en-US', { style: 'currency', currency }).format(amount);
}

export const AbandonedCart: EmailTemplateType<AbandonedCartProps> = defineEmail<AbandonedCartProps>({
  subject: ({ appName = 'Our Store', strings }) => {
    const s = { ...ABANDONED_CART_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    cartUrl,
    items,
    currency = 'USD',
    appName = 'Our Store',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...ABANDONED_CART_STRINGS, ...strings };
    const t = { ...defaultTheme, ...theme };
    const year = currentYear(locale);
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    const itemRowStyle: CSSProperties = {
      padding: '12px 0',
      borderBottom: `1px solid ${t.borderSubtle}`,
    };

    const itemNameStyle: CSSProperties = {
      fontWeight: '600',
      color: t.textPrimary,
      fontSize: '14px',
      margin: '0 0 2px',
    };

    const itemDescStyle: CSSProperties = {
      color: t.textMuted,
      fontSize: '12px',
      margin: 0,
    };

    const itemPriceStyle: CSSProperties = {
      fontWeight: '700',
      color: t.textPrimary,
      fontSize: '14px',
      textAlign: 'right',
      whiteSpace: 'nowrap',
    };

    return (
      <EmailTemplate
        preview={s.subject(appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={itemRowStyle}>
                    <p style={itemNameStyle}>{item.name}{item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''}</p>
                    {item.description && <p style={itemDescStyle}>{item.description}</p>}
                  </td>
                  <td style={{ ...itemRowStyle, ...itemPriceStyle }}>
                    {formatCurrency(item.price * (item.quantity ?? 1), currency, locale)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '14px 0 0', fontWeight: '700', fontSize: '16px', color: t.textPrimary }}>
                  Total
                </td>
                <td style={{ padding: '14px 0 0', fontWeight: '700', fontSize: '16px', color: t.textPrimary, textAlign: 'right' }}>
                  {formatCurrency(total, currency, locale)}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Button href={cartUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.urgencyNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
