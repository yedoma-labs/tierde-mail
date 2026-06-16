import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmailPreview, renderEmailHtml } from '../react/index.js';
import { defineEmail, EmailTemplate, Heading } from '../index.js';

const HelloEmail = defineEmail<{ name: string }>({
  subject: ({ name }) => `Hello, ${name}!`,
  component: ({ name }) => (
    <EmailTemplate>
      <Heading>Hello, {name}!</Heading>
    </EmailTemplate>
  ),
});

describe('renderEmailHtml', () => {
  it('returns HTML string from template and props', () => {
    const html = renderEmailHtml(HelloEmail, { name: 'Alice' });
    expect(html).toContain('Hello, Alice!');
    expect(html).toContain('<!DOCTYPE html>');
  });
});

describe('EmailPreview', () => {
  it('renders an iframe with srcDoc', () => {
    const html = '<p>Test email</p>';
    const markup = renderToStaticMarkup(<EmailPreview html={html} />);
    expect(markup).toContain('<iframe');
    expect(markup).toContain('srcDoc="&lt;p&gt;Test email&lt;/p&gt;"');
  });

  it('applies default styles', () => {
    const markup = renderToStaticMarkup(<EmailPreview html="" />);
    expect(markup).toContain('border:none');
    expect(markup).toContain('width:100%');
  });

  it('merges custom style', () => {
    const markup = renderToStaticMarkup(<EmailPreview html="" style={{ height: '800px' }} />);
    expect(markup).toContain('height:800px');
  });

  it('forwards className and title', () => {
    const markup = renderToStaticMarkup(
      <EmailPreview html="" className="email-frame" title="Email preview" />,
    );
    expect(markup).toContain('class="email-frame"');
    expect(markup).toContain('title="Email preview"');
  });
});
