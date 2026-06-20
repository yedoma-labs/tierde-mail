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

// Active-content image types that can execute scripts — explicitly blocked even though
// they match the image/* prefix check below.
const BLOCKED_IMAGE_TYPES = new Set(['image/svg+xml', 'image/svg']);

// RFC 5321 §4.1.2 / RFC 5322 §3.2.3 — printable US-ASCII excluding specials.
// Used in dot-atom local parts.
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional
const ATEXT_RE = /^[-a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+$/;

// RFC 5321 §4.1.2 — sub-domain label: starts and ends with letter/digit,
// hyphens allowed in the middle, 1–63 characters.
const LABEL_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

function validateLocalPart(local: string): void {
  if (local.length === 0 || local.length > 64) {
    throw new TypeError(
      `Invalid email address: local part must be 1–64 characters (got ${local.length})`,
    );
  }

  // RFC 5321 §4.1.2: quoted-string local parts ("...") allow almost any content.
  if (local.startsWith('"')) {
    if (!local.endsWith('"') || local.length < 2) {
      throw new TypeError('Invalid email address: malformed quoted local part');
    }
    // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — rejects header injection chars
    if (/[\r\n\x00]/.test(local.slice(1, -1))) {
      throw new TypeError('Invalid email address: quoted local part contains null or CRLF');
    }
    return;
  }

  // RFC 5321 §4.1.2: dot-atom — atoms joined by single dots, no leading/trailing/consecutive dots.
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    throw new TypeError('Invalid email address: invalid dots in local part');
  }
  for (const atom of local.split('.')) {
    if (!ATEXT_RE.test(atom)) {
      throw new TypeError(`Invalid email address: invalid character in local part`);
    }
  }
}

function validateDomain(domain: string): void {
  if (domain.length === 0 || domain.length > 255) {
    throw new TypeError(
      `Invalid email address: domain must be 1–255 characters (got ${domain.length})`,
    );
  }

  // RFC 5321 §4.1.3: address literals [IPv4] or [IPv6:...] — accept without deep validation.
  if (domain.startsWith('[') && domain.endsWith(']')) {
    return;
  }

  if (domain.includes('.')) {
    // Dotted domain: no leading, trailing, or consecutive dots.
    if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
      throw new TypeError('Invalid email address: invalid dots in domain');
    }
    for (const label of domain.split('.')) {
      if (!LABEL_RE.test(label)) {
        throw new TypeError(`Invalid email address: invalid domain label "${label}"`);
      }
    }
  } else {
    // RFC 5321 allows bare hostnames (no dot) — e.g. localhost, mailpit.
    if (!LABEL_RE.test(domain)) {
      throw new TypeError(`Invalid email address: invalid domain "${domain}"`);
    }
  }
}

export function validateEmail(email: string): void {
  if (typeof email !== 'string') {
    throw new TypeError(`Invalid email address: ${email}`);
  }
  // Reject control chars early — header injection prevention applies before any parsing.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — rejects header injection chars
  if (/[\r\n\x00-\x1f]/.test(email)) {
    throw new TypeError('Invalid email address: contains control characters');
  }

  // Use lastIndexOf so quoted local parts containing @ (e.g. "user@name"@host) are handled.
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) {
    throw new TypeError(`Invalid email address: ${email}`);
  }

  validateLocalPart(email.slice(0, atIdx));
  validateDomain(email.slice(atIdx + 1));
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
  const isAllowedImage = baseType.startsWith('image/') && !BLOCKED_IMAGE_TYPES.has(baseType);
  if (!ALLOWED_CONTENT_TYPES.has(baseType) && !isAllowedImage) {
    throw new TypeError(`Disallowed attachment content type: ${ct}`);
  }
  if (attachment.cid !== undefined) {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — rejects MIME header injection
    if (/[\r\n\x00-\x1f]/.test(attachment.cid)) {
      throw new TypeError(`Unsafe attachment cid: contains control characters`);
    }
    if (attachment.cid.length === 0) {
      throw new TypeError(`Unsafe attachment cid: must not be empty`);
    }
  }
}
