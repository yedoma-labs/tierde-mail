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

export type UsageSeverity = 'warning' | 'critical' | 'exceeded';

export interface UsageAlertStrings {
  subject: (resource: string, percentUsed: number, appName: string) => string;
  heading: (severity: UsageSeverity, resource: string) => string;
  greeting: (name: string) => string;
  body: (severity: UsageSeverity, resource: string, percentUsed: number) => string;
  ctaLabel: string;
  footer: (year: string, appName: string) => string;
}

export const USAGE_ALERT_STRINGS: UsageAlertStrings = {
  subject: (resource, percentUsed, appName) =>
    percentUsed >= 100
      ? `${resource} limit reached — ${appName}`
      : `${resource} at ${percentUsed}% — ${appName}`,
  heading: (severity, resource) => {
    const labels: Record<UsageSeverity, string> = {
      warning: `${resource} approaching limit`,
      critical: `${resource} almost full`,
      exceeded: `${resource} limit reached`,
    };
    return labels[severity];
  },
  greeting: (name) => `Hi ${name},`,
  body: (severity, resource, percentUsed) => {
    if (severity === 'exceeded') {
      return `You've reached your ${resource} limit. Upgrade your plan or reduce usage to restore access.`;
    }
    return `You've used ${percentUsed}% of your ${resource} allowance. Consider upgrading to avoid service interruption.`;
  },
  ctaLabel: 'Upgrade Plan',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface UsageAlertProps extends BaseTemplateProps<UsageAlertStrings> {
  name: string;
  resource: string;
  used: number | string;
  limit: number | string;
  unit?: string;
  percentUsed: number;
  severity: UsageSeverity;
  upgradeUrl: string;
  resetDate?: string;
}

const progressBarWrapStyle: CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderRadius: '999px',
  height: '10px',
  overflow: 'hidden',
  margin: '8px 0 4px',
};

function progressColor(severity: UsageSeverity): string {
  if (severity === 'exceeded') return '#dc2626';
  if (severity === 'critical') return '#f97316';
  return '#eab308';
}

export const UsageAlert: EmailTemplateType<UsageAlertProps> = defineEmail<UsageAlertProps>({
  subject: ({ resource, percentUsed, appName = 'Our App', strings }) => {
    const s = { ...USAGE_ALERT_STRINGS, ...strings };
    return s.subject(resource, percentUsed, appName);
  },
  component: ({
    name,
    resource,
    used,
    limit,
    unit = '',
    percentUsed,
    severity,
    upgradeUrl,
    resetDate,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...USAGE_ALERT_STRINGS, ...strings };
    const year = currentYear(locale);
    const pct = Math.min(100, percentUsed);
    const color = progressColor(severity);

    return (
      <EmailTemplate preview={s.subject(resource, percentUsed, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(severity, resource)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(severity, resource, percentUsed)}</Text>
        <Section>
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{resource}</span>
              <span style={{ color: color, fontWeight: '700' }}>{pct}%</span>
            </div>
            <div style={progressBarWrapStyle}>
              <div style={{ backgroundColor: color, height: '10px', width: `${pct}%`, borderRadius: '999px' }} />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {used}{unit} used of {limit}{unit}
              {resetDate && <span> · Resets {resetDate}</span>}
            </div>
          </div>
        </Section>
        <Button href={upgradeUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
