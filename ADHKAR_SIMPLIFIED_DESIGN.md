# Simplified Adhkar Detail Screen Design

## Summary of Changes

Based on the reference images, here's what we need to implement:

### 1. Header Changes
**REMOVE:**
- Settings button
- Menu button  
- Complex header

**KEEP:**
- Back button (left)
- Category title (center)
- Position counter (right) - "9 of 16" format

**New Header Layout:**
```
┌─────────────────────────────────────┐
│ ←  Evening                  9 of 16│
└─────────────────────────────────────┘
```

### 2. Content Area Changes
**REMOVE:**
- Large counter display with progress circles
- Title repetition
- Complex group indicators
- Separate counter sections

**ADD:**
- Clean, centered adhkar text
- Small repeat badge in top-left corner (3× format)
- Full-screen tap area

**New Content Layout:**
```
┌─────────────────────────────────────┐
│ 3×                                  │  <- Small repeat badge (top-left)
│                                     │
│                                     │
│      Arabic Text (Large)            │
│                                     │
│      Transliteration (Medium)       │
│                                     │
│      Translation (Regular)          │
│                                     │
│                                     │
│   [Tap anywhere to continue]        │
│                                     │
└─────────────────────────────────────┘
```

### 3. Bottom Navigation Changes
**REMOVE:**
- All bottom buttons (back, info, tap circle, info, forward)
- Bottom navigation bar
- Action buttons

**REPLACE WITH:**
- Entire screen becomes tappable
- Tap = advance to next adhkar or decrement counter

### 4. Progress Indicator Changes
**OPTION 1:** Remove completely
**OPTION 2:** Make very subtle (thin line at top)

### 5. Counter Badge Designs

**Position Counter (Top-Right):**
- Format: "9 of 16"
- Style: Small rounded badge
- Background: Semi-transparent dark/light
- Position: Fixed top-right corner
- Font: Medium weight, readable size

**Repeat Counter (Top-Left):**
- Format: "3×" or "1×"
- Style: Small rounded badge  
- Background: Blue tint (matching theme)
- Position: Fixed top-left corner
- Visibility: Only show when quantity > 1
- Font: Medium weight

### 6. Interaction Model

**Old:**
- Tap circle button to decrement
- Use forward/back buttons to navigate
- Complex gesture system

**New:**
- Tap anywhere on screen to advance
- Single tap = decrement counter OR move to next adhkar
- Swipe left/right for manual navigation (optional)
- Long press for settings (optional)

### 7. Typography & Spacing

**Arabic Text:**
- Size: Dynamic (user adjustable)
- Weight: Regular
- Spacing: Generous line-height
- Alignment: Center or Right-to-left

**Transliteration:**
- Size: Slightly smaller than Arabic
- Weight: Regular
- Color: Slightly muted
- Alignment: Center

**Translation:**
- Size: Smaller than transliteration
- Weight: Regular
- Color: Secondary text color
- Alignment: Center

**Padding:**
- Generous padding around all content
- Minimum 40px from edges
- Content should breathe

### 8. Color Scheme

**Light Mode:**
- Background: Pure white or very light gray
- Text: Dark gray/black
- Badges: Light gray background with border
- Counter badges: White background with subtle shadow

**Dark Mode:**
- Background: Pure black or very dark gray
- Text: White/off-white
- Badges: Dark gray background
- Counter badges: Slightly lighter than background

## Implementation Priority

1. **Phase 1: Remove complexity**
   - Remove bottom navigation
   - Remove large counter displays
   - Remove unnecessary UI elements

2. **Phase 2: Add tap interaction**
   - Make entire content area tappable
   - Implement tap-to-advance logic

3. **Phase 3: Add corner badges**
   - Implement position counter badge
   - Implement repeat counter badge

4. **Phase 4: Clean up header**
   - Simplify to: back button, title, position counter

5. **Phase 5: Polish**
   - Adjust typography
   - Fine-tune spacing
   - Test on different screen sizes

