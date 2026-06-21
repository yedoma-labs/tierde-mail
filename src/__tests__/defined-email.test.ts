import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineEmail } from '../define-email.js';
import type { DefinedEmail, EmailTemplate } from '../types.js';
import { resolveSubject } from '../types.js';

interface Props {
  name: string;
}

describe('DefinedEmail type', () => {
  it('defineEmail returns a value assignable to DefinedEmail<Props>', () => {
    const tmpl = defineEmail<Props>({
      subject: ({ name }) => `Hi ${name}`,
      component: () => null as never,
    });

    // Canonical name and the underlying type are interchangeable.
    const asDefined: DefinedEmail<Props> = tmpl;
    const asTemplate: EmailTemplate<Props> = asDefined;

    expectTypeOf<DefinedEmail<Props>>().toEqualTypeOf<EmailTemplate<Props>>();
    expect(resolveSubject(asTemplate.subject, { name: 'Ada' })).toBe('Hi Ada');
  });
});
