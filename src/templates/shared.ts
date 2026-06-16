import type { Theme } from '../theme.js';

/** Common base props every template accepts. Extend with template-specific strings type. */
export interface BaseTemplateProps<S = Record<string, unknown>> {
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  theme?: Theme;
  strings?: Partial<S>;
}

/** Security/audit context included in account-event emails. */
export interface SecurityDetails {
  ipAddress?: string;
  location?: string;
  device?: string;
  timestamp?: string;
}

/** A single before/after field change, used in profile and account update emails. */
export interface ChangeRecord {
  field: string;
  oldValue?: string;
  newValue: string;
}

/** A single entry in a login activity log. */
export interface LoginEvent extends SecurityDetails {
  timestamp: string;
  status: 'success' | 'failed';
}
