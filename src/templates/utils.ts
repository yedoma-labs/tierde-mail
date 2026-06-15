import { DateTime } from '@yedoma-labs/tuuru-chrono-tz';

// Year is locale-independent — a 4-digit number in every calendar system we support.
// locale param is accepted for API consistency but year formatting is handled by DateTime.
export function currentYear(_locale?: string): string {
  return DateTime.now().format('YYYY');
}
