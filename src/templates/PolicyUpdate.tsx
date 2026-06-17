import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type PolicyType = 'privacy' | 'terms' | 'cookie' | 'acceptable_use' | 'data_processing';

export interface PolicyUpdateStrings {
  subject: (policyType: PolicyType, appName: string) => string;
  heading: (policyType: PolicyType) => string;
  intro: string;
  effectiveDate: (date: string) => string;
  ctaLabel: string;
  continuedUseNote: string;
  questionNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

const POLICY_LABELS: Record<PolicyType, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookie: 'Cookie Policy',
  acceptable_use: 'Acceptable Use Policy',
  data_processing: 'Data Processing Agreement',
};

export const POLICY_UPDATE_STRINGS: PolicyUpdateStrings = {
  subject: (policyType, appName) => `Important: Updates to our ${POLICY_LABELS[policyType]} — ${appName}`,
  heading: (policyType) => `We've updated our ${POLICY_LABELS[policyType]}`,
  intro: "We've made changes to keep our policies clear and up to date. Please take a moment to review the updated terms.",
  effectiveDate: (date) => `These changes take effect on ${date}.`,
  ctaLabel: 'Review Changes',
  continuedUseNote: 'By continuing to use our service after the effective date, you agree to the updated policy.',
  questionNote: (email) => `Questions about these changes? Contact us at ${email}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PolicyChange {
  section: string;
  summary: string;
}

export interface PolicyUpdateProps extends BaseTemplateProps<PolicyUpdateStrings> {
  policyType: PolicyType;
  effectiveDate: string;
  policyUrl: string;
  changes?: PolicyChange[];
  supportEmail?: string;
}

export const PolicyUpdate: EmailTemplateType<PolicyUpdateProps> = defineEmail<PolicyUpdateProps>({
  subject: ({ policyType, appName = 'Our App', strings }) => {
    const s = { ...POLICY_UPDATE_STRINGS, ...strings };
    return s.subject(policyType, appName);
  },
  component: ({
    policyType,
    effectiveDate,
    policyUrl,
    changes,
    supportEmail,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...POLICY_UPDATE_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(policyType, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(policyType)}</Heading>
        <Text>{s.intro}</Text>
        <Text>{s.effectiveDate(effectiveDate)}</Text>
        {changes && changes.length > 0 && (
          <Section>
            {changes.map((change, i) => (
              <table key={i} width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '0' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 0', borderBottom: i < changes.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                        {change.section}
                      </strong>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>{change.summary}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </Section>
        )}
        <Button href={policyUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.continuedUseNote}
          {supportEmail && (
            <>
              {' '}
              {s.questionNote(supportEmail)}
            </>
          )}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
