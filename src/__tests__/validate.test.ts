import { describe, it, expect } from 'vitest';
import { validateEmail, normalizeAddress, normalizeAddresses, validateAttachment } from '../validate.js';

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow();
    expect(() => validateEmail('user+tag@sub.domain.io')).not.toThrow();
  });

  it('rejects missing @', () => {
    expect(() => validateEmail('notanemail')).toThrow(TypeError);
  });

  it('rejects missing domain', () => {
    expect(() => validateEmail('user@')).toThrow(TypeError);
  });

  it('rejects domain without dot', () => {
    expect(() => validateEmail('user@localhost')).toThrow(TypeError);
  });
});

describe('normalizeAddress', () => {
  it('converts string to EmailAddress', () => {
    expect(normalizeAddress('user@example.com')).toEqual({ email: 'user@example.com' });
  });

  it('passes through object', () => {
    const addr = { email: 'user@example.com', name: 'User' };
    expect(normalizeAddress(addr)).toEqual(addr);
  });
});

describe('normalizeAddresses', () => {
  it('wraps single address in array', () => {
    expect(normalizeAddresses('a@b.com')).toHaveLength(1);
  });

  it('maps array of strings', () => {
    const result = normalizeAddresses(['a@b.com', 'c@d.com']);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ email: 'a@b.com' });
  });
});

describe('validateAttachment', () => {
  it('accepts safe filename and allowed content type', () => {
    expect(() =>
      validateAttachment({ filename: 'file.pdf', content: '', contentType: 'application/pdf' }),
    ).not.toThrow();
  });

  it('rejects path traversal in filename', () => {
    expect(() =>
      validateAttachment({ filename: '../evil.pdf', content: '', contentType: 'application/pdf' }),
    ).toThrow(TypeError);
  });

  it('rejects disallowed content type', () => {
    expect(() =>
      validateAttachment({ filename: 'script.exe', content: '', contentType: 'application/x-executable' }),
    ).toThrow(TypeError);
  });
});
