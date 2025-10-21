# 🗺️ Location Autocomplete Setup Guide

## Overview
Your location search now features intelligent autocomplete powered by Google Places API, providing real-time suggestions as users type.

## 🌟 Features Implemented

### ✅ Real-Time Autocomplete
- **Debounced Search**: 300ms delay prevents excessive API calls
- **Minimum 3 Characters**: Activates after typing 3+ characters
- **Loading Indicator**: Shows spinner while fetching results
- **Clear Button**: Instantly clears search and suggestions

### ✅ Smart Suggestions
- **Location Biasing**: Prioritizes nearby places using user's GPS
- **Structured Display**: 
  - **Main Text**: Place name (bold)
  - **Secondary Text**: Full address (lighter)
- **Location Icons**: Visual indicator for each suggestion

### ✅ Auto-Fill & Details
- **Tap to Select**: Instantly fills search input
- **Coordinates**: Automatically fetches lat/lng
- **Keyboard Dismiss**: Hides keyboard on selection
- **Map Update**: Centers map on selected location

### ✅ Beautiful UI
- **Dropdown Overlay**: Floats over content with shadow
- **Responsive**: Adapts to light/dark theme
- **Smooth Animations**: Native feel
- **Max Height**: Shows up to 5 suggestions with scroll

## 📋 Setup Instructions

### Step 1: Get Google Places API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name it (e.g., "Subhanify")
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ **Places API**
     - ✅ **Maps SDK for Android**
     - ✅ **Maps SDK for iOS**

4. **Create API Key**
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the generated key

5. **Secure Your Key (IMPORTANT!)**
   - Click "Restrict Key"
   - Under "Application restrictions":
     - Choose "Android apps"
     - Add package name: `com.yourcompany.subhanify`
     - Add SHA-1 certificate fingerprint
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose: Places API, Maps SDK for Android, Maps SDK for iOS
   - Click "Save"

### Step 2: Add API Key to Your App

**Option A: Environment Variable (Recommended)**

1. Create `.env` file in project root:
```env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

2. Add to `.gitignore`:
```
.env
```

3. The app will automatically use it from `constants/api-keys.ts`

**Option B: Direct Configuration (Development Only)**

Edit `constants/api-keys.ts`:
```typescript
export const GOOGLE_PLACES_API_KEY = "AIzaSyXXXXXXXXXXXXXXXXXXXXX";
```

⚠️ **NEVER commit real API keys to Git!**

### Step 3: Test the Feature

1. **Start Development Server**
```bash
npx expo start
```

2. **Navigate to Add Location**
   - Tap the "+" button in Locations tab
   - You'll see the "Search Location" field

3. **Test Autocomplete**
   - Type at least 3 characters
   - Watch suggestions appear in dropdown
   - Tap a suggestion
   - See location name and coordinates auto-fill

## 🎯 How It Works

### User Flow:
```
1. User types "Central Mos..."
   ↓
2. After 300ms delay, API is called
   ↓
3. Suggestions appear in dropdown:
   - Central Mosque
   - Central Mosque of Chicago
   - Central Mosque London
   ↓
4. User taps "Central Mosque"
   ↓
5. Search field fills with full name
   ↓
6. App fetches place details (lat/lng)
   ↓
7. Map updates to show location
   ↓
8. User continues with category selection
```

### Technical Flow:
```typescript
handleSearchChange (user types)
  → debounce 300ms
    → searchPlaces()
      → Google Places Autocomplete API
        → setSuggestions()
          → Display dropdown

handlePlaceSelect (user taps suggestion)
  → getPlaceDetails()
    → Google Places Details API
      → setLatitude/setLongitude
        → Hide suggestions
          → Update map
```

## 💰 Pricing & Limits

### Google Places API Costs:
- **Autocomplete**: $2.83 per 1,000 requests
- **Place Details**: $17.00 per 1,000 requests
- **Free Tier**: $200 monthly credit (~70,000 autocomplete requests)

### Optimization Strategies:
1. ✅ **Debouncing**: Reduces requests by ~70%
2. ✅ **Min 3 chars**: Prevents unnecessary calls
3. ✅ **Field Masking**: Only requests geometry + name
4. ✅ **Location Bias**: Improves accuracy, reduces searches

### Expected Usage:
- **100 users/day × 5 searches each** = 500 requests
- **500 × 30 days** = 15,000 requests/month
- **Cost**: ~$42/month (autocomplete) + ~$255/month (details)
- **Total**: ~$297/month

💡 **Tip**: Use caching or backend proxy to reduce costs

## 🔧 Customization Options

### Adjust Debounce Time:
```typescript
// In location-detail.tsx, line ~252
searchTimeoutRef.current = setTimeout(() => {
  searchPlaces(text);
}, 300); // Change to 500 for slower typing
```

### Filter by Type:
```typescript
// Add to API call in searchPlaces()
const response = await fetch(
  `...&types=establishment|geocode&...`
);
```

### Limit to Country:
```typescript
// Add to API call in searchPlaces()
const response = await fetch(
  `...&components=country:us&...`
);
```

### Adjust Search Radius:
```typescript
// In searchPlaces(), line ~176
locationBias = `&location=${lat},${lng}&radius=50000`; // 50km
```

## 🐛 Troubleshooting

### "No suggestions appearing"
- ✅ Check API key is correct in `.env`
- ✅ Verify Places API is enabled in Google Cloud
- ✅ Check console for errors
- ✅ Ensure internet connection

### "API key not valid"
- ✅ Remove restrictions temporarily to test
- ✅ Verify package name matches restriction
- ✅ Check API restrictions include Places API

### "Loading forever"
- ✅ Check CORS if using web
- ✅ Verify API endpoint URL
- ✅ Check network inspector for errors

### "Wrong location coordinates"
- ✅ Ensure Place Details API is enabled
- ✅ Check `fields` parameter includes `geometry`
- ✅ Verify lat/lng extraction logic

## 📱 Alternative Providers

If you prefer not to use Google Places:

### Option 1: Mapbox Geocoding
```typescript
const response = await fetch(
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}`
);
```
**Pricing**: 100,000 free requests/month

### Option 2: OpenStreetMap (Nominatim)
```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${query}&format=json`
);
```
**Pricing**: Free (rate-limited)

### Option 3: Here Maps
```typescript
const response = await fetch(
  `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${query}&apiKey=${HERE_API_KEY}`
);
```
**Pricing**: 250,000 free requests/month

## 🎨 UI Customization

### Change Suggestion Height:
```typescript
// In styles.suggestionsContainer
maxHeight: 300, // Change to 400 for taller dropdown
```

### Adjust Shadow:
```typescript
shadowOpacity: 0.15, // Increase for darker shadow
shadowRadius: 8, // Increase for softer shadow
```

### Modify Item Padding:
```typescript
// In styles.suggestionItem
padding: 14, // Increase for larger touch targets
```

## ✅ Testing Checklist

- [ ] Type 3+ characters, see suggestions
- [ ] Loading spinner appears while fetching
- [ ] Tap suggestion fills search field
- [ ] Map updates to show location
- [ ] Clear button removes suggestions
- [ ] Works in light and dark mode
- [ ] Keyboard dismisses on selection
- [ ] No console errors
- [ ] Smooth scrolling with 10+ suggestions
- [ ] Works offline (graceful failure)

## 📝 Files Modified

1. `app/location-detail.tsx` - Main autocomplete logic
2. `constants/api-keys.ts` - API key configuration (NEW)
3. `.env` - Environment variables (CREATE THIS)

## 🚀 Future Enhancements

- [ ] Add recent searches cache
- [ ] Implement offline favorites
- [ ] Add "Nearby" quick suggestions
- [ ] Show distance to suggestions
- [ ] Add place photos/ratings
- [ ] Category-specific search (mosques only)
- [ ] Multiple language support

---

**Need Help?** Check the troubleshooting section or console logs for detailed error messages.

