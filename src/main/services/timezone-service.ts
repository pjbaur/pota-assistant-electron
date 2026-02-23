/**
 * Timezone Service
 *
 * Provides timezone lookup from latitude/longitude coordinates using geo-tz.
 * Works offline with embedded timezone boundary data.
 */

import geoTz from 'geo-tz';

/**
 * Get the IANA timezone identifier for a given location.
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns IANA timezone identifier (e.g., "America/Denver") or null if not found
 */
export function getTimezone(latitude: number, longitude: number): string | null {
  try {
    // geo-tz returns an array of matching timezones, use the first one
    const result = geoTz(latitude, longitude) as unknown as string[];
    if (Array.isArray(result) && result.length > 0 && result[0] !== undefined) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('[Timezone Service] Error computing timezone:', error);
    return null;
  }
}

/**
 * Format a timezone identifier for display.
 * @param timezone - IANA timezone identifier (e.g., "America/Denver")
 * @returns Formatted string with timezone name and abbreviation (e.g., "Mountain Time (MST)")
 */
export function formatTimezoneForDisplay(timezone: string): string {
  try {
    // Get the short name from the IANA identifier (e.g., "America/Denver" -> "Denver")
    const parts = timezone.split('/');
    const cityName = parts[parts.length - 1]?.replace(/_/g, ' ') ?? timezone;

    // Get current time abbreviation for this timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts2 = formatter.formatToParts(new Date());
    const tzNamePart = parts2.find((p) => p.type === 'timeZoneName');
    const abbreviation = tzNamePart?.value ?? '';

    return `${cityName} (${abbreviation})`;
  } catch {
    return timezone;
  }
}

/**
 * Get the short timezone abbreviation (e.g., "MST", "EST")
 * @param timezone - IANA timezone identifier
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(new Date());
    const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
    return tzNamePart?.value ?? timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get the current offset from UTC for a timezone.
 * @param timezone - IANA timezone identifier
 * @returns Offset string (e.g., "UTC-7", "UTC+5:30")
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const diffMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);

    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const minutes = Math.abs(diffMinutes) % 60;
    const sign = diffMinutes >= 0 ? '+' : '-';

    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return 'UTC?';
  }
}
