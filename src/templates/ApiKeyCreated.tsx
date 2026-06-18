import { AlertBox } from '../components/AlertBox.js';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export type ApiKeyEvent = 'created' | 'revoked' | 'expiring';

export interface ApiKeyStrings {
  subject: (event: ApiKeyEvent, keyName: string, appName: string) => string;
  heading: (event: ApiKeyEvent, keyName: string) => string;
  body: (event: ApiKeyEvent, keyName: string) => string;
  keyNameLabel: string;
  maskedKeyLabel: string;
  expiresLabel: string;
  ctaLabel: string;
  securityNote: string;
  footer: (year: string, appName: string) => string;
}

export const API_KEY_STRINGS: ApiKeyStrings = {
  subject: (event, _keyName, appName) => {
    const labels: Record<ApiKeyEvent, string> = {
      created: `New API key created — ${appName}`,
      revoked: `API key revoked — ${appName}`,
      expiring: `API key expiring soon — ${appName}`,
    };
    return labels[event];
  },
  heading: (event, keyName) => {
    const labels: Record<ApiKeyEvent, string> = {
      created: `API key created: ${keyName}`,
      revoked: `API key revoked: ${keyName}`,
      expiring: `API key expiring: ${keyName}`,
    };
    return labels[event];
  },
  body: (event, keyName) => {
    const messages: Record<ApiKeyEvent, string> = {
      created: `A new API key named "${keyName}" has been created. If you did not create this key, revoke it immediately.`,
      revoked: `The API key "${keyName}" has been revoked and can no longer be used to authenticate requests.`,
      expiring: `The API key "${keyName}" is expiring soon. Rotate it now to avoid service interruption.`,
    };
    return messages[event];
  },
  keyNameLabel: 'Key name',
  maskedKeyLabel: 'Key (partial)',
  expiresLabel: 'Expires',
  ctaLabel: 'Manage API Keys',
  securityNote: 'If you did not take this action, secure your account immediately.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ApiKeyProps extends BaseTemplateProps<ApiKeyStrings> {
  keyName: string;
  event: ApiKeyEvent;
  manageUrl: string;
  maskedKey?: string;
  expiresAt?: string;
}

export const ApiKeyCreated: EmailTemplateType<ApiKeyProps> = defineEmail<ApiKeyProps>({
  subject: ({ event, keyName, appName = 'Our App', strings }) => {
    const s = { ...API_KEY_STRINGS, ...strings };
    return s.subject(event, keyName, appName);
  },
  component: ({
    keyName,
    event,
    manageUrl,
    maskedKey,
    expiresAt,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...API_KEY_STRINGS, ...strings };
    const year = currentYear(locale);
    const alertVariant = event === 'revoked' ? 'danger' : event === 'expiring' ? 'warning' : 'info';
    const buttonVariant = event === 'revoked' ? 'outline' : 'primary';

    return (
      <EmailTemplate
        preview={s.subject(event, keyName, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(event, keyName)}</Heading>
        <AlertBox variant={alertVariant}>{s.body(event, keyName)}</AlertBox>
        <KeyValueTable
          rows={[
            { label: s.keyNameLabel, value: keyName },
            { label: s.maskedKeyLabel, value: maskedKey, mono: true },
            { label: s.expiresLabel, value: expiresAt },
          ]}
        />
        <Button href={manageUrl} variant={buttonVariant}>
          {s.ctaLabel}
        </Button>
        <Hr />
        <Text muted size="sm">
          {s.securityNote}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});
