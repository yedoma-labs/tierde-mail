import type { CSSProperties } from 'react';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme, PALETTE } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface ChangelogItem {
  type: 'new' | 'improvement' | 'fix';
  title: string;
  description?: string;
}

export interface FeatureAnnouncementStrings {
  subject: (featureName: string, appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  ctaLabel: string;
  typeLabelNew: string;
  typeLabelImprovement: string;
  typeLabelFix: string;
  footer: (year: string, appName: string) => string;
}

export const FEATURE_ANNOUNCEMENT_STRINGS: FeatureAnnouncementStrings = {
  subject: (featureName, appName) => `Introducing ${featureName} — ${appName}`,
  heading: "What's new",
  greeting: (name) => `Hi ${name},`,
  ctaLabel: "See What's New",
  typeLabelNew: 'New',
  typeLabelImprovement: 'Improved',
  typeLabelFix: 'Fixed',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface FeatureAnnouncementProps extends BaseTemplateProps<FeatureAnnouncementStrings> {
  name: string;
  featureName: string;
  description: string;
  ctaUrl: string;
  imageUrl?: string;
  changes?: ChangelogItem[];
}

const typeBadge = (
  type: ChangelogItem['type'],
  strings: FeatureAnnouncementStrings,
): CSSProperties & { label: string } => {
  const map: Record<ChangelogItem['type'], [string, string, string]> = {
    new: [PALETTE.changelog.new.bg, PALETTE.changelog.new.text, strings.typeLabelNew],
    improvement: [
      PALETTE.changelog.improvement.bg,
      PALETTE.changelog.improvement.text,
      strings.typeLabelImprovement,
    ],
    fix: [PALETTE.changelog.fix.bg, PALETTE.changelog.fix.text, strings.typeLabelFix],
  };
  const [bg, color, label] = map[type];
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: bg,
    color,
    label,
  } as any;
};

const heroStyle: CSSProperties = {
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '0',
};

export const FeatureAnnouncement: EmailTemplateType<FeatureAnnouncementProps> =
  defineEmail<FeatureAnnouncementProps>({
    subject: ({ featureName, appName = 'Our App', strings }) => {
      const s = { ...FEATURE_ANNOUNCEMENT_STRINGS, ...strings };
      return s.subject(featureName, appName);
    },
    component: ({
      name,
      featureName,
      description,
      ctaUrl,
      imageUrl,
      changes,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...FEATURE_ANNOUNCEMENT_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);

      const changeRowStyle: CSSProperties = {
        padding: '12px 0',
        borderBottom: `1px solid ${t.borderSubtle}`,
      };

      return (
        <EmailTemplate
          preview={s.subject(featureName, appName)}
          lang={locale}
          dir={dir}
          theme={theme}
        >
          {imageUrl && (
            <Section>
              <div style={heroStyle}>
                <img
                  src={imageUrl}
                  alt={featureName}
                  style={{ width: '100%', display: 'block', borderRadius: '8px' }}
                />
              </div>
            </Section>
          )}
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>
            <strong>{featureName}</strong> — {description}
          </Text>
          {changes && changes.length > 0 && (
            <Section>
              {changes.map((item, i) => {
                const badgeProps = typeBadge(item.type, s);
                const { label, ...badgeStyle } = badgeProps as any;
                return (
                  <div key={i} style={changeRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span className="tierde-badge" style={badgeStyle as CSSProperties}>
                        {label}
                      </span>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '14px', color: t.textPrimary }}>
                          {item.title}
                        </strong>
                        {item.description && (
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: t.textMuted }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Section>
          )}
          <Button href={ctaUrl}>{s.ctaLabel}</Button>
          <Hr />
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });
