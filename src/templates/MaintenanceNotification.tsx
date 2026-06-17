import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme, PALETTE } from '../theme.js';
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

export type MaintenanceType = 'scheduled' | 'emergency' | 'completed' | 'extended';

export interface MaintenanceNotificationStrings {
  subject: (type: MaintenanceType, appName: string) => string;
  heading: (type: MaintenanceType) => string;
  body: (type: MaintenanceType, appName: string) => string;
  statusPageLabel: string;
  footer: (year: string, appName: string) => string;
}

export const MAINTENANCE_NOTIFICATION_STRINGS: MaintenanceNotificationStrings = {
  subject: (type, appName) => {
    const labels: Record<MaintenanceType, string> = {
      scheduled: `Scheduled maintenance — ${appName}`,
      emergency: `Emergency maintenance in progress — ${appName}`,
      completed: `Maintenance complete — ${appName} is back`,
      extended: `Maintenance extended — ${appName}`,
    };
    return labels[type];
  },
  heading: (type) => {
    const labels: Record<MaintenanceType, string> = {
      scheduled: 'Scheduled maintenance',
      emergency: 'Emergency maintenance',
      completed: 'We\'re back online',
      extended: 'Maintenance extended',
    };
    return labels[type];
  },
  body: (type, appName) => {
    const messages: Record<MaintenanceType, string> = {
      scheduled: `${appName} will be temporarily unavailable during the maintenance window below. We apologize for any inconvenience.`,
      emergency: `${appName} is currently undergoing emergency maintenance. We're working to restore service as quickly as possible.`,
      completed: `${appName} maintenance is complete and all systems are fully operational. Thank you for your patience.`,
      extended: `The maintenance window for ${appName} has been extended. We're working hard to complete the work as soon as possible.`,
    };
    return messages[type];
  },
  statusPageLabel: 'View Status Page',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AffectedService {
  name: string;
  impact: 'full_outage' | 'partial_outage' | 'degraded';
}

export interface MaintenanceNotificationProps extends BaseTemplateProps<MaintenanceNotificationStrings> {
  type: MaintenanceType;
  startTime?: string;
  endTime?: string;
  duration?: string;
  affectedServices?: AffectedService[];
  statusPageUrl?: string;
}

const IMPACT_LABELS: Record<AffectedService['impact'], string> = {
  full_outage: 'Outage',
  partial_outage: 'Partial',
  degraded: 'Degraded',
};

export const MaintenanceNotification: EmailTemplateType<MaintenanceNotificationProps> = defineEmail<MaintenanceNotificationProps>({
  subject: ({ type, appName = 'Our App', strings }) => {
    const s = { ...MAINTENANCE_NOTIFICATION_STRINGS, ...strings };
    return s.subject(type, appName);
  },
  component: ({
    type,
    startTime,
    endTime,
    duration,
    affectedServices,
    statusPageUrl,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...MAINTENANCE_NOTIFICATION_STRINGS, ...strings };
    const t = { ...defaultTheme, ...theme };
    const year = currentYear(locale);
    const hasWindow = startTime || endTime || duration;

    const windowBoxStyle: CSSProperties = {
      backgroundColor: t.surfaceSubtle,
      borderRadius: '8px',
      padding: '16px',
    };

    const timeRowStyle: CSSProperties = {
      padding: '8px 0',
      borderBottom: `1px solid ${t.border}`,
      fontSize: '14px',
    };

    const impactBadge = (impact: AffectedService['impact']): CSSProperties => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '700',
      backgroundColor: impact === 'full_outage' ? PALETTE.impact.full_outage.bg : impact === 'partial_outage' ? PALETTE.impact.partial_outage.bg : PALETTE.impact.degraded.bg,
      color: impact === 'full_outage' ? PALETTE.impact.full_outage.text : impact === 'partial_outage' ? PALETTE.impact.partial_outage.text : PALETTE.impact.degraded.text,
    });

    return (
      <EmailTemplate preview={s.subject(type, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(type)}</Heading>
        <Text>{s.body(type, appName)}</Text>
        {hasWindow && (
          <Section>
            <div style={windowBoxStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
                <tbody>
                  {startTime && (
                    <tr>
                      <td style={timeRowStyle}><span style={{ color: t.textMuted }}>Start</span></td>
                      <td style={{ ...timeRowStyle, textAlign: 'right', fontWeight: '600', color: t.textPrimary }}>{startTime}</td>
                    </tr>
                  )}
                  {endTime && (
                    <tr>
                      <td style={timeRowStyle}><span style={{ color: t.textMuted }}>End</span></td>
                      <td style={{ ...timeRowStyle, textAlign: 'right', fontWeight: '600', color: t.textPrimary }}>{endTime}</td>
                    </tr>
                  )}
                  {duration && (
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '14px' }}><span style={{ color: t.textMuted }}>Duration</span></td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: t.textPrimary, fontSize: '14px' }}>{duration}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}
        {affectedServices && affectedServices.length > 0 && (
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
              <tbody>
                {affectedServices.map((svc, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 0', borderBottom: `1px solid ${t.borderSubtle}`, fontSize: '14px', color: t.textPrimary }}>{svc.name}</td>
                    <td style={{ padding: '10px 0', borderBottom: `1px solid ${t.borderSubtle}`, textAlign: 'right' }}>
                      <span className="tierde-badge" style={impactBadge(svc.impact)}>{IMPACT_LABELS[svc.impact]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
        {statusPageUrl && <Button href={statusPageUrl}>{s.statusPageLabel}</Button>}
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
