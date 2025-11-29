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
 * Validate and correct level settings based on actual progress
 * This ensures the level matches what the user has actually achieved
 */
export async function validateAndCorrectLevel(): Promise<LevelSettings> {
  const settings = await getLevelSettings();
  
  // Validate that the current level matches the consecutive perfect days
  const perfectDays = settings.consecutivePerfectDays;
  
  let correctedLevel: AdhkarLevel = 1;
  let needsCorrection = false;
  
  // Determine correct level based on perfect days
  // User starts at Level 1 and must earn higher levels
  if (perfectDays >= getDaysRequiredForLevelUp(2)) {
    // Has completed level 2 requirements (30 days) -> Level 3
    correctedLevel = 3;
  } else if (perfectDays >= getDaysRequiredForLevelUp(1)) {
    // Has completed level 1 requirements (15 days) -> Level 2
    correctedLevel = 2;
  } else {
    // Hasn't completed level 1 requirements -> Stay at Level 1
    correctedLevel = 1;
  }
  
  // Check if level needs correction
  if (correctedLevel !== settings.currentLevel) {
    needsCorrection = true;
  }
  
  // Check if system should be enabled (enable by default)
  const shouldEnable = !settings.enabled;
  
  // If corrections are needed, apply them
  if (needsCorrection || shouldEnable) {
    const correctedSettings: LevelSettings = {
      ...settings,
      currentLevel: correctedLevel,
      enabled: true, // Always enable the level system
    };
    await saveLevelSettings(correctedSettings);
    
    if (needsCorrection) {
      console.log(`[LevelSettings] Corrected: Level changed from ${settings.currentLevel} to ${correctedLevel} based on ${perfectDays} perfect days`);
    }
    if (shouldEnable) {
      console.log('[LevelSettings] Enabled level system');
    }
    
    return correctedSettings;
  }
  
  return settings;
}

/**
 * Reset all level data to start fresh
 */
export async function resetLevelData(): Promise<LevelSettings> {
  const freshSettings: LevelSettings = {
    enabled: true,
    currentLevel: 1,
    consecutivePerfectDays: 0,
    consecutiveMissedDays: 0,
    lastCheckedDate: '',
    autoProgressionEnabled: true,
  };
  await saveLevelSettings(freshSettings);
  console.log('[LevelSettings] Reset to fresh state: Level 1, 0 perfect days, system enabled');
  return freshSettings;
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
 * Get days required for level up
 */
export function getDaysRequiredForLevelUp(currentLevel: AdhkarLevel): number {
  switch (currentLevel) {
    case 1:
      return 15; // Level 1 -> 2 requires 15 days
    case 2:
      return 30; // Level 2 -> 3 requires 30 days
    case 3:
      return 0; // Already at max level
    default:
      return 0;
  }
}

/**
 * Check if should level up based on current level
 */
function shouldLevelUp(settings: LevelSettings): boolean {
  if (!settings.enabled || !settings.autoProgressionEnabled || settings.currentLevel >= 3) {
    return false;
  }
  
  const daysRequired = getDaysRequiredForLevelUp(settings.currentLevel);
  return settings.consecutivePerfectDays >= daysRequired;
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

  // Only check once per day - BUT allow update if completing all 3 for first time today
  // This ensures the perfect day counter increments when all 3 are done
  if (settings.lastCheckedDate === today) {
    console.log('[LevelSettings] Already checked today');
    
    // If already checked but NOW all 3 are complete, we need to update
    // Check if we need to increment (this handles the case where individual adhkars
    // were completed separately throughout the day)
    if (completedAllToday) {
      console.log('[LevelSettings] But all 3 completed - ensuring perfect day is counted');
      // Don't return early - continue to process
    } else {
      console.log('[LevelSettings] Not all complete yet, skipping');
      return {
        changed: false,
        oldLevel: settings.currentLevel,
        newLevel: settings.currentLevel,
        reason: 'none',
      };
    }
  }

  const updatedSettings = { ...settings };
  updatedSettings.lastCheckedDate = today;

  console.log('[LevelSettings] Checking level update...');
  console.log('Completed all today:', completedAllToday);
  console.log('Current perfect days:', settings.consecutivePerfectDays);

  if (completedAllToday) {
    // Only increment if we haven't already counted this day
    if (settings.lastCheckedDate !== today || settings.consecutivePerfectDays === 0) {
      updatedSettings.consecutivePerfectDays = settings.consecutivePerfectDays + 1;
      updatedSettings.consecutiveMissedDays = 0;
      console.log('[LevelSettings] ✅ Perfect day! New count:', updatedSettings.consecutivePerfectDays);
    } else {
      console.log('[LevelSettings] Perfect day already counted');
    }
  } else {
    updatedSettings.consecutiveMissedDays += 1;
    updatedSettings.consecutivePerfectDays = 0;
    console.log('[LevelSettings] ❌ Missed day. Reset perfect days.');
  }

  let result: LevelChangeResult = {
    changed: false,
    oldLevel: settings.currentLevel,
    newLevel: settings.currentLevel,
    reason: 'none',
  };

  if (shouldLevelUp(updatedSettings)) {
    const newLevel = (updatedSettings.currentLevel + 1) as AdhkarLevel;
    console.log('[LevelSettings] 🎉 LEVEL UP!', settings.currentLevel, '->', newLevel);
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
    console.log('[LevelSettings] 📉 Level down:', settings.currentLevel, '->', newLevel);
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
  console.log('[LevelSettings] Saved updated settings:', updatedSettings);
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
