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
}

const DEFAULT_SETTINGS: LevelSettings = {
  enabled: false,
  currentLevel: 1,
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
