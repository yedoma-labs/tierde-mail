import { renderToStaticMarkup } from 'react-dom/server';
import juice from 'juice';
import type { ReactElement } from 'react';

const DOCTYPE = '<!DOCTYPE html>';

export function renderEmail(element: ReactElement): string {
  const raw = renderToStaticMarkup(element);
  const withDoctype = raw.startsWith('<!DOCTYPE') ? raw : `${DOCTYPE}${raw}`;
  return juice(withDoctype, {
    removeStyleTags: true,
    preserveMediaQueries: true,
    preserveFontFaces: true,
    insertPreservedExtraCss: false,
  });
}
