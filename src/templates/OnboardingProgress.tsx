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
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface OnboardingStep {
  title: string;
  description?: string;
  completed: boolean;
  url?: string;
}

export interface OnboardingProgressStrings {
  subject: (completedCount: number, totalCount: number, appName: string) => string;
  heading: (completedCount: number, totalCount: number) => string;
  greeting: (name: string) => string;
  body: (completedCount: number, totalCount: number) => string;
  completedLabel: string;
  pendingLabel: string;
  ctaLabel: string;
  allDoneHeading: string;
  allDoneBody: string;
  footer: (year: string, appName: string) => string;
}

export const ONBOARDING_PROGRESS_STRINGS: OnboardingProgressStrings = {
  subject: (completed, total, appName) =>
    completed === total
      ? `You're all set on ${appName}!`
      : `${completed} of ${total} steps complete — ${appName}`,
  heading: (completed, total) =>
    completed === total ? "You're all set!" : `${completed} of ${total} steps complete`,
  greeting: (name) => `Hi ${name},`,
  body: (completed, total) =>
    completed === total
      ? "You've completed all your setup steps. You're ready to get the most out of the platform."
      : `You're making great progress! Complete the remaining steps to unlock the full experience.`,
  completedLabel: '✓ Done',
  pendingLabel: 'To do',
  ctaLabel: 'Continue Setup',
  allDoneHeading: "You're all set!",
  allDoneBody: "You've completed all your setup steps.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface OnboardingProgressProps {
  name: string;
  steps: OnboardingStep[];
  dashboardUrl: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<OnboardingProgressStrings>;
  theme?: Theme;
}

const stepRowStyle: CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
};

const stepTitleStyle = (completed: boolean): CSSProperties => ({
  fontWeight: '600',
  fontSize: '14px',
  color: completed ? '#16a34a' : '#0f172a',
  margin: '0 0 2px',
});

const stepDescStyle: CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  margin: 0,
};

const badgeStyle = (completed: boolean): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '700',
  backgroundColor: completed ? '#dcfce7' : '#f1f5f9',
  color: completed ? '#166534' : '#475569',
  whiteSpace: 'nowrap',
});

export const OnboardingProgress: EmailTemplateType<OnboardingProgressProps> = defineEmail<OnboardingProgressProps>({
  subject: ({ steps, appName = 'Our App', strings }) => {
    const s = { ...ONBOARDING_PROGRESS_STRINGS, ...strings };
    const completed = steps.filter((st) => st.completed).length;
    return s.subject(completed, steps.length, appName);
  },
  component: ({
    name,
    steps,
    dashboardUrl,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...ONBOARDING_PROGRESS_STRINGS, ...strings };
    const year = currentYear(locale);
    const completedCount = steps.filter((st) => st.completed).length;
    const totalCount = steps.length;
    const allDone = completedCount === totalCount;

    return (
      <EmailTemplate
        preview={s.subject(completedCount, totalCount, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(completedCount, totalCount)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(completedCount, totalCount)}</Text>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <tbody>
              {steps.map((step, i) => (
                <tr key={i}>
                  <td style={stepRowStyle}>
                    <p style={stepTitleStyle(step.completed)}>
                      {step.url && !step.completed ? (
                        <a href={step.url} style={{ color: '#0f172a', textDecoration: 'none' }}>{step.title}</a>
                      ) : step.title}
                    </p>
                    {step.description && <p style={stepDescStyle}>{step.description}</p>}
                  </td>
                  <td style={{ ...stepRowStyle, textAlign: 'right', verticalAlign: 'top', paddingLeft: '12px' }}>
                    <span style={badgeStyle(step.completed)}>
                      {step.completed ? s.completedLabel : s.pendingLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        {!allDone && <Button href={dashboardUrl}>{s.ctaLabel}</Button>}
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
