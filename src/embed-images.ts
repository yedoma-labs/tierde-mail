import type { MailMiddleware } from './types.js';

/**
 * Middleware that fetches remote images and embeds them as inline CID attachments.
 *
 * @param urls - Specific image URLs to embed. If omitted, all `http(s)://` src attributes are embedded.
 *
 * @example
 * ```ts
 * import { embedImages } from '@yedoma-labs/tierde-mail';
 *
 * const mailer = createMailer({
 *   provider: smtp({ ... }),
 *   from: 'hello@example.com',
 *   middleware: [
 *     embedImages([
 *       'https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png',
 *     ]),
 *   ],
 * });
 * ```
 *
 * The HTML template can reference the image by its remote URL — the middleware replaces
 * it with `src="cid:<filename>"` and attaches the image inline.
 *
 * **SES limitation**: `SendEmailCommand` does not support attachments. Use `SendRawEmailCommand`
 * (outside tierde-mail) if you need inline images with SES.
 */
export function embedImages(urls?: string[]): MailMiddleware {
  return async (message) => {
    const srcPattern = /\bsrc="(https?:\/\/[^"]+)"/g;
    const candidates = new Set<string>();

    for (const [, src] of message.html.matchAll(srcPattern)) {
      if (src && (!urls || urls.includes(src))) candidates.add(src);
    }

    if (candidates.size === 0) return message;

    const cidMap = new Map<string, string>();
    const inlineAttachments: typeof message.attachments = [];
    const filenameCounts = new Map<string, number>();

    for (const url of candidates) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`embedImages: failed to fetch ${url} — HTTP ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/png';

      const urlPath = new URL(url).pathname;
      const basename = urlPath.split('/').pop() ?? 'image';
      const filename = basename.includes('.') ? basename : `${basename}.${contentType.split('/')[1] ?? 'bin'}`;

      const count = filenameCounts.get(filename) ?? 0;
      filenameCounts.set(filename, count + 1);
      const cid = count === 0 ? filename : `${count}-${filename}`;

      cidMap.set(url, cid);
      inlineAttachments.push({ filename, content: buffer, contentType, cid });
    }

    const html = message.html.replace(
      /\bsrc="(https?:\/\/[^"]+)"/g,
      (match, src: string) => {
        const cid = cidMap.get(src);
        return cid ? `src="cid:${cid}"` : match;
      },
    );

    return {
      ...message,
      html,
      attachments: [...(message.attachments ?? []), ...inlineAttachments],
    };
  };
}
