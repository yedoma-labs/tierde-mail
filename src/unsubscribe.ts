export interface UnsubscribeOptions {
  /** HTTPS URL for the unsubscribe endpoint (required by Gmail/Yahoo bulk-sender rules) */
  url: string;
  /** mailto: address as a fallback unsubscribe mechanism */
  email?: string | undefined;
  /** Emit List-Unsubscribe-Post for RFC 8058 one-click. Default: true */
  oneClick?: boolean | undefined;
}

/**
 * Returns email headers for CAN-SPAM / RFC 8058 unsubscribe compliance.
 *
 * Spread into SendOptions.headers:
 * ```ts
 * await mailer.send(NewsletterEmail, {
 *   to: subscriber.email,
 *   props: { ... },
 *   headers: unsubscribeHeaders({
 *     url: `https://app.com/unsubscribe?token=${subscriber.token}`,
 *   }),
 * });
 * ```
 *
 * Gmail and Yahoo require List-Unsubscribe + List-Unsubscribe-Post for bulk
 * senders (>5 000 messages/day) as of February 2024.
 */
export function unsubscribeHeaders(options: UnsubscribeOptions): Record<string, string> {
  const parts: string[] = [`<${options.url}>`];
  if (options.email) parts.push(`<mailto:${options.email}>`);

  const headers: Record<string, string> = {
    'List-Unsubscribe': parts.join(', '),
  };

  if (options.oneClick !== false) {
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  return headers;
}
