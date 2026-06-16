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
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface DigestItem {
  title: string;
  summary?: string;
  url: string;
  category?: string;
  meta?: string;
}

export interface DigestStat {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export interface WeeklyDigestStrings {
  subject: (weekOf: string, appName: string) => string;
  heading: (weekOf: string) => string;
  greeting: (name: string) => string;
  statsHeading: string;
  highlightsHeading: string;
  readMore: string;
  ctaLabel: string;
  unsubscribeNote: string;
  footer: (year: string, appName: string) => string;
}

export const WEEKLY_DIGEST_STRINGS: WeeklyDigestStrings = {
  subject: (weekOf, appName) => `Your ${appName} digest — week of ${weekOf}`,
  heading: (weekOf) => `Week of ${weekOf}`,
  greeting: (name) => `Hi ${name},`,
  statsHeading: "This week's stats",
  highlightsHeading: 'Highlights',
  readMore: 'Read more →',
  ctaLabel: 'View All Activity',
  unsubscribeNote: 'You are receiving this because you subscribed to weekly digests.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface WeeklyDigestProps extends BaseTemplateProps<WeeklyDigestStrings> {
  name: string;
  weekOf: string;
  dashboardUrl: string;
  stats?: DigestStat[];
  items?: DigestItem[];
}

const statCellStyle: CSSProperties = {
  textAlign: 'center',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
};

const statValueStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#0f172a',
  display: 'block',
  lineHeight: '1',
  marginBottom: '4px',
};

const statLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const statChangeStyle = (positive?: boolean): CSSProperties => ({
  fontSize: '12px',
  fontWeight: '600',
  color: positive === false ? '#dc2626' : '#16a34a',
  display: 'block',
  marginTop: '2px',
});

const itemTitleStyle: CSSProperties = {
  fontWeight: '600',
  fontSize: '15px',
  color: '#0f172a',
  margin: '0 0 4px',
  textDecoration: 'none',
};

const itemMetaStyle: CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  margin: '0 0 4px',
};

const itemSummaryStyle: CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  margin: 0,
};

export const WeeklyDigest: EmailTemplateType<WeeklyDigestProps> = defineEmail<WeeklyDigestProps>({
  subject: ({ weekOf, appName = 'Our App', strings }) => {
    const s = { ...WEEKLY_DIGEST_STRINGS, ...strings };
    return s.subject(weekOf, appName);
  },
  component: ({
    name,
    weekOf,
    dashboardUrl,
    stats,
    items,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...WEEKLY_DIGEST_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(weekOf, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(weekOf)}</Heading>
        <Text>{s.greeting(name)}</Text>

        {stats && stats.length > 0 && (
          <>
            <Text size="sm" muted>{s.statsHeading}</Text>
            <Section>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }} cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    {stats.slice(0, 3).map((stat, i) => (
                      <td key={i} style={statCellStyle}>
                        <span style={statValueStyle}>{stat.value}</span>
                        <span style={statLabelStyle}>{stat.label}</span>
                        {stat.change && (
                          <span style={statChangeStyle(stat.positive)}>{stat.change}</span>
                        )}
                      </td>
                    ))}
                    {stats.length < 3 && Array.from({ length: 3 - stats.length }).map((_, i) => (
                      <td key={`pad-${i}`} />
                    ))}
                  </tr>
                </tbody>
              </table>
            </Section>
          </>
        )}

        {items && items.length > 0 && (
          <>
            <Hr />
            <Text size="sm" muted>{s.highlightsHeading}</Text>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                {item.meta && <p style={itemMetaStyle}>{item.category ? `${item.category} · ` : ''}{item.meta}</p>}
                <a href={item.url} style={itemTitleStyle}>{item.title}</a>
                {item.summary && <p style={itemSummaryStyle}>{item.summary}</p>}
                <a href={item.url} style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>
                  {s.readMore}
                </a>
              </div>
            ))}
          </>
        )}

        <Button href={dashboardUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.unsubscribeNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
