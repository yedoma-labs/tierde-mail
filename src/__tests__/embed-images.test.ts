import { beforeEach, describe, expect, it, vi } from 'vitest';
import { embedImages } from '../embed-images.js';
import type { EmailMessage } from '../types.js';

const IMAGE_URL = 'https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png';
const OTHER_URL = 'https://example.com/logo.png';

function makeMessage(html: string): EmailMessage {
  return {
    from: { email: 'sender@example.com' },
    to: { email: 'recipient@example.com' },
    subject: 'Test',
    html,
    text: 'Test',
    attachments: [],
  };
}

function mockImageFetch(url: string, bytes: Uint8Array, contentType = 'image/png') {
  vi.mocked(fetch).mockImplementationOnce(async (input) => {
    if (String(input) === url) {
      return {
        ok: true,
        arrayBuffer: async () => bytes.buffer,
        headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
      } as unknown as Response;
    }
    return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0), headers: { get: () => null } } as unknown as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('embedImages', () => {
  it('fetches image and adds it as inline attachment', async () => {
    const imgBytes = new Uint8Array([1, 2, 3]);
    mockImageFetch(IMAGE_URL, imgBytes);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(result.attachments![0]!.cid).toBe('banner-resized.png');
    expect(result.attachments![0]!.filename).toBe('banner-resized.png');
    expect(result.attachments![0]!.contentType).toBe('image/png');
    expect(Buffer.from(result.attachments![0]!.content as Buffer)).toEqual(Buffer.from(imgBytes));
  });

  it('rewrites src to cid reference in HTML', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(`<img src="${IMAGE_URL}" alt="banner" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).not.toContain(`src="${IMAGE_URL}"`);
  });

  it('embeds all remote img src when no url list given', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1]).buffer,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      } as unknown as Response))
      .mockImplementationOnce(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([2]).buffer,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      } as unknown as Response));

    const msg = makeMessage(
      `<img src="${IMAGE_URL}" /><img src="${OTHER_URL}" />`,
    );
    const result = await embedImages()(msg);

    expect(result.attachments).toHaveLength(2);
    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).toContain('src="cid:logo.png"');
  });

  it('skips URLs not in the filter list', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(
      `<img src="${IMAGE_URL}" /><img src="${OTHER_URL}" />`,
    );
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).toContain(`src="${OTHER_URL}"`);
  });

  it('deduplicates same URL appearing multiple times in HTML', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(
      `<img src="${IMAGE_URL}" /><img src="${IMAGE_URL}" />`,
    );
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(result.html).toBe('<img src="cid:banner-resized.png" /><img src="cid:banner-resized.png" />');
  });

  it('disambiguates same filename from different URLs with counter prefix', async () => {
    const url1 = 'https://cdn1.example.com/image.png';
    const url2 = 'https://cdn2.example.com/image.png';

    vi.mocked(fetch)
      .mockImplementationOnce(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1]).buffer,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      } as unknown as Response))
      .mockImplementationOnce(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([2]).buffer,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      } as unknown as Response));

    const msg = makeMessage(`<img src="${url1}" /><img src="${url2}" />`);
    const result = await embedImages()(msg);

    const cids = result.attachments!.map((a) => a.cid);
    expect(new Set(cids).size).toBe(2);
  });

  it('preserves existing attachments', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const existing = { filename: 'doc.pdf', content: 'base64', contentType: 'application/pdf' };
    const msg = { ...makeMessage(`<img src="${IMAGE_URL}" />`), attachments: [existing] };
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(2);
    expect(result.attachments![0]).toBe(existing);
    expect(result.attachments![1]!.cid).toBe('banner-resized.png');
  });

  it('returns message unchanged when no matching src found', async () => {
    const msg = makeMessage('<p>No images here</p>');
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result).toBe(msg);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('throws when image fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    await expect(embedImages([IMAGE_URL])(msg)).rejects.toThrow(
      `embedImages: failed to fetch ${IMAGE_URL} — HTTP 404`,
    );
  });

  it('does not match non-http src attributes', async () => {
    const msg = makeMessage(
      '<img src="cid:existing.png" /><img src="data:image/png;base64,abc" />',
    );
    const result = await embedImages()(msg);

    expect(result).toBe(msg);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('uses content-type from response headers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/webp' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments![0]!.contentType).toBe('image/webp');
  });
});
