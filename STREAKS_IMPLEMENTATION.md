# Streaks Feature Implementation

## Overview
Implemented a side-by-side layout for the Prayer Times and Streaks cards on the home screen, with an animated fire emoji that provides positive emotional feedback to encourage user engagement.

## Changes Made

### 1. New Component: `components/streaks-card.tsx`
A new card component that displays user engagement streaks with animated fire emoji:

**Features:**
- **Animated Fire Emoji** 🔥
  - Pulsing/breathing animation (scale 1.0 to 1.15)
  - Gentle rotation animation (-5° to +5°)
  - Glowing effect behind the fire
  - All animations run in continuous loops for maximum emotional impact
  
- **Display Information:**
  - Current streak count (days)
  - Encouragement message ("Keep it Going!")
  - Responsive to dark/light theme

**Animation Details:**
- Scale animation: 1200ms cycle (breathing effect)
- Rotation animation: 2000ms cycle (gentle sway)
- Glow animation: 1500ms cycle (pulsing glow)
- All use native driver for smooth 60fps performance

### 2. New Service: `services/streak-service.ts`
Handles streak tracking and persistence:

**Functions:**
- `updateStreak()` - Updates streak when app opens, handles:
  - First time users (starts at 1 day)
  - Consecutive days (increments streak)
  - Broken streaks (resets to 1)
  
- `getCurrentStreak()` - Gets current valid streak count
- `loadStreakData()` - Loads from AsyncStorage
- `resetStreak()` - For testing or user reset

**Data Structure:**
```typescript
interface StreakData {
  currentStreak: number;
  lastOpenDate: string; // ISO date (YYYY-MM-DD)
  longestStreak: number;
  totalDaysOpened: number;
}
```

**Logic:**
- Streak maintained by opening app at least once per day
- Automatically detects broken streaks (missed days)
- Tracks longest streak achieved
- Validates streak on load (checks if still active)

### 3. Modified: `components/prayer-time-card.tsx`
Updated to work in side-by-side layout:

**Changes:**
- Changed from full-width to `flex: 1` layout
- Reduced font sizes for compact display
- Moved tap indicator inside card content
- Adjusted padding and spacing
- Added `minHeight: 140` for consistent sizing
- Reduced moon icon from 80 to 70

### 4. Modified: `app/(tabs)/index.tsx`
Updated home screen to display cards side by side:

**Changes:**
- Imported `StreaksCard` and streak service functions
- Added `streakDays` state variable
- Created `loadStreakData()` function that:
  - Calls `updateStreak()` on app load
  - Retrieves current streak count
  - Updates UI state
  
- Added `cardsRow` container with flexbox layout
- Added 12px spacer between cards
- Cards now use equal flex sizing (1:1 ratio)

**New Styles:**
```typescript
cardsRow: {
  flexDirection: "row",
  marginHorizontal: 20,
  marginBottom: 20,
},
cardSpacer: {
  width: 12,
},
```

## Visual Design

### Color Scheme
- **Prayer Time Card:** Green gradient
  - Light mode: `#7CB342`
  - Dark mode: `#2D5F3F`
  
- **Streaks Card:** Orange/fire gradient
  - Light mode: `#FF8C42`
  - Dark mode: `#C44D00`

### Layout
```
┌─────────────────────────────────────────┐
│  Prayer Time Card  │  Streaks Card      │
│  (Green)           │  (Orange)          │
│                    │                    │
│  05:55             │  Streaks           │
│  Fajr Prayer Time  │  1 day   🔥        │
│  Dhuhr at 12:46    │  Keep it Going!    │
│                    │                    │
└─────────────────────────────────────────┘
```

## User Experience Benefits

1. **Emotional Engagement:** Animated fire creates positive reinforcement
2. **Visual Balance:** Side-by-side layout uses space more efficiently
3. **Gamification:** Streak counting encourages daily app usage
4. **Motivation:** "Keep it Going!" message provides encouragement
5. **Native Feel:** Smooth animations run at 60fps using native driver

## Future Enhancements

Potential improvements:
- Tap on streaks card to view detailed history
- Achievement milestones (7 days, 30 days, etc.)
- Notification reminders when streak is about to break
- Social sharing of streak achievements
- Different fire animations for milestone streaks
- Streak recovery option (once per month grace period)

## Technical Notes

- All animations use `useNativeDriver: true` for optimal performance
- AsyncStorage used for data persistence
- Date comparison uses ISO date strings (YYYY-MM-DD)
- Streak validation happens on every app load
- No external dependencies required (uses React Native built-ins)

## Testing

To test the streaks feature:

1. Open the app - streak should show 1 day
2. Close and reopen same day - streak stays at 1
3. Manually change device date to tomorrow - streak increments to 2
4. Skip a day - streak resets to 1

For development/testing, use:
```typescript
import { resetStreak } from '@/services/streak-service';
await resetStreak();
```

