/**
 * Travel Settings Service
 * 
 * Manages user preferences for travel detection including:
 * - Detection on/off
 * - Vehicle types to monitor
 * - Reminder frequency and quiet hours
 * - Privacy settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TravelSettings {
  enabled: boolean;
  vehicleTypes: VehicleType[];
  reminderFrequency: ReminderFrequency;
  quietHours: QuietHours;
  privacySettings: PrivacySettings;
}

export type VehicleType = 'vehicle';

export type ReminderFrequency = 'every_trip' | 'once_daily' | 'twice_daily' | 'custom';

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

export interface PrivacySettings {
  allowAnalytics: boolean;
  allowErrorLogging: boolean;
  shareUsageData: boolean;
}

const TRAVEL_SETTINGS_KEY = '@travel_settings';

const DEFAULT_SETTINGS: TravelSettings = {
  enabled: false,
  vehicleTypes: ['vehicle'],
  reminderFrequency: 'every_trip',
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  },
  privacySettings: {
    allowAnalytics: false,
    allowErrorLogging: false,
    shareUsageData: false,
  },
};

/**
 * Get Travel Settings
 */
export async function getTravelSettings(): Promise<TravelSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(TRAVEL_SETTINGS_KEY);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      // Merge with defaults to handle new settings
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[TravelSettings] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save Travel Settings
 */
export async function saveTravelSettings(settings: TravelSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(TRAVEL_SETTINGS_KEY, JSON.stringify(settings));
    console.log('[TravelSettings] Settings saved');
  } catch (error) {
    console.error('[TravelSettings] Error saving settings:', error);
  }
}

/**
 * Update Specific Setting
 */
export async function updateTravelSetting<K extends keyof TravelSettings>(
  key: K,
  value: TravelSettings[K]
): Promise<void> {
  const settings = await getTravelSettings();
  settings[key] = value;
  await saveTravelSettings(settings);
}

/**
 * Check if Travel Detection is Enabled
 */
export async function isTravelDetectionEnabled(): Promise<boolean> {
  const settings = await getTravelSettings();
  return settings.enabled;
}

/**
 * Check if Vehicle Detection is Enabled
 */
export async function shouldMonitorVehicles(): Promise<boolean> {
  const settings = await getTravelSettings();
  return settings.enabled && settings.vehicleTypes.includes('vehicle');
}

/**
 * Check if Currently in Quiet Hours
 */
export async function isInQuietHours(): Promise<boolean> {
  const settings = await getTravelSettings();
  
  if (!settings.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { startTime, endTime } = settings.quietHours;
  
  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  // Handle same-day quiet hours (e.g., 13:00 to 15:00)
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Check if Should Send Reminder Based on Frequency
 */
export async function shouldSendReminder(lastReminderTime?: number): Promise<boolean> {
  const settings = await getTravelSettings();
  
  if (!settings.enabled) {
    return false;
  }

  // Check quiet hours
  if (await isInQuietHours()) {
    return false;
  }

  if (!lastReminderTime) {
    return true; // First reminder
  }

  const now = Date.now();
  const timeSinceLastReminder = now - lastReminderTime;

  switch (settings.reminderFrequency) {
    case 'every_trip':
      return true; // Always send for each trip

    case 'once_daily':
      return timeSinceLastReminder >= 24 * 60 * 60 * 1000; // 24 hours

    case 'twice_daily':
      return timeSinceLastReminder >= 12 * 60 * 60 * 1000; // 12 hours

    case 'custom':
      return timeSinceLastReminder >= 6 * 60 * 60 * 1000; // 6 hours (default for custom)

    default:
      return true;
  }
}

/**
 * Get Vehicle Type Display Names
 */
export function getVehicleTypeDisplayName(vehicleType: VehicleType): string {
  const displayNames: Record<VehicleType, string> = {
    vehicle: 'Any Vehicle',
  };
  return displayNames[vehicleType];
}

/**
 * Get Reminder Frequency Display Names
 */
export function getReminderFrequencyDisplayName(frequency: ReminderFrequency): string {
  const displayNames: Record<ReminderFrequency, string> = {
    every_trip: 'Every Trip',
    once_daily: 'Once Daily',
    twice_daily: 'Twice Daily',
    custom: 'Custom',
  };
  return displayNames[frequency];
}

/**
 * Validate Quiet Hours Time Format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Reset Settings to Default
 */
export async function resetTravelSettings(): Promise<void> {
  await saveTravelSettings(DEFAULT_SETTINGS);
  console.log('[TravelSettings] Settings reset to default');
}
