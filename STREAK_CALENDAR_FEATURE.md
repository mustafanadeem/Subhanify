# Streak Calendar Feature

## Overview
Implemented a detailed streak tracking screen with a calendar view that displays the user's adhkar completion history, current streak, longest streak, and progress towards the next milestone level.

## Features

### 1. **Interactive Calendar View**
- Monthly calendar displaying all days
- Visual indicators for completed days (golden/yellow)
- Current day highlighted with border
- Navigate between months with arrow buttons
- Cannot navigate to future months

### 2. **Streak Statistics**
- **Current Streak**: Days in a row user opened the app
- **Longest Streak**: Best streak ever achieved
- **Total Days**: Cumulative days tracked
- **Progress to Next Level**: Visual progress bar and days remaining

### 3. **Visual Design**
- Orange gradient header matching streak theme
- Cream/beige calendar card
- Golden completion indicators
- Smooth animations and transitions
- Theme-aware (dark/light mode support)

## Implementation Details

### New Screen: `app/streak-details.tsx`

#### Component Structure
```typescript
export default function StreakDetailsScreen() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // ...
}
```

#### Key Functions

**1. `getDaysInMonth(date: Date)`**
- Returns number of days in the given month
- Handles leap years automatically

**2. `getFirstDayOfMonth(date: Date)`**
- Returns day of week (0-6) for first day of month
- Used to align calendar grid properly

**3. `isDateCompleted(day: number)`**
- Checks if a specific date is part of current streak
- Compares against last open date
- Returns false for future dates
- Calculates based on streak length

**4. `renderCalendar()`**
- Generates calendar grid with proper alignment
- Marks completed days with golden background
- Highlights today with border
- Shows empty cells for padding

**5. Month Navigation**
```typescript
const previousMonth = () => {
  setCurrentMonth(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
  );
};

const nextMonth = () => {
  const today = new Date();
  const nextMonthDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    1
  );
  if (nextMonthDate <= today) {
    setCurrentMonth(nextMonthDate);
  }
};
```

### Updated Component: `components/streaks-card.tsx`

#### Changes Made
```typescript
// Added TouchableOpacity wrapper
<TouchableOpacity
  onPress={() => router.push("/streak-details")}
  activeOpacity={0.8}
>
  {/* Card content */}
</TouchableOpacity>
```

- Made entire card clickable
- Added router navigation
- Maintains all existing animations
- 0.8 opacity on press for feedback

## Visual Design

### Color Scheme

**Header (Orange Gradient):**
- Light mode: `#FF8C42`
- Dark mode: `#C44D00`
- White text for contrast

**Calendar Card:**
- Background: `#FFF8E7` (cream/beige)
- Completed days: `#FFD700` (golden)
- Today border: `#FF8C42` (orange)
- Day text: `#8B4513` (brown)

**Stats Section:**
- White background: `#FFFFFF`
- Text: `#8B4513` (brown) or `#666` (dark mode)
- Values: Bold, large font

**Progress Bar:**
- Container: `#FFE4B5` (light peach)
- Fill: `#FFA500` (orange)
- Height: 12px with rounded corners

### Layout Structure

```
┌─────────────────────────────────────┐
│  ← Adhkar Streak                   │ ← Orange Header
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │  ← January 2024 →             │ │ ← Month Nav
│  ├───────────────────────────────┤ │
│  │  S  M  T  W  T  F  S          │ │ ← Day Labels
│  ├───────────────────────────────┤ │
│  │  •  1  2  3  4  5  6          │ │
│  │  7  8  9  10 11 12 13         │ │ ← Calendar
│  │  14 15 16 17 18 19 20         │ │   Grid
│  │  21 22 23 24 25 26 27         │ │
│  │  28 29 30 •  •  •  •          │ │
│  ├───────────────────────────────┤ │
│  │  Longest Streak | Current     │ │ ← Stats
│  │       18        |    12       │ │
│  ├───────────────────────────────┤ │
│  │  3 days to next level         │ │ ← Progress
│  │  [████████░░░░░░░░░░]         │ │
│  ├───────────────────────────────┤ │
│  │      [CONTINUE]               │ │ ← Button
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

Legend:
• = Empty day
Number = Day of month
Golden = Completed day
Border = Today
```

### Component Hierarchy

```
StreakDetailsScreen
├── Header
│   ├── Back Button (←)
│   ├── Title ("Adhkar\nStreak")
│   └── Spacer
├── Calendar Card
│   ├── Month Navigation
│   │   ├── Previous Button
│   │   ├── Month/Year Label
│   │   └── Next Button
│   ├── Day Labels Row (S M T W T F S)
│   ├── Calendar Grid
│   │   └── Day Cells (35-42 cells)
│   ├── Stats Container
│   │   ├── Longest Streak
│   │   ├── Divider
│   │   └── Current Streak
│   ├── Progress Section
│   │   ├── Days to Next Level Text
│   │   └── Progress Bar
│   └── Continue Button
```

## Calendar Logic

### Streak Calculation

The calendar marks days as completed based on the current streak:

```typescript
const isDateCompleted = (day: number): boolean => {
  const dateToCheck = new Date(year, month, day);
  const lastOpen = new Date(streakData.lastOpenDate);
  
  // Days between last open and check date
  const daysDiff = Math.floor(
    (lastOpen.getTime() - dateToCheck.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // If within current streak range, mark as completed
  return daysDiff >= 0 && daysDiff < streakData.currentStreak;
};
```

### Example Scenarios

**Scenario 1: 7-Day Streak**
- Last open: January 15, 2024
- Current streak: 7
- Completed days: Jan 9, 10, 11, 12, 13, 14, 15 ✅

**Scenario 2: Broken Streak**
- Last open: January 15, 2024
- Missed: January 16, 2024
- New streak starts: January 17, 2024
- Only Jan 17 marked as completed ✅

**Scenario 3: First Day**
- Just started today
- Current streak: 1
- Only today marked as completed ✅

### Calendar Grid Alignment

The calendar properly aligns days based on the first day of the month:

```
First day = Sunday (0)
┌─────────────────────────┐
│ S  M  T  W  T  F  S     │
│ 1  2  3  4  5  6  7     │ ← Start on Sunday
│ 8  9  10 11 12 13 14    │
└─────────────────────────┘

First day = Wednesday (3)
┌─────────────────────────┐
│ S  M  T  W  T  F  S     │
│ •  •  •  1  2  3  4     │ ← Start on Wednesday
│ 5  6  7  8  9  10 11    │
└─────────────────────────┘
```

## Progress System

### Level Calculation

Progress to next level is calculated in 7-day increments:

```typescript
const daysToNextLevel = 
  Math.ceil((currentStreak + 1) / 7) * 7 - currentStreak;
```

**Examples:**
- Streak = 1 → Next level at 7 → 6 days to go
- Streak = 7 → Next level at 14 → 7 days to go
- Streak = 12 → Next level at 14 → 2 days to go
- Streak = 14 → Next level at 21 → 7 days to go

### Progress Bar

Visual representation of progress:

```typescript
const progressPercentage = 
  (currentStreak / nextLevelThreshold) * 100;
```

**Visual States:**
- 0-25%: Just started level
- 25-50%: Quarter way through
- 50-75%: Halfway there
- 75-99%: Almost there!
- 100%: Level complete! 🎉

## User Interactions

### 1. **Tap Streak Card**
- Action: Navigate to streak details screen
- Feedback: Card opacity reduces to 0.8
- Smooth transition with navigation animation

### 2. **Navigate Months**
- **Previous (←)**: Go to earlier month
- **Next (→)**: Go to later month (disabled for future)
- Instant update of calendar grid

### 3. **View Stats**
- **Longest Streak**: Historical best
- **Current Streak**: Active streak count
- No interaction needed, always visible

### 4. **Continue Button**
- Action: Return to home screen
- Closes streak details modal
- Saves any progress

## Data Persistence

### Stored Data
```typescript
interface StreakData {
  currentStreak: number;
  lastOpenDate: string; // ISO date (YYYY-MM-DD)
  longestStreak: number;
  totalDaysOpened: number;
}
```

### Storage Location
- AsyncStorage key: `@user_streak_data`
- Loaded on screen mount
- Auto-updates on app open

### Update Flow
```
1. User opens app
2. updateStreak() called
3. Check last open date
4. Update streak accordingly
5. Save to AsyncStorage
6. Reflect in UI
```

## Responsive Design

### Screen Sizes
- **Small phones**: Calendar cells scale down
- **Large phones**: Calendar cells have more space
- **Tablets**: Maintains aspect ratio
- **Landscape**: Scrollable content

### Text Scaling
- System font size respected
- Minimum readable sizes enforced
- Dynamic type support

## Accessibility Features

### Screen Reader Support
- Calendar days are labeled
- Stats are announced properly
- Navigation buttons have labels
- Progress percentage spoken

### Visual Accessibility
- High contrast colors
- Large touch targets (44x44 minimum)
- Clear visual hierarchy
- No color-only indicators

### Motor Accessibility
- Large button sizes
- Generous padding
- No precise gestures required
- Easy navigation

## Performance Optimizations

### Rendering
- Calendar grid calculated once per month
- Memoized day calculations
- Efficient date comparisons
- No unnecessary re-renders

### Data Loading
- Load streak data once
- Cache in state
- Update only on changes
- Fast navigation between months

### Animations
- Use native driver where possible
- Smooth 60fps transitions
- Optimized for low-end devices
- No jank or lag

## Future Enhancements

### Potential Features

1. **Detailed Day View**
   - Tap day to see what adhkar completed
   - Show completion times
   - Add notes or reflections

2. **Achievements System**
   - Badges for milestones (7, 30, 100 days)
   - Special colors for achievements
   - Share achievements

3. **Statistics**
   - Best month chart
   - Weekly averages
   - Completion rate
   - Trends over time

4. **Reminders**
   - Daily streak reminder
   - Warning when streak at risk
   - Custom notification times

5. **Social Features**
   - Compare with friends
   - Leaderboards
   - Group challenges
   - Community motivation

6. **Export/Backup**
   - Export calendar as image
   - Backup streak data
   - Restore from backup
   - Share progress

7. **Widgets**
   - Home screen widget
   - Lock screen widget
   - Today extension
   - Watch complications

8. **Gamification**
   - Daily challenges
   - Bonus points
   - Streak multipliers
   - Rewards system

## Testing Scenarios

### Test Cases

1. **First Day Streak**
   - Open app first time
   - Verify 1 day streak
   - Check calendar shows today

2. **Consecutive Days**
   - Open app daily for 7 days
   - Verify 7 day streak
   - Check all days marked

3. **Broken Streak**
   - Have 5 day streak
   - Skip a day
   - Verify resets to 1

4. **Month Navigation**
   - Navigate to previous month
   - Verify correct days shown
   - Cannot navigate to future

5. **Longest Streak**
   - Achieve 10 day streak
   - Break streak
   - Verify longest = 10

## Credits

- **Design Inspiration**: Duolingo streak system
- **Calendar Logic**: Standard Gregorian calendar
- **Icons**: Expo vector-icons
- **Animations**: React Native Animated API

## License

This feature is part of the Subhanify app and follows the project's license terms.

