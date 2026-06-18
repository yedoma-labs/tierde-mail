import type React from 'react';
import { renderEmail } from '../render.js';
import type { EmailTemplate } from '../types.js';

export interface EmailPreviewProps {
  /** Pre-rendered HTML string — use renderEmailHtml() to produce it */
  html: string;
  style?: React.CSSProperties | undefined;
  className?: string | undefined;
  title?: string | undefined;
}

/**
 * Renders an email HTML string inside an isolated iframe.
 * Use `renderEmailHtml()` to produce the HTML server-side.
 *
 * ```tsx
 * // app/admin/email-preview/page.tsx  (Next.js Server Component)
 * import { EmailPreview, renderEmailHtml } from '@yedoma-labs/tierde-mail/react';
 * import { WelcomeEmail } from '@/emails/WelcomeEmail';
 *
 * export default function Page() {
 *   const html = renderEmailHtml(WelcomeEmail, { name: 'Alice', loginUrl: '...' });
 *   return <EmailPreview html={html} style={{ height: '600px' }} />;
 * }
 * ```
 */
export function EmailPreview({
  html,
  style,
  className,
  title,
}: EmailPreviewProps): React.ReactElement {
  return (
    <iframe
      srcDoc={html}
      style={{ border: 'none', width: '100%', height: '600px', ...style }}
      className={className}
      title={title}
    />
  );
}

/**
 * Renders a typed template to an HTML string.
 * Call this server-side (Node.js / SSR), then pass the result to `<EmailPreview>`.
 */
export function renderEmailHtml<Props>(template: EmailTemplate<Props>, props: Props): string {
  return renderEmail(template.component(props));
}
