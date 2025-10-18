# Adhkar Detail Screen Redesign Plan

## Current Design Issues
- Too many UI elements (bottom navigation, progress bars, buttons)
- Counter is prominently displayed, cluttering the interface
- Complex navigation with forward/back buttons

## New Design (Based on Reference Images)

### Key Changes:
1. **Clean Initial View** (Picture 1 style)
   - Show only the adhkar text
   - No visible counters initially
   - Minimal UI elements

2. **Tap-to-Advance Interaction**
   - Entire screen is tappable
   - Single tap advances to next adhkar or decrements counter
   - No bottom navigation buttons needed

3. **Corner Counter Badge** (Picture 2 style)
   - Small badge in top-right corner showing "9 of 16" style counter
   - Only shows position in adhkar list
   - Subtle, doesn't distract from content

4. **Repeat Counter** (Picture 2 style)
   - Small badge showing "3/7" or "1×" for repeat count
   - Appears in top-left corner
   - Only visible when quantity > 1
   - Shows current repeat count

5. **Minimal Header**
   - Just category name and back button
   - No extra actions unless needed

### Layout:
```
┌──────────────────────────────────┐
│ ← Evening               9 of 16 │  <- Header with counter
├──────────────────────────────────┤
│   3×                             │  <- Repeat counter (if needed)
│                                  │
│                                  │
│         Adhkar Text              │  <- Main content
│         (Arabic)                 │
│                                  │
│                                  │
│      Transliteration             │
│                                  │
│                                  │
│        Translation               │
│                                  │
│                                  │
│    [TAP ANYWHERE TO CONTINUE]    │  <- Entire screen tappable
│                                  │
└──────────────────────────────────┘
```

## Implementation Steps:
1. Remove bottom navigation buttons
2. Remove large counter display
3. Add small corner badges for counters
4. Make entire content area tappable
5. Simplify header
6. Remove progress bar or make it very subtle

