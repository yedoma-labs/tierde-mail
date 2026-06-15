import { DateTime } from '@yedoma-labs/tuuru-chrono-tz';

export function currentYear(): string {
  return DateTime.now().format('YYYY');
}
