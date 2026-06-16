import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderEmail } from '../render.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { AlertBox } from '../components/AlertBox.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import { Link } from '../components/Link.js';
import { Button } from '../components/Button.js';

// Wrap in EmailTemplate to satisfy theme context for Button/Link
function wrap(element: React.ReactElement) {
  return renderEmail(<EmailTemplate>{element}</EmailTemplate>);
}

describe('AlertBox', () => {
  it('renders children', () => {
    const html = wrap(<AlertBox variant="danger">Something went wrong</AlertBox>);
    expect(html).toContain('Something went wrong');
  });

  it('danger variant uses red palette', () => {
    const html = wrap(<AlertBox variant="danger">Error</AlertBox>);
    expect(html).toContain('#fef2f2');
    expect(html).toContain('#fecaca');
  });

  it('warning variant uses orange palette', () => {
    const html = wrap(<AlertBox variant="warning">Warning</AlertBox>);
    expect(html).toContain('#fff7ed');
    expect(html).toContain('#fed7aa');
  });

  it('success variant uses green palette', () => {
    const html = wrap(<AlertBox variant="success">Done</AlertBox>);
    expect(html).toContain('#f0fdf4');
    expect(html).toContain('#bbf7d0');
  });

  it('info variant uses blue palette', () => {
    const html = wrap(<AlertBox variant="info">Note</AlertBox>);
    expect(html).toContain('#eff6ff');
    expect(html).toContain('#bfdbfe');
  });

  it('defaults to info when variant omitted', () => {
    const html = wrap(<AlertBox>Note</AlertBox>);
    expect(html).toContain('#eff6ff');
  });

  it('renders icon when provided', () => {
    const html = wrap(<AlertBox variant="danger" icon="🔒">Locked</AlertBox>);
    expect(html).toContain('🔒');
    expect(html).toContain('Locked');
  });
});

describe('KeyValueTable', () => {
  it('renders label/value pairs', () => {
    const html = wrap(
      <KeyValueTable rows={[
        { label: 'Name', value: 'Alice' },
        { label: 'Location', value: 'Berlin' },
      ]} />,
    );
    expect(html).toContain('Name');
    expect(html).toContain('Alice');
    expect(html).toContain('Location');
    expect(html).toContain('Berlin');
  });

  it('filters out null values', () => {
    const html = wrap(
      <KeyValueTable rows={[
        { label: 'Shown', value: 'yes' },
        { label: 'Hidden', value: null },
      ]} />,
    );
    expect(html).toContain('Shown');
    expect(html).not.toContain('Hidden');
  });

  it('filters out undefined values', () => {
    const html = wrap(
      <KeyValueTable rows={[
        { label: 'Shown', value: 'yes' },
        { label: 'Hidden', value: undefined },
      ]} />,
    );
    expect(html).not.toContain('Hidden');
  });

  it('filters out empty string values', () => {
    const html = wrap(
      <KeyValueTable rows={[
        { label: 'Shown', value: 'yes' },
        { label: 'Hidden', value: '' },
      ]} />,
    );
    expect(html).not.toContain('Hidden');
  });

  it('filters out false values', () => {
    const html = wrap(
      <KeyValueTable rows={[
        { label: 'Shown', value: 'yes' },
        { label: 'Hidden', value: false },
      ]} />,
    );
    expect(html).not.toContain('Hidden');
  });

  it('renders nothing when all rows filtered', () => {
    const html = renderEmail(
      <KeyValueTable rows={[
        { label: 'A', value: null },
        { label: 'B', value: '' },
      ]} />,
    );
    expect(html).not.toContain('<table');
    expect(html).not.toContain('A');
  });

  it('applies monospace font for mono rows', () => {
    const html = wrap(
      <KeyValueTable rows={[{ label: 'IP', value: '192.168.1.1', mono: true }]} />,
    );
    expect(html).toContain('monospace');
    expect(html).toContain('192.168.1.1');
  });
});

describe('Link security', () => {
  it('allows https URLs', () => {
    expect(() => wrap(<Link href="https://example.com">Click</Link>)).not.toThrow();
  });

  it('allows http URLs', () => {
    expect(() => wrap(<Link href="http://example.com">Click</Link>)).not.toThrow();
  });

  it('allows mailto links', () => {
    expect(() => wrap(<Link href="mailto:user@example.com">Email</Link>)).not.toThrow();
  });

  it('allows relative paths', () => {
    expect(() => wrap(<Link href="/unsubscribe">Unsubscribe</Link>)).not.toThrow();
  });

  it('blocks javascript: protocol', () => {
    expect(() => wrap(<Link href="javascript:alert(1)">XSS</Link>)).toThrow('Invalid link href');
  });

  it('blocks data: protocol', () => {
    expect(() => wrap(<Link href="data:text/html,<h1>xss</h1>">XSS</Link>)).toThrow('Invalid link href');
  });

  it('blocks vbscript: protocol', () => {
    expect(() => wrap(<Link href="vbscript:msgbox(1)">XSS</Link>)).toThrow('Invalid link href');
  });
});

describe('Button security', () => {
  it('blocks javascript: protocol', () => {
    expect(() => wrap(<Button href="javascript:alert(1)">XSS</Button>)).toThrow('Invalid button href');
  });

  it('blocks data: protocol', () => {
    expect(() => wrap(<Button href="data:text/html,xss">XSS</Button>)).toThrow('Invalid button href');
  });

  it('allows https URLs', () => {
    expect(() => wrap(<Button href="https://example.com">OK</Button>)).not.toThrow();
  });
});
