import type { CSSProperties } from 'react';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface OrderConfirmationStrings {
  subject: (orderNumber: string, appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  intro: (orderNumber: string) => string;
  colItem: string;
  colQty: string;
  colPrice: string;
  totalLabel: string;
  ctaLabel: string;
  footer: (year: string, appName: string) => string;
}

export const ORDER_CONFIRMATION_STRINGS: OrderConfirmationStrings = {
  subject: (orderNumber, appName) => `Order #${orderNumber} confirmed — ${appName}`,
  heading: 'Order confirmed!',
  greeting: (name) => `Hi ${name},`,
  intro: (orderNumber) =>
    `Thanks for your order! We've received order #${orderNumber} and are getting it ready.`,
  colItem: 'Item',
  colQty: 'Qty',
  colPrice: 'Price',
  totalLabel: 'Total',
  ctaLabel: 'View Order',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface OrderLineItem {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderConfirmationProps extends BaseTemplateProps<OrderConfirmationStrings> {
  name: string;
  orderNumber: string;
  items: OrderLineItem[];
  orderUrl: string;
  currency?: string;
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale ?? 'en-US', { style: 'currency', currency }).format(amount);
}

export const OrderConfirmation: EmailTemplateType<OrderConfirmationProps> =
  defineEmail<OrderConfirmationProps>({
    subject: ({ orderNumber, appName = 'Our Store', strings }) => {
      const s = { ...ORDER_CONFIRMATION_STRINGS, ...strings };
      return s.subject(orderNumber, appName);
    },
    component: ({
      name,
      orderNumber,
      items,
      orderUrl,
      currency = 'USD',
      appName = 'Our Store',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...ORDER_CONFIRMATION_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const thStyle: CSSProperties = {
        textAlign: 'left',
        padding: '8px 0',
        borderBottom: `2px solid ${t.border}`,
        color: t.textMuted,
        fontWeight: '600',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      };

      const tdStyle: CSSProperties = {
        padding: '12px 0',
        borderBottom: `1px solid ${t.borderSubtle}`,
        color: t.textSecondary,
        verticalAlign: 'top',
      };

      const totalRowStyle: CSSProperties = {
        ...tdStyle,
        fontWeight: '700',
        fontSize: '16px',
        borderBottom: 'none',
        borderTop: `2px solid ${t.border}`,
      };

      return (
        <EmailTemplate
          preview={s.subject(orderNumber, appName)}
          lang={locale}
          dir={dir}
          theme={theme}
        >
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>{s.intro(orderNumber)}</Text>
          <Section>
            <table style={tableStyle} cellPadding="0" cellSpacing="0">
              <thead>
                <tr>
                  <th style={thStyle}>{s.colItem}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{s.colQty}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{s.colPrice}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.name}>
                    <td style={tdStyle}>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <>
                          <br />
                          <span style={{ color: t.textMuted, fontSize: '12px' }}>
                            {item.description}
                          </span>
                        </>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {formatCurrency(item.price * item.quantity, currency, locale)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={totalRowStyle} colSpan={2}>
                    {s.totalLabel}
                  </td>
                  <td style={{ ...totalRowStyle, textAlign: 'right' }}>
                    {formatCurrency(total, currency, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
          <Button href={orderUrl}>{s.ctaLabel}</Button>
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });
