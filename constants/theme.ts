/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * 
 * LIGHT MODE COLOR PALETTE - Change these colors to update the entire app theme:
 * Main: #002685 (Deep Royal Blue) - Primary cards, active states, selected tabs
 * Accent: #A6B1E1 (Lavender Blue) - Streaks card, interactive elements
 * Background: #F5F6FA (Pale Mist) - Main background
 * Text: #101820 (Dark Charcoal) - All text
 * Secondary: #DADCE0 (Soft Gray) - Inactive elements, icons
 * Highlight: #FFC6C6 (Soft Rose) - "Active Now" badges, special highlights
 */

import { Platform } from 'react-native';

// ========================================
// 🎨 LIGHT MODE PALETTE - EDIT THESE 5 COLORS
// ========================================
const LIGHT_MAIN = '#007AFF';        // iOS Blue
const LIGHT_ACCENT = '#007AFF';      // iOS Blue
const LIGHT_BACKGROUND = '#F5F6FA';  // Pale Mist
const LIGHT_TEXT = '#101820';        // Dark Charcoal
const LIGHT_SECONDARY = '#999999';   // Medium Gray
const LIGHT_HIGHLIGHT = '#007AFF';   // iOS Blue

// ========================================
// 🌙 DARK MODE PALETTE - EDIT THESE 5 COLORS
// ========================================
const DARK_MAIN = '#0A84FF';         // iOS Blue (Dark)
const DARK_ACCENT = '#0A84FF';       // iOS Blue (Dark)
const DARK_BACKGROUND = '#000000';   // Pure Black
const DARK_TEXT = '#ECEDEE';         // Off White
const DARK_SECONDARY = '#9BA1A6';    // Gray
const DARK_HIGHLIGHT = '#0A84FF';    // iOS Blue (Dark)

// ========================================
// 📦 EXPORTED COLORS (Don't edit this section)
// ========================================
export const Colors = {
  light: {
    // Core colors
    main: LIGHT_MAIN,
    accent: LIGHT_ACCENT,
    background: LIGHT_BACKGROUND,
    text: LIGHT_TEXT,
    secondary: LIGHT_SECONDARY,
    highlight: LIGHT_HIGHLIGHT,
    
    // Derived colors (automatically use core colors)
    tint: LIGHT_ACCENT,
    icon: LIGHT_SECONDARY,
    tabIconDefault: LIGHT_SECONDARY,
    tabIconSelected: LIGHT_MAIN,
    textSecondary: LIGHT_SECONDARY,
    cardBackground: '#FFFFFF',
    headerBackground: LIGHT_BACKGROUND,
    
    // Component-specific colors (uses core palette)
    prayerCard: LIGHT_MAIN,
    streaksCard: LIGHT_ACCENT,
    activeAdhkarCard: LIGHT_MAIN,
    inactiveCard: '#FFFFFF',
    activeBadge: LIGHT_HIGHLIGHT,  // Using Golden Sand for "Active Now" badge
  },
  dark: {
    // Core colors
    main: DARK_MAIN,
    accent: DARK_ACCENT,
    background: DARK_BACKGROUND,
    text: DARK_TEXT,
    secondary: DARK_SECONDARY,
    highlight: DARK_HIGHLIGHT,
    
    // Derived colors (automatically use core colors)
    tint: DARK_ACCENT,
    icon: DARK_SECONDARY,
    tabIconDefault: DARK_SECONDARY,
    tabIconSelected: DARK_TEXT,
    textSecondary: DARK_SECONDARY,
    cardBackground: '#1C1C1E',
    headerBackground: DARK_BACKGROUND,
    
    // Component-specific colors (uses core palette)
    prayerCard: '#2D5F3F',
    streaksCard: DARK_MAIN,
    activeAdhkarCard: DARK_MAIN,
    inactiveCard: '#1C1C1E',
    activeBadge: DARK_HIGHLIGHT,  // Using Golden Sand for "Active Now" badge
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
