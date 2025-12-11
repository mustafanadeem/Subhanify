import { TodayPrayerTimes, UserSettings } from '@/modules/prayer-times/domain/entities';

export type AdhkarPeriod = 'morning' | 'evening' | 'night' | 'none';

/**
 * Determines which Adhkar period is currently active based on prayer times
 * Morning: From Fajr to Sunrise
 * Evening: From Asr (user's chosen time) to Maghrib
 * Night: From Maghrib to Midnight (calculated as midpoint between Maghrib and Fajr)
 */
export function getCurrentAdhkarPeriod(
  prayerTimes: TodayPrayerTimes | null,
  settings: UserSettings | null
): AdhkarPeriod {
  if (!prayerTimes || !settings) {
    return 'none';
  }

  const now = new Date();
  
  // Get prayer times
  const fajrTime = new Date(prayerTimes.fajr.timeIso);
  const sunriseTime = new Date(prayerTimes.sunrise.timeIso);
  const maghribTime = new Date(prayerTimes.maghrib.timeIso);
  const midnightTime = new Date(prayerTimes.midnight.timeIso);
  
  // Get Asr time based on user's school preference
  const asrTime = settings.schoolPrimary === 0 
    ? new Date(prayerTimes.asrMithl1.timeIso)
    : new Date(prayerTimes.asrMithl2.timeIso);

  // Check if we're in Morning period (Fajr to Sunrise)
  if (now >= fajrTime && now < sunriseTime) {
    return 'morning';
  }

  // Check if we're in Evening period (Asr to Maghrib)
  if (now >= asrTime && now < maghribTime) {
    return 'evening';
  }

  // Check if we're in Night period (Maghrib to Midnight)
  if (now >= maghribTime && now < midnightTime) {
    return 'night';
  }

  return 'none';
}

/**
 * For testing purposes - force a specific period
 */
export function getAdhkarPeriodForTesting(period: AdhkarPeriod): AdhkarPeriod {
  return period;
}

/**
 * Get formatted time range for when adhkar should be recited
 */
export function getAdhkarTimeRange(
  category: string,
  prayerTimes: TodayPrayerTimes | null,
  settings: UserSettings | null
): string | null {
  if (!prayerTimes || !settings) {
    return null;
  }

  const formatTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  switch (category) {
    case 'morning':
      return `${formatTime(prayerTimes.fajr.timeIso)} - ${formatTime(prayerTimes.sunrise.timeIso)}`;
    
    case 'evening': {
      const asrTime = settings.schoolPrimary === 0 
        ? prayerTimes.asrMithl1.timeIso
        : prayerTimes.asrMithl2.timeIso;
      return `${formatTime(asrTime)} - ${formatTime(prayerTimes.maghrib.timeIso)}`;
    }
    
    case 'night':
      return `${formatTime(prayerTimes.maghrib.timeIso)} - ${formatTime(prayerTimes.midnight.timeIso)}`;
    
    default:
      return null;
  }
}

/**
 * Get simple time description for adhkar timing
 */
export function getAdhkarTimeDescription(category: string): string | null {
  switch (category) {
    case 'morning':
      return 'After Fajr until Sunrise';
    case 'evening':
      return 'After Asr until Maghrib';
    case 'night':
      return 'After Maghrib until Midnight';
    default:
      return null;
  }
}
