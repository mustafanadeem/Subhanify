# 🎨 Color Theme Guide - Easy Color Swapping

## Quick Start: How to Change Colors

To change the entire app's color scheme, you only need to edit **5 colors** at the top of `constants/theme.ts`:

```typescript
// ========================================
// 🎨 LIGHT MODE PALETTE - EDIT THESE 5 COLORS
// ========================================
const LIGHT_MAIN = '#002685';        // Deep Royal Blue
const LIGHT_ACCENT = '#00C2CB';      // Teal Cyan
const LIGHT_BACKGROUND = '#F5F7FA';  // Soft White
const LIGHT_TEXT = '#1A1A1A';        // Charcoal
const LIGHT_SECONDARY = '#B0BEC5';   // Cool Gray
```

**That's it!** The entire app will automatically update.

---

## Color Roles Explained

### 1. **MAIN** (Currently: Deep Royal Blue `#002685`)
**Used for:**
- Prayer time card background
- Active adhkar card background (highlighted cards)
- Selected tab background (Adhkar/Duas selector)
- Selected bottom tab icons
- Primary buttons and actions

**Example locations:**
- The blue "2 Asr Prayer Time" card
- The blue "Adhkar" tab when selected
- The active "Evening Adhkar Al-Masaa" card

---

### 2. **ACCENT** (Currently: Teal Cyan `#00C2CB`)
**Used for:**
- Streaks card background
- "Active Now" badge on highlighted cards
- Interactive elements and highlights
- Links and tappable text

**Example locations:**
- The cyan "1 day Streaks" card
- The cyan "Active Now" badge on active adhkar cards

---

### 3. **BACKGROUND** (Currently: Soft White `#F5F7FA`)
**Used for:**
- Main screen background
- Header background
- Icon container backgrounds in cards
- Tab selector background

**Example locations:**
- The overall screen background
- Behind all the cards and content

---

### 4. **TEXT** (Currently: Charcoal `#1A1A1A`)
**Used for:**
- All primary text throughout the app
- Card titles and content
- Header titles
- Icons in inactive state

**Example locations:**
- "Subhanify" header
- "Morning", "Evening", "Night" card titles
- All readable text content

---

### 5. **SECONDARY** (Currently: Cool Gray `#B0BEC5`)
**Used for:**
- Inactive tab icons
- Secondary text and labels
- Time ranges and subtitles
- Unselected states

**Example locations:**
- Inactive bottom navigation icons
- "Adhkar Al-Sabah" subtitle text
- Time range "5:55 am - 7:30 am"

---

## Example: Changing to a New Color Scheme

Let's say you want a purple theme:

```typescript
// ========================================
// 🎨 LIGHT MODE PALETTE - EDIT THESE 5 COLORS
// ========================================
const LIGHT_MAIN = '#6B46C1';        // Purple
const LIGHT_ACCENT = '#ED64A6';      // Pink
const LIGHT_BACKGROUND = '#FAF5FF';  // Very Light Purple
const LIGHT_TEXT = '#2D3748';        // Dark Gray
const LIGHT_SECONDARY = '#A0AEC0';   // Medium Gray
```

Save the file, and the **entire app updates** automatically!

---

## Where Colors Are Applied

### Components Updated
1. ✅ **Prayer Time Card** → Uses `MAIN` color
2. ✅ **Streaks Card** → Uses `ACCENT` color
3. ✅ **Active Adhkar Cards** → Uses `MAIN` color with gradient
4. ✅ **Inactive Cards** → Uses white with `BACKGROUND` for icons
5. ✅ **"Active Now" Badge** → Uses `ACCENT` color
6. ✅ **Tab Selector** → Selected uses `MAIN`, inactive uses `TEXT`
7. ✅ **Bottom Navigation** → Selected uses `MAIN`, inactive uses `SECONDARY`
8. ✅ **All Text** → Uses `TEXT` color
9. ✅ **Screen Background** → Uses `BACKGROUND` color

---

## Dark Mode Colors

Similarly, you can edit dark mode colors:

```typescript
// ========================================
// 🌙 DARK MODE PALETTE - EDIT THESE 5 COLORS
// ========================================
const DARK_MAIN = '#C44D00';         // Dark Orange
const DARK_ACCENT = '#00C2CB';       // Teal Cyan
const DARK_BACKGROUND = '#151718';   // Almost Black
const DARK_TEXT = '#ECEDEE';         // Off White
const DARK_SECONDARY = '#9BA1A6';    // Gray
```

---

## Technical Details (Don't Edit Unless Needed)

The color system automatically maps your 5 colors to all the UI elements:

```typescript
export const Colors = {
  light: {
    // Core colors (from your 5 variables above)
    main: LIGHT_MAIN,
    accent: LIGHT_ACCENT,
    background: LIGHT_BACKGROUND,
    text: LIGHT_TEXT,
    secondary: LIGHT_SECONDARY,
    
    // Component-specific (automatically uses core colors)
    prayerCard: LIGHT_MAIN,           // Prayer time card
    streaksCard: LIGHT_ACCENT,        // Streaks card
    activeAdhkarCard: LIGHT_MAIN,     // Active highlighted cards
    inactiveCard: '#FFFFFF',          // Regular white cards
    activeBadge: LIGHT_ACCENT,        // "Active Now" badge
    
    // Legacy support (automatically uses core colors)
    tint: LIGHT_ACCENT,
    tabIconSelected: LIGHT_MAIN,
    tabIconDefault: LIGHT_SECONDARY,
    // ... and more
  }
};
```

---

## Tips for Choosing Colors

1. **MAIN**: Should be bold and stand out (used for primary actions)
2. **ACCENT**: Should complement MAIN but be different (used for highlights)
3. **BACKGROUND**: Should be light and not distract from content
4. **TEXT**: Should have high contrast with BACKGROUND (for readability)
5. **SECONDARY**: Should be muted version of TEXT (for less important info)

**Contrast Checker**: Use https://webaim.org/resources/contrastchecker/ to ensure:
- TEXT on BACKGROUND has at least 4.5:1 contrast ratio
- White text on MAIN/ACCENT has at least 4.5:1 contrast ratio

---

## Files Structure

```
constants/
  └── theme.ts          ← Edit the 5 colors here!

components/
  ├── prayer-time-card.tsx    ← Uses Colors.prayerCard
  ├── streaks-card.tsx        ← Uses Colors.streaksCard
  ├── category-card.tsx       ← Uses Colors.activeAdhkarCard & inactiveCard
  └── dua-card.tsx            ← Uses Colors.inactiveCard

app/
  └── (tabs)/
      ├── _layout.tsx         ← Tab bar colors
      └── index.tsx           ← Tab selector colors
```

---

## Testing Your Changes

1. Edit the 5 colors in `constants/theme.ts`
2. Save the file
3. The app should automatically reload
4. If not, press `R` in the Expo terminal or reload on device
5. Check both light and dark modes (if using dark mode)

---

## Troubleshooting

**Q: Colors didn't change**
- Make sure you saved `constants/theme.ts`
- Try reloading the app (press `R` in terminal)
- Try stopping and restarting Expo: `npx expo start --clear`

**Q: Some elements still have old colors**
- Check if there are any hardcoded colors in that component
- The system uses the 5 core colors, but some special effects (like gradients) might have additional colors

**Q: Text is hard to read**
- Check the contrast ratio between TEXT and BACKGROUND
- Use a lighter BACKGROUND or darker TEXT color
- Aim for at least 4.5:1 contrast ratio

---

## Current Color Scheme (as of now)

**Light Mode:**
- Main: `#002685` (Deep Royal Blue) - Prayer cards, active states
- Accent: `#00C2CB` (Teal Cyan) - Streaks, badges
- Background: `#F5F7FA` (Soft White) - Screen background
- Text: `#1A1A1A` (Charcoal) - All text
- Secondary: `#B0BEC5` (Cool Gray) - Inactive elements

This creates a professional, modern look with good contrast and readability.

