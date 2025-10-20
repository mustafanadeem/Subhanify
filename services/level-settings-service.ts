/**
 * Level Settings Service
 * 
 * Manages user level preferences for adhkar progression
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVEL_SETTINGS_KEY = '@level_settings';

export type AdhkarLevel = 1 | 2 | 3;

export interface LevelSettings {
  enabled: boolean;
  currentLevel: AdhkarLevel;
  consecutivePerfectDays: number;
  consecutiveMissedDays: number;
  lastCheckedDate: string;
  autoProgressionEnabled: boolean;
}

const DEFAULT_SETTINGS: LevelSettings = {
  enabled: false,
  currentLevel: 1,
  consecutivePerfectDays: 0,
  consecutiveMissedDays: 0,
  lastCheckedDate: '',
  autoProgressionEnabled: true,
};

/**
 * Get Level Settings
 */
export async function getLevelSettings(): Promise<LevelSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(LEVEL_SETTINGS_KEY);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[LevelSettings] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save Level Settings
 */
export async function saveLevelSettings(settings: LevelSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(LEVEL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[LevelSettings] Error saving settings:', error);
  }
}

/**
 * Reset Level Settings
 */
export async function resetLevelSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEVEL_SETTINGS_KEY);
  } catch (error) {
    console.error('[LevelSettings] Error resetting settings:', error);
  }
}

/**
 * Get Level Description
 */
export function getLevelDescription(level: AdhkarLevel): string {
  switch (level) {
    case 1:
      return 'Essential adhkar - Perfect for starting your journey';
    case 2:
      return 'Core daily adhkar - Building consistent habits';
    case 3:
      return 'Comprehensive adhkar - Complete spiritual practice';
    default:
      return '';
  }
}

/**
 * Get Level Icon
 */
export function getLevelIcon(level: AdhkarLevel): string {
  switch (level) {
    case 1:
      return 'leaf.fill';
    case 2:
      return 'star.fill';
    case 3:
      return 'flame.fill';
    default:
      return 'star.fill';
  }
}

/**
 * Get Level Label
 */
export function getLevelLabel(level: AdhkarLevel): string {
  switch (level) {
    case 1:
      return 'Beginner';
    case 2:
      return 'Intermediate';
    case 3:
      return 'Advanced';
    default:
      return '';
  }
}

/**
 * Get current date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if should level up (10 consecutive perfect days)
 */
function shouldLevelUp(settings: LevelSettings): boolean {
  return (
    settings.enabled &&
    settings.autoProgressionEnabled &&
    settings.currentLevel < 3 &&
    settings.consecutivePerfectDays >= 10
  );
}

/**
 * Check if should level down (2 consecutive missed days)
 */
function shouldLevelDown(settings: LevelSettings): boolean {
  return (
    settings.enabled &&
    settings.autoProgressionEnabled &&
    settings.currentLevel > 1 &&
    settings.consecutiveMissedDays >= 2
  );
}

export interface LevelChangeResult {
  changed: boolean;
  oldLevel: AdhkarLevel;
  newLevel: AdhkarLevel;
  reason: 'level_up' | 'level_down' | 'none';
}

/**
 * Check and update level based on adhkar completion
 * Returns info about level change if any occurred
 */
export async function checkAndUpdateLevel(
  completedAllToday: boolean
): Promise<LevelChangeResult> {
  const settings = await getLevelSettings();
  const today = getTodayDateString();

  if (!settings.enabled || !settings.autoProgressionEnabled) {
    return {
      changed: false,
      oldLevel: settings.currentLevel,
      newLevel: settings.currentLevel,
      reason: 'none',
    };
  }

  if (settings.lastCheckedDate === today) {
    return {
      changed: false,
      oldLevel: settings.currentLevel,
      newLevel: settings.currentLevel,
      reason: 'none',
    };
  }

  const updatedSettings = { ...settings };
  updatedSettings.lastCheckedDate = today;

  if (completedAllToday) {
    updatedSettings.consecutivePerfectDays += 1;
    updatedSettings.consecutiveMissedDays = 0;
  } else {
    updatedSettings.consecutiveMissedDays += 1;
    updatedSettings.consecutivePerfectDays = 0;
  }

  let result: LevelChangeResult = {
    changed: false,
    oldLevel: settings.currentLevel,
    newLevel: settings.currentLevel,
    reason: 'none',
  };

  if (shouldLevelUp(updatedSettings)) {
    const newLevel = (updatedSettings.currentLevel + 1) as AdhkarLevel;
    result = {
      changed: true,
      oldLevel: updatedSettings.currentLevel,
      newLevel: newLevel,
      reason: 'level_up',
    };
    updatedSettings.currentLevel = newLevel;
    updatedSettings.consecutivePerfectDays = 0;
  } else if (shouldLevelDown(updatedSettings)) {
    const newLevel = (updatedSettings.currentLevel - 1) as AdhkarLevel;
    result = {
      changed: true,
      oldLevel: updatedSettings.currentLevel,
      newLevel: newLevel,
      reason: 'level_down',
    };
    updatedSettings.currentLevel = newLevel;
    updatedSettings.consecutiveMissedDays = 0;
  }

  await saveLevelSettings(updatedSettings);
  return result;
}

/**
 * Reset progression tracking (useful when user manually changes level)
 */
export async function resetProgression(): Promise<void> {
  const settings = await getLevelSettings();
  settings.consecutivePerfectDays = 0;
  settings.consecutiveMissedDays = 0;
  settings.lastCheckedDate = '';
  await saveLevelSettings(settings);
}
