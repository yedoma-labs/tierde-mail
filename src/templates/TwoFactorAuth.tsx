import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Section } from '../components/Section.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { CSSProperties } from 'react';

export interface TwoFactorAuthProps {
  username: string;
  code: string;
  expiresIn?: string;
  appName?: string;
}

const codeStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  color: '#1a1a1a',
  textAlign: 'center',
  fontFamily: 'monospace',
};

export const TwoFactorAuth = defineEmail<TwoFactorAuthProps>({
  subject: ({ appName }) => `Your ${appName ?? 'verification'} code`,
  component: ({ username, code, expiresIn = '10 minutes', appName = 'Our App' }) => (
    <EmailTemplate preview={`Your ${appName} verification code: ${code}`}>
      <Heading>Your verification code</Heading>
      <Text>Hi {username},</Text>
      <Text>
        Use the code below to complete your sign in. Do not share this code with anyone.
      </Text>
      <Section backgroundColor="#f3f4f6">
        <p style={codeStyle}>{code}</p>
      </Section>
      <Text muted size="sm" align="center">
        This code expires in {expiresIn}.
      </Text>
      <Hr />
      <Text muted size="sm">
        If you didn't request this code, your account may be at risk.
        Please change your password immediately.
      </Text>
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});
