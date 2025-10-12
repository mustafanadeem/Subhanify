# Arabic Fonts Implementation

## Overview

This app now supports two Arabic fonts that users can switch between dynamically:

- **KFGQPC Hafs** (Hafs-Regular.otf)
- **PDMS Saleem Quran** (Saleen-Regular.ttf)

## Font Files

The font files are located in:

```
assets/fonts/
├── Hafs-Regular.otf
└── Saleen-Regular.ttf
```

## Implementation Details

### 1. Font Loading (app/\_layout.tsx)

- Fonts are loaded at app startup using `expo-font`'s `useFonts` hook
- The splash screen is kept visible until fonts are loaded
- Both fonts are registered with their proper family names:
  - `Hafs-Regular` → Hafs-Regular.otf
  - `Saleen-Regular` → Saleen-Regular.ttf

### 2. Font Context (contexts/FontContext.tsx)

- A React Context provides font state management across the app
- Uses AsyncStorage to persist the user's font preference
- Exports:
  - `useFont()` hook: Access font state and methods
  - `arabicFont`: Current selected font ("Hafs" or "Saleen")
  - `setArabicFont()`: Change the font and persist to storage
  - `getFontFamily()`: Get the actual font family name for styling

### 3. Font Selection UI (app/appearance-settings.tsx)

- Users can select their preferred Arabic font from the Appearance settings
- Shows a preview of the selected font with sample Arabic text
- Font selection is persisted immediately using AsyncStorage
- Preview updates in real-time when font is changed

### 4. Font Application (app/adhkar-detail.tsx)

- Arabic text in adhkar cards uses the selected font via `getFontFamily()`
- Applied to both the current adhkar and the animated next adhkar
- Font changes are reflected immediately without app restart

## Usage

### For Users

1. Navigate to Settings → Appearance
2. Tap on "Arabic Font" section
3. Select either "KFGQPC Hafs" or "PDMS Saleem Quran"
4. Preview the font in the "Text Preview" section
5. The selected font will be applied to all Arabic text throughout the app

### For Developers

To use the font in any component:

```tsx
import { useFont } from "@/contexts/FontContext";

function MyComponent() {
  const { getFontFamily } = useFont();

  return <Text style={{ fontFamily: getFontFamily() }}>Arabic text here</Text>;
}
```

To add a new font:

1. Add the font file to `assets/fonts/`
2. Register it in `app/_layout.tsx` using `useFonts`
3. Add the font type to `ArabicFont` type in `contexts/FontContext.tsx`
4. Add mapping in `FONT_MAP` object
5. Update the font options in `app/appearance-settings.tsx`

## Technical Notes

- Font preferences are stored in AsyncStorage with key: `@subhanify_arabic_font`
- Default font is "Hafs" if no preference is saved
- Font loading happens before the app renders to prevent font flashing
- The FontProvider wraps the entire app at the root level
- Font family names must match exactly what's registered in `useFonts`

## File Structure

```
app/
├── _layout.tsx              # Font loading & FontProvider wrapper
└── appearance-settings.tsx  # Font selection UI

contexts/
└── FontContext.tsx          # Font state management & persistence

assets/fonts/
├── Hafs-Regular.otf         # KFGQPC Hafs font
└── Saleen-Regular.ttf       # PDMS Saleem Quran font
```

