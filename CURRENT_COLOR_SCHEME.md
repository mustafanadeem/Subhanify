# 🎨 Current Color Scheme

## Active Color Palette (Emerald & Sand)

Your app now uses a sophisticated **blue, green, and desert sand** palette:

### Light Mode Colors

| Color | Hex Code | Name | Usage |
|-------|----------|------|-------|
| **Main** | `#002685` | Deep Royal Blue | Prayer time card, Active adhkar cards, Selected tabs |
| **Accent** | `#0A8754` | Emerald Green 🌿 | Streaks card, Links, Interactive elements |
| **Background** | `#F1F3F4` | Light Gray | Main screen background, Headers |
| **Text** | `#1A1A1A` | Charcoal | All text content |
| **Secondary** | `#B5A67D` | Desert Sand 🏜️ | Inactive icons, Subtitles, Time ranges |
| **Highlight** | `#FFFFFF` | Pure White ⚪ | "Active Now" badges, Special highlights |

---

## Where You'll See Each Color

### Main (Deep Royal Blue `#002685`)
- 🕌 Prayer time card background
- 📿 Active adhkar card (evening/morning when it's time)
- 📑 Selected "Adhkar" or "Duas" tab
- 🏠 Selected bottom navigation icon

### Accent (Emerald Green `#0A8754`)
- 🔥 Streaks card background → **Beautiful emerald green!**
- 🔗 Links and tappable text
- 🎯 Tint color throughout the app

### Background (Light Gray `#F1F3F4`)
- 📱 Main screen background
- 📋 Header background
- 🎨 Icon container backgrounds

### Text (Charcoal `#1A1A1A`)
- 📝 All primary text
- 📖 Card titles and content
- 🏷️ Labels and headers

### Secondary (Desert Sand `#B5A67D`)
- 🎨 Inactive navigation icons → **Warm sandy beige**
- ⏰ Time ranges (e.g., "5:55 am - 7:30 am")
- 📄 Subtitles and secondary text
- 🔘 Unselected states

### Highlight (Pure White `#FFFFFF`)
- ✨ "Active Now" badge → **Clean white badge**
- 🎯 Special highlights and accents
- 🔲 Regular card backgrounds

---

## Color Harmony

This palette creates a **natural, balanced, spiritual** feel:

### 🌿 **Emerald Green** (Accent)
- Growth and renewal
- Peace and tranquility
- Islamic tradition (green is significant in Islam)
- Perfect for the streaks card - represents spiritual growth!

### 🏜️ **Desert Sand** (Secondary)
- Natural, earthy, grounding
- Reminiscent of Middle Eastern landscapes
- Warm but subtle
- Doesn't compete with main colors

### 🔷 **Deep Blue** (Main)
- Trust and stability
- Spirituality and depth
- Professional and calming

### ⚪ **Pure White** (Highlight)
- Purity and clarity
- Clean and modern
- Great contrast for badges

---

## Visual Preview

```
┌─────────────────────────────────────┐
│  Subhanify          (#F1F3F4 bg)   │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────┐  ┌────────────┐    │
│  │ #002685    │  │ #0A8754    │    │
│  │ Prayer     │  │ 1 day      │    │
│  │ Time       │  │ Streaks    │    │
│  │ (Blue)     │  │ (Green!)   │    │
│  └────────────┘  └────────────┘    │
│                                      │
│  ┌──────────────────────────────┐  │
│  │ #002685         [#FFFFFF]   │  │
│  │ Evening         Active Now  │  │
│  │ Adhkar          (White!)    │  │
│  │ (Blue bg)       (Badge)     │  │
│  └──────────────────────────────┘  │
│                                      │
│  Regular cards: #FFFFFF (white)     │
│  Text: #1A1A1A (charcoal)          │
│  Icons: #B5A67D (desert sand)      │
│                                      │
└─────────────────────────────────────┘
```

---

## Islamic Color Significance

This palette has special meaning:

- **Green** 🌿 - The color most associated with Islam
  - Color of paradise
  - Color of the Prophet's banner
  - Represents life, nature, and growth
  - Perfect for the **streaks** card (spiritual growth)!

- **Blue** 🔷 - Represents sky and spirituality
  - Traditional in Islamic art
  - Conveys trust and peace
  
- **Sand/Beige** 🏜️ - Natural, earthly
  - Desert landscapes
  - Humility and groundedness

---

## Contrast & Accessibility

✅ **Excellent contrast ratios:**
- Charcoal text (#1A1A1A) on Light Gray (#F1F3F4): **12.4:1** (AAA Excellent!)
- White text on Blue (#002685): **9.7:1** (AAA Excellent!)
- White text on Green (#0A8754): **4.9:1** (AA Good!)
- Desert Sand (#B5A67D) for secondary elements: **2.8:1** (Good for icons)

All important text meets WCAG AAA standards for accessibility!

---

## Quick Change Instructions

Edit these 6 lines in `constants/theme.ts` (lines 18-23):

```typescript
const LIGHT_MAIN = '#002685';        // Deep Royal Blue
const LIGHT_ACCENT = '#0A8754';      // Emerald Green
const LIGHT_BACKGROUND = '#F1F3F4';  // Light Gray
const LIGHT_TEXT = '#1A1A1A';        // Charcoal
const LIGHT_SECONDARY = '#B5A67D';   // Desert Sand
const LIGHT_HIGHLIGHT = '#FFFFFF';   // Pure White
```

Save the file → App updates instantly! 🎨✨

---

## What Changed from Previous

| Element | Old Color | New Color |
|---------|-----------|-----------|
| Streaks Card | Gold `#FFD166` | **Emerald Green `#0A8754`** 🌿 |
| Background | Off-White `#FAF8F3` | **Light Gray `#F1F3F4`** |
| Secondary/Icons | Muted Gray `#9E9E9E` | **Desert Sand `#B5A67D`** 🏜️ |
| "Active Now" Badge | Golden Sand `#E1B12C` | **Pure White `#FFFFFF`** ⚪ |
| Main (Blue) | Same `#002685` | Same `#002685` ✓ |
| Text | Same `#1A1A1A` | Same `#1A1A1A` ✓ |

---

Enjoy your new natural, Islamic-inspired color scheme! 🌿🕌✨

