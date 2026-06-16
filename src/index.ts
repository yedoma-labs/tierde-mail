export type { BaseTemplateProps, SecurityDetails, ChangeRecord, LoginEvent } from './templates/shared.js';

export { defineEmail } from './define-email.js';
export { createMailer } from './mailer.js';
export { createMailerFromEnv } from './env-mailer.js';
export { createTheme, defaultTheme } from './theme.js';
export type { Theme } from './theme.js';

export {
  EmailTemplate,
  Heading,
  Text,
  Button,
  Footer,
  Hr,
  Image,
  Link,
  Preview,
  Section,
  Row,
  Column,
  LogoHeader,
  KeyValueTable,
  AlertBox,
} from './components/index.js';
export type { KeyValueRow, AlertBoxVariant } from './components/index.js';

export type {
  EmailAddress,
  EmailAddressInput,
  EmailMessage,
  EmailProvider,
  EmailTemplate as EmailTemplateType,
  EmailDefinition,
  SendResult,
  SendOptions,
  Mailer,
  CreateMailerConfig,
  SingleProviderMailerConfig,
  MultiProviderMailerConfig,
  Attachment,
} from './types.js';
