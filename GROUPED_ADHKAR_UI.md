# Grouped Adhkar UI Enhancement

## 🎯 Overview

Enhanced the Adhkar detail screen to make it visually clear when viewing grouped adhkar items. The UI now clearly indicates that multiple adhkar belong to the same group and provides visual feedback during transitions.

---

## ✨ New Features

### 1. **Group Badge Indicator**
- Displays when viewing a grouped adhkar (group id ≠ 0)
- Shows:
  - 🔗 Link icon to indicate grouping
  - "Grouped Dhikr" label
- Styled with blue border and text to stand out

### 2. **Segmented Group Progress Bar**
- Horizontal progress bar **divided into segments** based on the quantity (e.g., 3 segments for quantity 3)
- Each segment represents one complete cycle through the group
- **First segment** fills as you go through the group the first time (33% → 66% → 100%)
- **Second segment** fills as you go through the group the second time
- **Third segment** fills as you go through the group the third time
- Shows fraction text (e.g., "2/3") indicating position within current cycle
- Visual representation for quantity 3:
  - **Cycle 1, Item 1**: [███░░░] [░░░░░] [░░░░░] "1/3"
  - **Cycle 1, Item 2**: [██████] [░░░░░] [░░░░░] "2/3"
  - **Cycle 1, Item 3**: [█████████] [░░░░░] [░░░░░] "3/3"
  - **Cycle 2, Item 1**: [█████████] [███░░░] [░░░░░] "1/3" ← First segment stays filled!
  - **Cycle 2, Item 2**: [█████████] [██████] [░░░░░] "2/3"
  - **Cycle 2, Item 3**: [█████████] [█████████] [░░░░░] "3/3"
  - **Cycle 3, Item 1**: [█████████] [█████████] [███░░░] "1/3"
  - **Cycle 3, Item 3**: [█████████] [█████████] [█████████] "3/3" ← All filled! Done!

### 3. **Horizontal Slide Animation**
- **Different animation for groups vs. non-groups**:
  - ✅ **Grouped adhkar**: Slide horizontally (left to right) when tapping counter
  - ✅ **Non-grouped adhkar**: Slide vertically (up) when completing and moving to next
- Makes it visually obvious that you're cycling within a group
- Smooth 300ms transition

### 4. **Smart Group Navigation**
- When completing all repetitions of a group, automatically jumps to the next adhkar OUTSIDE the group
- Skips over other items in the same group to avoid confusion
- Example: After finishing 3x repetitions of (Al-Ikhlas, Al-Falaq, An-Nas), jumps directly to "tasbih"

---

## 🎨 Visual Design

### Light Mode
- **Group Badge**:
  - Background: `#F2F2F7` (light gray)
  - Border: `#007AFF` (blue)
  - Text: `#007AFF` (blue)
- **Progress Bar**:
  - Background: `#E5E5EA` (light gray)
  - Fill: `#007AFF` (blue)
  - Text: `#8E8E93` (medium gray)

### Dark Mode
- **Group Badge**:
  - Background: `#1C1C1E` (dark gray)
  - Border: `#3B82F6` (lighter blue)
  - Text: `#0A84FF` (lighter blue)
- **Progress Bar**:
  - Background: `#2C2C2E` (dark gray)
  - Fill: `#0A84FF` (lighter blue)
  - Text: `#8E8E93` (medium gray)

---

## 🔄 User Experience Flow

### Example: Night Adhkar Group (Ikhlas & Mu'awwidhatayn) - Quantity: 3x

**CYCLE 1 (Counter: 3x)**
1. **Tap 1** - View Al-Ikhlas:
   - Progress: [███░░░] [░░░░░] [░░░░░] "1/3"
   - First segment filling (33%)

2. **Tap 2** - Slides to Al-Falaq:
   - Progress: [██████] [░░░░░] [░░░░░] "2/3"
   - First segment filling (66%)

3. **Tap 3** - Slides to An-Nas:
   - Progress: [█████████] [░░░░░] [░░░░░] "3/3"
   - First segment FULL (100%)

**CYCLE 2 (Counter: 2x)**
4. **Tap 4** - Back to Al-Ikhlas:
   - Progress: [█████████] [███░░░] [░░░░░] "1/3"
   - First segment stays full, second segment starts (33%)

5. **Tap 5** - Slides to Al-Falaq:
   - Progress: [█████████] [██████] [░░░░░] "2/3"
   - Second segment filling (66%)

6. **Tap 6** - Slides to An-Nas:
   - Progress: [█████████] [█████████] [░░░░░] "3/3"
   - Second segment FULL (100%)

**CYCLE 3 (Counter: 1x)**
7. **Tap 7** - Back to Al-Ikhlas:
   - Progress: [█████████] [█████████] [███░░░] "1/3"
   - Two segments full, third segment starts (33%)

8. **Tap 8** - Slides to Al-Falaq:
   - Progress: [█████████] [█████████] [██████] "2/3"
   - Third segment filling (66%)

9. **Tap 9** - Slides to An-Nas:
   - Progress: [█████████] [█████████] [█████████] "3/3"
   - ALL SEGMENTS FULL! (100%)

10. **Tap 10** - Slides vertically to next dhikr outside group ✅

---

## 📁 Files Modified

### `app/adhkar-detail.tsx`
- Added `groupSlideAnim` for horizontal transitions
- Created group indicator UI component with badge and progress bar
- Wrapped content in `Animated.View` for slide effect
- Modified `handleCount()` to trigger horizontal animation for groups
- Added `moveToNextAdhkarOutsideGroup()` function
- Added new styles:
  - `groupIndicatorContainer`
  - `groupBadge`
  - `groupBadgeText`
  - `groupProgressContainer`
  - `groupProgressBar` (now uses flexDirection: "row" for segments)
  - `groupProgressSegment` (individual segment container)
  - `groupProgressSegmentFill` (fill within each segment)
  - `groupProgressText`
  - `animatedContentWrapper`

---

## 🧪 Testing

### Test Scenarios

1. **View Non-Grouped Adhkar** (group id: 0)
   - ❌ Should NOT show group badge
   - ❌ Should NOT show progress bar
   - ✅ Tapping counter should decrement normally
   - ✅ Completion should slide up to next adhkar

2. **View Grouped Adhkar** (group id: 1)
   - ✅ Should show group badge with "Grouped Dhikr"
   - ✅ Should show segmented progress bar (3 segments for quantity 3)
   - ✅ Should show "X/Y" text next to progress bar
   - ✅ First tap should slide horizontally to next in group
   - ✅ Current segment should fill progressively (33% → 66% → 100%)
   - ✅ After completing group once, move to next segment (first segment stays filled)
   - ✅ Completed segments should remain filled while current segment fills
   - ✅ After all segments filled (all repetitions done), should jump to next non-grouped adhkar

3. **Dark Mode**
   - ✅ Group badge should use dark theme colors
   - ✅ Progress bar should use lighter blue fill

4. **Animation**
   - ✅ Within group: Horizontal slide (300ms)
   - ✅ Between adhkar: Vertical slide (400ms)
   - ✅ Smooth transitions with no visual glitches

---

## 🎯 Current Implementation

### Data Structure
```json
{
  "Category": "night",
  "Adhkar": "ikhlas and mawedhatayn",
  "Arabic": "...",
  "quantity": 3.0,
  "group id": 1  // ← Indicates this is part of Group 1
}
```

### Group Logic
- `group id: 0` = Standalone (not grouped)
- `group id: 1` = Part of Group 1 (Night Adhkar - 3 Surahs)
- `group id: 2+` = Future groups as needed

---

## 🚀 Future Enhancements

Potential improvements:
1. **Swipe gesture** to navigate within groups
2. **Haptic feedback** when transitioning between group items
3. **Custom group names** instead of "Group 1" (e.g., "Protective Surahs")
4. **Group completion celebration** (confetti/animation)
5. **Group summary card** showing all items before starting

---

## 📝 Notes

- Group indicator only appears for the **currently active** adhkar
- Animation only applies to grouped items
- Badge is hidden for non-grouped adhkar
- Progress dots dynamically adjust based on group size
- All transitions are GPU-accelerated using `useNativeDriver: true`

---

**Last Updated**: October 16, 2025

