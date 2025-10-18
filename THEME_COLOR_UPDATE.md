# Theme Color Update - Light Mode

## Overview
Updated the light theme colors throughout the app to use a new, modern color palette.

## New Color Palette (Light Mode)

- **Main (Deep Royal Blue)**: `#002685` - Used for selected tab icons and primary elements
- **Accent (Teal Cyan)**: `#00C2CB` - Used for tint color, links, and streaks card
- **Background (Soft White)**: `#F5F7FA` - Main background color
- **Text (Charcoal)**: `#1A1A1A` - Primary text color
- **Secondary (Cool Gray)**: `#B0BEC5` - Used for icons and secondary text
- **Card Background**: `#FFFFFF` - Pure white for card backgrounds

## Files Modified

### 1. `constants/theme.ts`
Updated the light theme color definitions:
- `text`: `#1A1A1A` (Charcoal)
- `background`: `#F5F7FA` (Soft White)
- `tint`: `#00C2CB` (Teal Cyan)
- `icon`: `#B0BEC5` (Cool Gray)
- `tabIconDefault`: `#B0BEC5` (Cool Gray)
- `tabIconSelected`: `#002685` (Deep Royal Blue)
- `textSecondary`: `#B0BEC5` (Cool Gray)
- `cardBackground`: `#FFFFFF`
- `headerBackground`: `#F5F7FA` (Soft White)

### 2. `components/themed-text.tsx`
- Updated link color from `#0a7ea4` to `#00C2CB` (Teal Cyan)

### 3. `app/(tabs)/_layout.tsx`
- Updated `tabBarActiveTintColor` to use `Colors.tabIconSelected` (Deep Royal Blue)
- Added `tabBarInactiveTintColor` to use `Colors.tabIconDefault` (Cool Gray)

### 4. `app/(tabs)/index.tsx`
- Updated tabs container to use `Colors.cardBackground`
- Updated active tab background to use `Colors.background`
- Updated active tab text color to use `Colors.tabIconSelected` (Deep Royal Blue)

### 5. `components/prayer-time-card.tsx`
- Added `Colors` import
- Updated card background for loading state to use `Colors.cardBackground`
- Updated ActivityIndicator color to use `Colors.tint`
- Updated prayer card background to use `Colors.tabIconSelected` (Deep Royal Blue) in light mode

### 6. `components/streaks-card.tsx`
- Added `Colors` import
- Updated card background to use `Colors.tint` (Teal Cyan) in light mode

### 7. `components/category-card.tsx`
- Added `Colors` import
- Updated normal card background to use `Colors.cardBackground`
- Updated icon container background to use `Colors.background`
- Updated icon color to use `Colors.text`
- Updated badge background to use `Colors.background`
- Updated clock icon color to use `Colors.textSecondary`

### 8. `components/dua-card.tsx`
- Added `Colors` import
- Updated card background to use `Colors.cardBackground`
- Updated icon container background to use `Colors.background`
- Updated icon color to use `Colors.text`
- Updated badge background to use `Colors.background`

## Visual Changes

### Home Screen
- Background changed to soft white (`#F5F7FA`)
- Text changed to charcoal (`#1A1A1A`)
- Prayer time card now uses deep royal blue (`#002685`)
- Streaks card now uses teal cyan (`#00C2CB`)
- Adhkar/Duas tabs show deep royal blue (`#002685`) when selected
- Inactive tab icons use cool gray (`#B0BEC5`)

### Tab Bar
- Selected tab icons display in deep royal blue (`#002685`)
- Unselected tab icons display in cool gray (`#B0BEC5`)

### Cards
- Card backgrounds are pure white (`#FFFFFF`)
- Icon containers use soft white background (`#F5F7FA`)
- Text is charcoal (`#1A1A1A`)
- Secondary elements use cool gray (`#B0BEC5`)

## Testing
To see the changes:
1. Restart the Expo development server: `npx expo start --clear`
2. Reload the app on your device/simulator
3. Verify that all colors match the new theme in light mode


