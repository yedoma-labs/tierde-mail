import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type ShippingStatus = 'shipped' | 'out_for_delivery' | 'delivered' | 'delayed';

export interface ShippingUpdateStrings {
  subject: (status: ShippingStatus, orderNumber: string) => string;
  heading: (status: ShippingStatus) => string;
  greeting: (name: string) => string;
  body: (status: ShippingStatus, orderNumber: string) => string;
  estimatedDelivery: (date: string) => string;
  ctaLabel: string;
  footer: (year: string, appName: string) => string;
}

export const SHIPPING_UPDATE_STRINGS: ShippingUpdateStrings = {
  subject: (status, orderNumber) => {
    const labels: Record<ShippingStatus, string> = {
      shipped: `Your order #${orderNumber} has shipped`,
      out_for_delivery: `Your order #${orderNumber} is out for delivery`,
      delivered: `Your order #${orderNumber} has been delivered`,
      delayed: `Update on your order #${orderNumber}`,
    };
    return labels[status];
  },
  heading: (status) => {
    const labels: Record<ShippingStatus, string> = {
      shipped: 'Your order is on its way!',
      out_for_delivery: 'Out for delivery today',
      delivered: 'Your order has arrived',
      delayed: 'Shipping update',
    };
    return labels[status];
  },
  greeting: (name) => `Hi ${name},`,
  body: (status, orderNumber) => {
    const messages: Record<ShippingStatus, string> = {
      shipped: `Good news! Order #${orderNumber} has shipped and is on its way to you.`,
      out_for_delivery: `Order #${orderNumber} is out for delivery and should arrive today.`,
      delivered: `Order #${orderNumber} has been delivered. We hope you love it!`,
      delayed: `We wanted to let you know that order #${orderNumber} is experiencing a slight delay. We apologize for any inconvenience.`,
    };
    return messages[status];
  },
  estimatedDelivery: (date) => `Estimated delivery: ${date}`,
  ctaLabel: 'Track Your Order',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ShippingUpdateProps extends BaseTemplateProps<ShippingUpdateStrings> {
  name: string;
  orderNumber: string;
  status: ShippingStatus;
  trackingUrl: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

const infoRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

const labelStyle: CSSProperties = {
  color: '#6b7280',
  fontWeight: '500',
};

const valueStyle: CSSProperties = {
  color: '#374151',
  fontWeight: '600',
};

export const ShippingUpdate: EmailTemplateType<ShippingUpdateProps> = defineEmail<ShippingUpdateProps>({
  subject: ({ status, orderNumber, strings }) => {
    const s = { ...SHIPPING_UPDATE_STRINGS, ...strings };
    return s.subject(status, orderNumber);
  },
  component: ({
    name,
    orderNumber,
    status,
    trackingUrl,
    trackingNumber,
    carrier,
    estimatedDelivery,
    appName = 'Our Store',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...SHIPPING_UPDATE_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(status, orderNumber)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(status)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(status, orderNumber)}</Text>
        {(trackingNumber || carrier || estimatedDelivery) && (
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
              <tbody>
                {carrier && (
                  <tr>
                    <td style={{ ...infoRowStyle, display: 'table-cell', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={labelStyle}>Carrier</span>
                    </td>
                    <td style={{ ...infoRowStyle, display: 'table-cell', padding: '10px 0', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={valueStyle}>{carrier}</span>
                    </td>
                  </tr>
                )}
                {trackingNumber && (
                  <tr>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={labelStyle}>Tracking #</span>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={valueStyle}>{trackingNumber}</span>
                    </td>
                  </tr>
                )}
                {estimatedDelivery && (
                  <tr>
                    <td style={{ padding: '10px 0' }}>
                      <span style={labelStyle}>Est. Delivery</span>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <span style={valueStyle}>{estimatedDelivery}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        )}
        <Button href={trackingUrl}>{s.ctaLabel}</Button>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
