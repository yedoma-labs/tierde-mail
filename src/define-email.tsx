import type { EmailDefinition, EmailTemplate } from './types.js';

export function defineEmail<Props>(definition: EmailDefinition<Props>): EmailTemplate<Props> {
  return {
    ...definition,
    __propsType: undefined as unknown as Props,
  };
}
