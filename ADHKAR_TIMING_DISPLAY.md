# Adhkar Timing Display Feature

## Overview
Added timing information to adhkar cards showing when each adhkar should be recited based on prayer times. The timing is dynamically calculated using real prayer times and displayed with a clock icon for easy visibility.

## Implementation

### 1. Enhanced Time Utilities (`utils/adhkar-time-utils.ts`)

#### New Function: `getAdhkarTimeRange()`
```typescript
function getAdhkarTimeRange(
  category: string,
  prayerTimes: TodayPrayerTimes | null,
  settings: UserSettings | null
): string | null
```

**Purpose:** Returns formatted time range for when specific adhkar should be recited.

**Returns:**
- **Morning Adhkar**: "5:30 AM - 6:45 AM" (Fajr to Sunrise)
- **Evening Adhkar**: "3:45 PM - 6:30 PM" (Asr to Maghrib)
- **Night Adhkar**: "6:30 PM - 5:30 AM" (Maghrib to next Fajr)
- **Other categories**: `null` (no timing)

**Features:**
- Uses 12-hour format with AM/PM
- Respects user's Asr calculation method (Mithl 1 or Mithl 2)
- Returns null if prayer times not loaded
- Automatically formats times for readability

#### New Function: `getAdhkarTimeDescription()`
```typescript
function getAdhkarTimeDescription(category: string): string | null
```

**Purpose:** Returns simple description of adhkar timing (without specific times).

**Returns:**
- **Morning**: "After Fajr until Sunrise"
- **Evening**: "After Asr until Maghrib"
- **Night**: "After Maghrib until Fajr"
- **Other**: `null`

**Use Case:** Useful for offline mode or when prayer times unavailable.

### 2. Updated Category Card (`components/category-card.tsx`)

#### New Prop: `timeRange`
```typescript
interface CategoryCardProps {
  // ... existing props
  timeRange?: string | null;
}
```

#### Visual Implementation

**Normal Card:**
- Clock icon (12px) + time range text below subtitle
- Semi-transparent text (60% opacity)
- Appears only when timeRange provided
- Compact spacing (6px gap between icon and text)

**Highlighted Card (Active Now):**
- Larger clock icon (14px) + time range text
- White text with drop shadow for readability on gradient
- More prominent spacing (8px gap)
- Matches gradient theme

#### Styling
```typescript
timeRangeContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 6,
  gap: 6,
}

timeRangeText: {
  fontSize: 13,
  opacity: 0.6,
  fontWeight: "500",
  letterSpacing: -0.1,
}
```

### 3. Integration (`app/(tabs)/index.tsx`)

#### Implementation
```typescript
{adhkarCategories.map((category) => {
  // Get time range for this adhkar
  const timeRange = getAdhkarTimeRange(category.category, prayerTimes, settings);

  return (
    <CategoryCard
      // ... other props
      timeRange={timeRange}
    />
  );
})}
```

**Flow:**
1. Prayer times loaded on app start
2. For each adhkar card, calculate time range
3. Pass time range to card component
4. Card displays timing if available

## Visual Design

### Layout Structure

**Normal Card:**
```
┌────────────────────────────────────────┐
│  ☀️   Morning                      16  │
│       Adhkar Al-Sabah                  │
│       🕐 5:30 AM - 6:45 AM            │
└────────────────────────────────────────┘
```

**Highlighted Card (Active Now):**
```
┌────────────────────────────────────────┐
│                     [Active Now]        │
│  ☀️   Morning                      16  │
│       Adhkar Al-Sabah                  │
│       🕐 5:30 AM - 6:45 AM            │
│  [Gradient Background - Sunrise Colors]│
└────────────────────────────────────────┘
```

### Color Scheme

**Normal Card:**
- Clock icon: 50% opacity (theme-based)
- Time text: 60% opacity (theme-based)
- Font size: 13px

**Highlighted Card:**
- Clock icon: 90% opacity white
- Time text: 90% opacity white with drop shadow
- Font size: 14px
- Text shadow for readability on gradient

### Responsive Design
- Timing appears only for time-based adhkar (morning, evening, night)
- Other adhkar categories (travel, rain, etc.) show no timing
- Gracefully handles missing prayer times (no timing shown)
- Updates automatically when prayer times change

## Prayer Time Dependencies

### Morning Adhkar
- **Start Time:** Fajr prayer time
- **End Time:** Sunrise time
- **Duration:** Typically 1-1.5 hours
- **Example:** 5:30 AM - 6:45 AM

### Evening Adhkar
- **Start Time:** Asr prayer time (respects user's school choice)
  - **Shafi/Maliki/Hanbali:** Mithl 1 (earlier)
  - **Hanafi:** Mithl 2 (later)
- **End Time:** Maghrib prayer time
- **Duration:** Typically 2-3 hours
- **Example:** 3:45 PM - 6:30 PM

### Night Adhkar
- **Start Time:** Maghrib prayer time
- **End Time:** Next Fajr prayer time
- **Duration:** Entire night (~10-12 hours)
- **Example:** 6:30 PM - 5:30 AM (next day)

### User Settings Integration
- Respects user's Asr calculation method
- Updates when user changes prayer calculation settings
- Adapts to user's location (different prayer times)
- Accounts for seasonal variations

## Time Formatting

### Format Style
- **12-hour format** with AM/PM
- **Example:** "5:30 AM - 6:45 PM"
- **Localized:** Uses device's locale for time formatting
- **Readable:** Numeric hours with 2-digit minutes

### Implementation
```typescript
const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};
```

## User Benefits

### 1. **Clear Timing Information**
- Users know exactly when to recite each adhkar
- No confusion about "morning" or "evening"
- Real-time based on prayer times

### 2. **Convenience**
- Don't need to memorize adhkar times
- Visual reminder of current window
- Highlighted when active

### 3. **Accuracy**
- Based on actual prayer times for user's location
- Accounts for seasonal changes
- Updates automatically daily

### 4. **Flexibility**
- Works with any calculation method
- Adapts to user preferences
- Respects different madhabs

## Edge Cases Handled

### 1. **Missing Prayer Times**
- Timing gracefully hidden
- Card still functional
- No errors displayed

### 2. **Time Zone Changes**
- Automatically updates
- Uses current location
- No manual adjustment needed

### 3. **Daylight Saving Time**
- Handled by system
- Prayer times auto-adjust
- Timing always accurate

### 4. **Cross-Midnight Timing**
- Night adhkar properly shows next day's Fajr
- Clear start/end times
- No ambiguity

## Technical Details

### Dependencies
- Prayer times from `PrayerTimesRepository`
- User settings for Asr method
- Date/time utilities from JavaScript
- No additional libraries needed

### Performance
- Time calculation is lightweight
- Cached prayer times (loaded once)
- No unnecessary re-renders
- Efficient date formatting

### Compatibility
- iOS: Native time formatting
- Android: Native time formatting
- Web: Browser locale support
- All timezones supported

## Future Enhancements

### Potential Features
1. **Countdown Timer**: Show time remaining in current period
2. **Notifications**: Alert when adhkar window opens
3. **Progress Bar**: Visual representation of time passed
4. **Custom Timing**: Allow users to set preferred times
5. **Historical View**: Show past adhkar completion
6. **Reminders**: Set custom reminder times
7. **Widgets**: Home screen widget with timing
8. **Siri/Google Shortcuts**: Voice command support

### Improvements
- Add time until next adhkar period
- Show progress through current period
- Highlight urgency as time runs out
- Add sound/vibration when window opens
- Calendar integration
- Recurring reminders

## Testing

### Test Scenarios

1. **Morning Period**
   - Open app between Fajr and Sunrise
   - Verify morning card highlighted
   - Check timing shows correct range

2. **Evening Period**
   - Open app between Asr and Maghrib
   - Verify evening card highlighted
   - Check timing respects Asr setting

3. **Night Period**
   - Open app after Maghrib
   - Verify night card highlighted
   - Check timing shows overnight range

4. **Settings Change**
   - Change Asr calculation method
   - Verify evening timing updates
   - Check card refreshes

5. **Location Change**
   - Move to different timezone
   - Verify prayer times update
   - Check all timings adjust

## Documentation

### For Users
- **What**: Shows when to recite each adhkar
- **Why**: Based on Islamic tradition and prayer times
- **How**: Automatically calculated from your location

### For Developers
- **Code**: Well-commented time utilities
- **Logic**: Clear calculation methods
- **Integration**: Simple prop passing
- **Maintenance**: Easy to modify

## Credits

- **Islamic Timing**: Based on traditional fiqh rulings
- **Prayer Times**: Aladhan API integration
- **Calculation Methods**: Multiple madhab support
- **Design**: iOS/Material Design principles

## License

This feature is part of the Subhanify app and follows the project's license terms.

