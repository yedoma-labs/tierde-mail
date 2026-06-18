import type { Attachment, EmailAddress, EmailAddressInput } from './types.js';

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/octet-stream',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'text/html',
]);

export function validateEmail(email: string): void {
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new TypeError(`Invalid email address: ${email}`);
  }
  // Reject CRLF, control chars to prevent email header injection
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — rejects header injection chars
  if (/[\r\n\x00-\x1f]/.test(email)) {
    throw new TypeError(`Invalid email address: contains control characters`);
  }
  const atIdx = email.lastIndexOf('@');
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  if (!local || !domain?.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    throw new TypeError(`Invalid email address: ${email}`);
  }
  // Reject spaces in local or domain part
  if (local.includes(' ') || domain.includes(' ')) {
    throw new TypeError(`Invalid email address: contains spaces`);
  }
}

export function normalizeAddress(input: EmailAddressInput): EmailAddress {
  if (typeof input === 'string') {
    validateEmail(input);
    return { email: input };
  }
  validateEmail(input.email);
  return input;
}

export function normalizeAddresses(input: EmailAddressInput | EmailAddressInput[]): EmailAddress[] {
  const addresses = Array.isArray(input) ? input.map(normalizeAddress) : [normalizeAddress(input)];
  if (addresses.length === 0) {
    throw new TypeError('At least one recipient address is required');
  }
  return addresses;
}

export function validateAttachment(attachment: Attachment): void {
  const filename = attachment.filename;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — rejects unsafe filename chars
  if (/[\x00-\x1f]/.test(filename)) {
    throw new TypeError(`Unsafe attachment filename: contains control characters`);
  }
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new TypeError(`Unsafe attachment filename: ${filename}`);
  }
  const ct = attachment.contentType;
  const baseType = ct.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!ALLOWED_CONTENT_TYPES.has(baseType) && !baseType.startsWith('image/')) {
    throw new TypeError(`Disallowed attachment content type: ${ct}`);
  }
}
