export type { AlertBoxVariant, KeyValueRow } from './components/index.js';
export {
  AlertBox,
  Button,
  Column,
  EmailTemplate,
  Footer,
  Heading,
  Hr,
  Image,
  KeyValueTable,
  Link,
  LogoHeader,
  Preview,
  Row,
  Section,
  Text,
} from './components/index.js';
export { defineEmail } from './define-email.js';
export { embedImages } from './embed-images.js';
export { createMailerFromEnv } from './env-mailer.js';
export { createMailer } from './mailer.js';
export type {
  BaseTemplateProps,
  ChangeRecord,
  LoginEvent,
  SecurityDetails,
} from './templates/shared.js';
export type { Theme } from './theme.js';
export { createTheme, defaultTheme } from './theme.js';
export type {
  Attachment,
  BatchItemResult,
  BatchRecipient,
  BatchSendOptions,
  BatchSendResult,
  CreateMailerConfig,
  EmailAddress,
  EmailAddressInput,
  EmailDefinition,
  EmailMessage,
  EmailProvider,
  EmailTemplate as EmailTemplateType,
  Mailer,
  MailMiddleware,
  MultiProviderMailerConfig,
  SendOptions,
  SendResult,
  SingleProviderMailerConfig,
} from './types.js';
export type { UnsubscribeOptions } from './unsubscribe.js';
export { unsubscribeHeaders } from './unsubscribe.js';
export { validateAttachment } from './validate.js';
