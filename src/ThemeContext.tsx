import type { Context } from 'react';
import { createContext, useContext } from 'react';
import type { Theme } from './theme.js';
import { defaultTheme } from './theme.js';

export const ThemeContext: Context<Theme> = createContext<Theme>(defaultTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
