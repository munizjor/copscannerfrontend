import { DateTime, Settings } from 'luxon';
Settings.defaultZone = 'utc';

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatLocalTime(timestampString: string) {
  // Parse as UTC, then convert to America/New_York and format
  return DateTime.fromSQL(timestampString, { zone: 'utc' })
    .setZone(browserZone)
    .toFormat('M/d/yyyy, h:mm:ss a');
}
