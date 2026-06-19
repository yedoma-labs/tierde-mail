import type { Attachment, MailMiddleware } from './types.js';
import { validateAttachment } from './validate.js';

/**
 * Middleware that fetches remote images and embeds them as inline CID attachments.
 *
 * @param urls - Specific image URLs to embed. If omitted, all `http(s)://` src attributes are embedded.
 *
 * @example
 * ```ts
 * import { createMailer, embedImages } from '@yedoma-labs/tierde-mail';
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
 *
 * **SSRF warning**: when called without a URL list, every remote `src` in the rendered HTML
 * is fetched server-side. Do not use with templates whose `src` values come from untrusted
 * user input.
 */
export function embedImages(urls?: string[]): MailMiddleware {
  const urlSet = urls ? new Set(urls) : null;

  return async (message) => {
    const srcPattern = /\bsrc="(https?:\/\/[^"]+)"/g;
    const candidates = new Set<string>();

    for (const [, src] of message.html.matchAll(srcPattern)) {
      if (src && (!urlSet || urlSet.has(src))) candidates.add(src);
    }

    if (candidates.size === 0) return message;

    const cidMap = new Map<string, string>();
    const inlineAttachments: Attachment[] = [];
    const filenameCounts = new Map<string, number>();

    const fetched = await Promise.all(
      [...candidates].map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`embedImages: failed to fetch ${url} — HTTP ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/png';
        return { url, buffer, contentType };
      }),
    );

    for (const { url, buffer, contentType } of fetched) {
      const urlPath = new URL(url).pathname;
      const basename = urlPath.split('/').pop() ?? 'image';
      const filename = basename.includes('.') ? basename : `${basename}.${contentType.split('/')[1] ?? 'bin'}`;

      const count = filenameCounts.get(filename) ?? 0;
      filenameCounts.set(filename, count + 1);
      const cid = count === 0 ? filename : `${count}-${filename}`;

      const attachment: Attachment = { filename, content: buffer, contentType, cid };
      validateAttachment(attachment);

      cidMap.set(url, cid);
      inlineAttachments.push(attachment);
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
