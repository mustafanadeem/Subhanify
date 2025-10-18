# Adhkar Time-Based Highlighting Feature

## Overview
The Adhkar cards on the home screen now highlight based on prayer times to show users which Adhkar they should read at the current time.

## Time Periods

### Morning Adhkar 🌅
- **Active from**: Fajr time **to** Sunrise time
- **Highlighted**: Sunrise gradient with "Active Now" badge
- **Purpose**: Adhkar Al-Sabah (Morning remembrances)

### Evening Adhkar 🌇
- **Active from**: Asr time (user's chosen school) **to** Maghrib time
- **Highlighted**: Sunset gradient with "Active Now" badge  
- **Purpose**: Adhkar Al-Masaa (Evening remembrances)

### Night Adhkar 🌙
- **Active from**: Maghrib time **to** Fajr time (next day)
- **Highlighted**: Night sky gradient with "Active Now" badge
- **Purpose**: Before Sleep (Night remembrances)
- **Note**: Covers the entire night period from sunset to dawn

## Visual Design

### Highlighted Card (Active Period) ✨
The highlighted card is **5% larger** than normal cards and features beautiful gradient backgrounds:

#### Morning Adhkar (Sunrise Gradient)
- **Light Mode**: Warm sunrise colors (yellow-orange-red gradient)
  - Colors: `#FFE082 → #FFAB91 → #FF8A65 → #FF7043 → #FF5722`
- **Dark Mode**: Dawn colors (deep blue to light blue gradient)
  - Colors: `#1A237E → #283593 → #3949AB → #5C6BC0 → #7986CB`

#### Evening Adhkar (Sunset Gradient)
- **Light Mode**: Warm sunset colors (orange-amber gradient)
  - Colors: `#FF6F00 → #FF8F00 → #FFA000 → #FFB300 → #FFC107`
- **Dark Mode**: Twilight colors (deep purple to light purple gradient)
  - Colors: `#4A148C → #6A1B9A → #8E24AA → #AB47BC → #CE93D8`

#### Night Adhkar (Night Sky Gradient)
- **Light Mode**: Dark night sky (dark blue to deep purple)
  - Colors: `#1A1A2E → #16213E → #0F3460 → #533483 → #16213E`
- **Dark Mode**: Starry night (deep navy to slate)
  - Colors: `#0D1B2A → #1B263B → #415A77 → #778DA9 → #415A77`

#### Design Elements
- **Size**: 5% larger with `transform: scale(1.05)`
- **Badge**: Semi-transparent white "Active Now" badge in top-right corner
- **Icon**: Larger (68x68px) with semi-transparent white background
- **Text**: Larger, white, with subtle text shadow for depth
- **Count Badge**: Larger with semi-transparent white background
- **Shadow**: Deep shadow for elevated appearance
- **Gradient**: Diagonal gradient from top-left to bottom-right

### Normal Card (Inactive Period)
- **Background**: White in light mode, dark gray in dark mode
- **Border**: Light gray, 1px thick
- **Size**: Standard size
- **No badge**: Clean minimal design
- **Icon Container**: Gray background (56x56px)
- **Count Badge**: Gray background
- **No gradient**: Flat color background

## Implementation

### Files Modified

1. **`utils/adhkar-time-utils.ts`** (NEW)
   - `getCurrentAdhkarPeriod()`: Determines current period based on prayer times
   - Returns: `'morning'`, `'evening'`, or `'none'`
   - Uses user's Asr school preference (Mithl 1 or Mithl 2)

2. **`components/category-card.tsx`**
   - Added `isHighlighted` prop
   - Added `categoryType` prop ('morning', 'evening', or 'other')
   - Conditional rendering for highlighted vs normal cards
   - LinearGradient background with sunrise/sunset colors
   - "Active Now" badge component
   - Larger size and enhanced styling for highlighted cards
   - Text shadows for depth on gradient backgrounds

3. **`app/(tabs)/index.tsx`**
   - Loads prayer times and settings
   - Calculates current period
   - Determines categoryType for each card
   - Passes `isHighlighted` and `categoryType` to CategoryCard
   - **FOR TESTING**: Currently hardcoded to `'morning'`

4. **`package.json`**
   - Added `expo-linear-gradient` dependency for gradient backgrounds

## Testing the UI

In `app/(tabs)/index.tsx`, line 62, you can change the `currentPeriod` to test different states:

```typescript
// Test Morning highlight (sunrise gradient)
const currentPeriod: AdhkarPeriod = 'morning';

// Test Evening highlight (sunset gradient)
const currentPeriod: AdhkarPeriod = 'evening';

// Test Night highlight (night sky gradient)
const currentPeriod: AdhkarPeriod = 'night';

// Test no highlight (outside time periods)
const currentPeriod: AdhkarPeriod = 'none';
```

## Production Usage

To enable real-time checking, uncomment line 63 in `app/(tabs)/index.tsx`:

```typescript
// Replace the hardcoded test value with:
const currentPeriod: AdhkarPeriod = getCurrentAdhkarPeriod(prayerTimes, settings);
```

This will:
1. Load the user's prayer times
2. Load their Asr school preference
3. Automatically determine the current period
4. Highlight the appropriate card

## How It Works

1. **Load Data**: App loads prayer times and user settings on mount
2. **Calculate Period**: `getCurrentAdhkarPeriod()` checks current time against:
   - Fajr → Sunrise (Morning)
   - Asr → Maghrib (Evening)
   - Maghrib → Fajr (Night) - covers entire nighttime
3. **Highlight Card**: If category matches current period, `isHighlighted=true`
4. **Apply Gradient**: Based on `categoryType`, applies appropriate gradient:
   - Morning: Sunrise colors
   - Evening: Sunset colors
   - Night: Night sky colors
5. **Visual Feedback**: Card displays larger with gradient and "Active Now" badge

## User Experience

- **Clear Visual Indicator**: Users immediately see which Adhkar to read
- **Time-Appropriate**: Follows Islamic tradition for morning/evening times
- **Respects Preferences**: Uses user's chosen Asr calculation method
- **Works in Both Themes**: Green highlighting adapts to light/dark mode

## Future Enhancements

- Add notifications when Adhkar periods begin
- Show time remaining in current period
- Option to customize highlight colors
- Animated transition when periods change

