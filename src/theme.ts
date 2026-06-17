export interface Theme {
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  background: string;
  cardBackground: string;
  accentBar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  fontFamily: string;
  borderRadius: string;
  buttonBorderRadius: string;
  maxWidth: string;
  logo?: string | undefined;
  logoAlt?: string | undefined;
  logoWidth?: number | undefined;
}

export const defaultTheme: Theme = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryText: '#ffffff',
  secondary: '#f1f5f9',
  secondaryText: '#334155',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  accentBar: '#4f46e5',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  border: '#e2e8f0',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  borderRadius: '12px',
  buttonBorderRadius: '8px',
  maxWidth: '600px',
};

export function createTheme(overrides: Partial<Theme>): Theme {
  return { ...defaultTheme, ...overrides };
}

// Dark mode design tokens — single source of truth for all @media (prefers-color-scheme: dark) rules.
// Senior designer rationale:
//   background     slate-900 #0f172a — deep navy, avoids harsh pure black, reduces eye strain
//   cardBackground slate-800 #1e293b — elevated surface with clear depth from bg
//   primary        indigo-500 #6366f1 — brighter than light-mode indigo-600, pops on dark surface
//   textPrimary    slate-100 #f1f5f9 — near-white, softer than #fff; ≥12:1 contrast on card
//   textSecondary  slate-300 #cbd5e1 — clear hierarchy below primary; ≥7:1 on card
//   textMuted      slate-400 #94a3b8 — readable muted; ~4.5:1 on card (WCAG AA minimum)
//   border         slate-700 #334155 — visible but not distracting dividers
export interface DarkTheme {
  background: string;
  cardBackground: string;
  accentBar: string;
  primary: string;
  primaryText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
}

export const darkTheme: DarkTheme = {
  background: '#0f172a',
  cardBackground: '#1e293b',
  accentBar: '#6366f1',
  primary: '#6366f1',
  primaryText: '#ffffff',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  border: '#334155',
};
