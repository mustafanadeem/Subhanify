# Level System Implementation

## Overview
The app now has a 3-level system for adhkar progression. When users select a level, they see adhkar for that level AND all previous levels.

## Levels

### Level 1 - Beginner
- **Icon:** 🍃 (leaf.fill)
- **Color:** #34C759 (Green)
- **Description:** Essential adhkar - Perfect for starting your journey
- **Content:** Shows only Level 1 adhkar

### Level 2 - Intermediate  
- **Icon:** ⭐ (star.fill)
- **Color:** #FFD60A (Yellow)
- **Description:** Core daily adhkar - Building consistent habits
- **Content:** Shows Level 1 + Level 2 adhkar

### Level 3 - Advanced
- **Icon:** 🔥 (flame.fill)
- **Color:** #FF9500 (Orange)
- **Description:** Comprehensive adhkar - Complete spiritual practice
- **Content:** Shows Level 1 + Level 2 + Level 3 adhkar

## How It Works

### 1. Level Settings Service (`services/level-settings-service.ts`)
- Type: `AdhkarLevel = 1 | 2 | 3`
- Stores user's level preference in AsyncStorage
- Default: Level 1, disabled by default
- Functions:
  - `getLevelSettings()` - Get current settings
  - `saveLevelSettings()` - Save settings
  - `getLevelDescription()` - Get level description
  - `getLevelIcon()` - Get level icon
  - `getLevelLabel()` - Get level label

### 2. Level Settings UI (`app/level-settings.tsx`)
- Toggle to enable/disable the level system
- Cards for each level with selection
- Help section explaining how levels work
- Info card explaining cumulative nature (selected level + all previous)

### 3. Adhkar Filtering (`utils/adhkar-utils.ts`)

#### Main Function: `getAdhkarByCategory(category)`
- Now async to load level settings
- Filters adhkar based on current level setting
- If level system is disabled, shows all adhkar
- If level system is enabled, shows adhkar where `item.Level <= currentLevel`

#### Helper Functions:
- `getAdhkarByCategoryAndLevel(category, level)` - Synchronous level-specific filtering
- `getCategoryCountByLevel(category, level)` - Count adhkar for a specific level
- `getAdhkarCategories()` - Returns category summaries with level-aware counts

### 4. Adhkar Detail Screen (`app/adhkar-detail.tsx`)
- Loads adhkar asynchronously from `getAdhkarByCategory()`
- Shows loading state while fetching
- Automatically respects level settings
- Empty state if no adhkar for selected level

### 5. Home Screen (`app/(tabs)/index.tsx`)
- Loads adhkar categories with level-aware counts
- Refreshes on focus to reflect level changes
- Shows correct counts based on level setting

## Data Structure

### JSON Format (`data/adkar_dua.json`)
Each adhkar has a `Level` field:
```json
{
  "Category": "morning",
  "Adhkar": "The Ultimate Protection from Harm",
  "Level": 1,
  ...
}
```

- Level 1: Essential adhkar (most important)
- Level 2: Additional adhkar (building habits)
- Level 3: Complete collection (comprehensive practice)

## User Flow

1. User goes to Settings → Level System
2. Enables the level system
3. Selects their current level (1, 2, or 3)
4. Returns to home screen
5. Adhkar categories now show filtered counts
6. Opening morning/evening/night adhkar shows only relevant adhkar for their level + all previous levels

## Benefits

- **Progressive Learning**: Start with essentials, gradually add more
- **Reduced Overwhelm**: Beginners aren't shown the full collection
- **Flexibility**: Can disable to see all adhkar anytime
- **Cumulative**: Higher levels include everything from lower levels
- **Motivational**: Encourages progress through levels

## Technical Notes

- All filtering happens on the client side
- Settings stored in AsyncStorage
- Async/await pattern for settings retrieval
- Proper TypeScript typing throughout
- No breaking changes to existing functionality
- Backwards compatible (defaults to showing all if disabled)

