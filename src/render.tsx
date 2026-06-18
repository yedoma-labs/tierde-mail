import { inline } from '@css-inline/css-inline';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const DOCTYPE = '<!DOCTYPE html>';

export function renderEmail(element: ReactElement): string {
  const raw = renderToStaticMarkup(element);
  const withDoctype = raw.startsWith('<!DOCTYPE') ? raw : `${DOCTYPE}${raw}`;
  return inline(withDoctype, {
    keepStyleTags: false,
    keepAtRules: true,
    loadRemoteStylesheets: false,
  });
}
