import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderEmail } from '../render.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';

describe('renderEmail', () => {
  it('produces valid HTML string', () => {
    const html = renderEmail(
      <EmailTemplate>
        <Heading>Hello</Heading>
        <Text>World</Text>
        <Button href="https://example.com">Click</Button>
      </EmailTemplate>,
    );
    expect(html).toContain('<html');
    expect(html).toContain('Hello');
    expect(html).toContain('World');
    expect(html).toContain('https://example.com');
  });

  it('inlines CSS styles', () => {
    const html = renderEmail(
      <EmailTemplate>
        <Heading>Test</Heading>
      </EmailTemplate>,
    );
    // juice should inline the style attribute
    expect(html).toContain('style=');
    // no <style> tag with our content left (juice removes them)
    expect(html).not.toContain('<style>@media');
  });

  it('includes preview text when provided', () => {
    const html = renderEmail(
      <EmailTemplate preview="Preview text here">
        <Text>Content</Text>
      </EmailTemplate>,
    );
    expect(html).toContain('Preview text here');
  });
});
