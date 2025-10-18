# 🎨 Quick Color Reference Card

## How to Change Colors

**File:** `constants/theme.ts`  
**Location:** Lines 17-21 (Light Mode) or Lines 26-30 (Dark Mode)

---

## Light Mode (Edit These 5 Lines)

```typescript
const LIGHT_MAIN = '#002685';        // Deep Royal Blue
const LIGHT_ACCENT = '#00C2CB';      // Teal Cyan
const LIGHT_BACKGROUND = '#F5F7FA';  // Soft White
const LIGHT_TEXT = '#1A1A1A';        // Charcoal
const LIGHT_SECONDARY = '#B0BEC5';   // Cool Gray
```

---

## Color Usage Map

| Color | Used For | Example in App |
|-------|----------|----------------|
| **MAIN** | Primary actions, selected states | • Prayer time card (blue)<br>• Active adhkar card<br>• Selected "Adhkar" tab<br>• Bottom nav selected icon |
| **ACCENT** | Highlights, badges | • Streaks card (cyan)<br>• "Active Now" badge<br>• Interactive elements |
| **BACKGROUND** | Screen backdrop | • Main screen background<br>• Header background<br>• Icon containers |
| **TEXT** | All readable text | • "Subhanify" title<br>• Card titles<br>• All content text |
| **SECONDARY** | Muted elements | • Inactive icons<br>• Subtitles<br>• Time ranges |

---

## Popular Color Schemes

### Current (Professional Blue)
```typescript
MAIN: '#002685'        ACCENT: '#00C2CB'      BACKGROUND: '#F5F7FA'
TEXT: '#1A1A1A'        SECONDARY: '#B0BEC5'
```

### Purple & Pink
```typescript
MAIN: '#6B46C1'        ACCENT: '#ED64A6'      BACKGROUND: '#FAF5FF'
TEXT: '#2D3748'        SECONDARY: '#A0AEC0'
```

### Green & Lime
```typescript
MAIN: '#047857'        ACCENT: '#84CC16'      BACKGROUND: '#F0FDF4'
TEXT: '#1F2937'        SECONDARY: '#9CA3AF'
```

### Orange & Yellow
```typescript
MAIN: '#EA580C'        ACCENT: '#FCD34D'      BACKGROUND: '#FFF7ED'
TEXT: '#1C1917'        SECONDARY: '#A8A29E'
```

### Red & Rose
```typescript
MAIN: '#DC2626'        ACCENT: '#FB7185'      BACKGROUND: '#FEF2F2'
TEXT: '#1F2937'        SECONDARY: '#9CA3AF'
```

### Navy & Sky
```typescript
MAIN: '#1E3A8A'        ACCENT: '#38BDF8'      BACKGROUND: '#F0F9FF'
TEXT: '#1E293B'        SECONDARY: '#94A3B8'
```

---

## Quick Test Checklist

After changing colors, verify:
- [ ] Prayer time card shows MAIN color
- [ ] Streaks card shows ACCENT color  
- [ ] Active adhkar card shows MAIN color
- [ ] "Active Now" badge shows ACCENT color
- [ ] Selected tab shows MAIN color background with white text
- [ ] Text is readable on BACKGROUND
- [ ] Icons are visible in SECONDARY color

---

## One-Line Color Change

Just copy-paste one of these into `constants/theme.ts` (lines 17-21):

**Purple Theme:**
```typescript
const LIGHT_MAIN = '#6B46C1'; const LIGHT_ACCENT = '#ED64A6'; const LIGHT_BACKGROUND = '#FAF5FF'; const LIGHT_TEXT = '#2D3748'; const LIGHT_SECONDARY = '#A0AEC0';
```

**Green Theme:**
```typescript
const LIGHT_MAIN = '#047857'; const LIGHT_ACCENT = '#84CC16'; const LIGHT_BACKGROUND = '#F0FDF4'; const LIGHT_TEXT = '#1F2937'; const LIGHT_SECONDARY = '#9CA3AF';
```

**Orange Theme:**
```typescript
const LIGHT_MAIN = '#EA580C'; const LIGHT_ACCENT = '#FCD34D'; const LIGHT_BACKGROUND = '#FFF7ED'; const LIGHT_TEXT = '#1C1917'; const LIGHT_SECONDARY = '#A8A29E';
```

Save the file and the app updates automatically! 🎉

