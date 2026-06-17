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

export interface BackInStockStrings {
  subject: (productName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (productName: string) => string;
  urgencyNote: string;
  ctaLabel: string;
  footer: (year: string, appName: string) => string;
}

export const BACK_IN_STOCK_STRINGS: BackInStockStrings = {
  subject: (productName) => `${productName} is back in stock!`,
  heading: "It's back!",
  greeting: (name) => `Hi ${name},`,
  body: (productName) => `Great news — ${productName} is available again. Get it before it sells out.`,
  urgencyNote: 'Stock is limited. Order now to avoid missing out again.',
  ctaLabel: 'Shop Now',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface BackInStockProps extends BaseTemplateProps<BackInStockStrings> {
  name: string;
  productName: string;
  productUrl: string;
  productImageUrl?: string;
  price?: string;
  variant?: string;
}

export const BackInStock: EmailTemplateType<BackInStockProps> = defineEmail<BackInStockProps>({
  subject: ({ productName, strings }) => {
    const s = { ...BACK_IN_STOCK_STRINGS, ...strings };
    return s.subject(productName);
  },
  component: ({
    name,
    productName,
    productUrl,
    productImageUrl,
    price,
    variant,
    appName = 'Our Store',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...BACK_IN_STOCK_STRINGS, ...strings };
    const t = { ...defaultTheme, ...theme };
    const year = currentYear(locale);

    const productCardStyle: CSSProperties = {
      backgroundColor: t.surfaceSubtle,
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
    };

    const productNameStyle: CSSProperties = {
      fontSize: '18px',
      fontWeight: '700',
      color: t.textPrimary,
      margin: '0 0 4px',
    };

    const variantStyle: CSSProperties = {
      fontSize: '13px',
      color: t.textMuted,
      margin: '0 0 8px',
    };

    const priceStyle: CSSProperties = {
      fontSize: '22px',
      fontWeight: '800',
      color: t.textPrimary,
      margin: 0,
    };

    return (
      <EmailTemplate preview={s.subject(productName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(productName)}</Text>
        <Section>
          <div style={productCardStyle}>
            {productImageUrl && (
              <img
                src={productImageUrl}
                alt={productName}
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }}
              />
            )}
            <p style={productNameStyle}>{productName}</p>
            {variant && <p style={variantStyle}>{variant}</p>}
            {price && <p style={priceStyle}>{price}</p>}
          </div>
        </Section>
        <Button href={productUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.urgencyNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
