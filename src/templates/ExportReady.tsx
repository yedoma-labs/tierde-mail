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

export interface ExportReadyStrings {
  subject: (exportName: string, appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (exportName: string) => string;
  ctaLabel: string;
  expiryNote: (hours: number) => string;
  footer: (year: string, appName: string) => string;
}

export const EXPORT_READY_STRINGS: ExportReadyStrings = {
  subject: (exportName, appName) => `Your ${exportName} export is ready — ${appName}`,
  heading: 'Your export is ready',
  greeting: (name) => `Hi ${name},`,
  body: (exportName) => `Your ${exportName} has been generated and is ready to download.`,
  ctaLabel: 'Download Export',
  expiryNote: (hours) => `This download link expires in ${hours} hours.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ExportReadyProps extends BaseTemplateProps<ExportReadyStrings> {
  name: string;
  exportName: string;
  downloadUrl: string;
  fileSize?: string;
  fileFormat?: string;
  rowCount?: number;
  expiresInHours?: number;
}

const metaBoxStyle: CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
};

const metaRowStyle: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '14px',
};

export const ExportReady: EmailTemplateType<ExportReadyProps> = defineEmail<ExportReadyProps>({
  subject: ({ exportName, appName = 'Our App', strings }) => {
    const s = { ...EXPORT_READY_STRINGS, ...strings };
    return s.subject(exportName, appName);
  },
  component: ({
    name,
    exportName,
    downloadUrl,
    fileSize,
    fileFormat,
    rowCount,
    expiresInHours = 24,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...EXPORT_READY_STRINGS, ...strings };
    const year = currentYear(locale);
    const hasMeta = fileSize || fileFormat || rowCount !== undefined;

    return (
      <EmailTemplate preview={s.subject(exportName, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(exportName)}</Text>
        {hasMeta && (
          <Section>
            <div style={metaBoxStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
                <tbody>
                  {fileFormat && (
                    <tr>
                      <td style={metaRowStyle}><span style={{ color: '#6b7280' }}>Format</span></td>
                      <td style={{ ...metaRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{fileFormat}</td>
                    </tr>
                  )}
                  {rowCount !== undefined && (
                    <tr>
                      <td style={metaRowStyle}><span style={{ color: '#6b7280' }}>Rows</span></td>
                      <td style={{ ...metaRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{rowCount.toLocaleString()}</td>
                    </tr>
                  )}
                  {fileSize && (
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#6b7280' }}>File Size</span></td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{fileSize}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}
        <Button href={downloadUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.expiryNote(expiresInHours)}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
