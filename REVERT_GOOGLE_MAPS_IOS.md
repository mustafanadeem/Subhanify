# 🔄 Revert Google Maps on iOS to Apple Maps

## What Was Changed (For Testing)

Changed iOS to use Google Maps instead of Apple Maps in these files:

1. `app/(tabs)/locations.tsx`
2. `app/locations.tsx`
3. `app/location-detail.tsx` (2 MapView instances)

## How to Revert Back to Apple Maps

### Option 1: Quick Revert (Find & Replace)

Search for this line in all 3 files:

```typescript
// TESTING: Use Google Maps on iOS (change back to: Platform.OS === "android" ? PROVIDER_GOOGLE : undefined)
provider = { PROVIDER_GOOGLE };
```

Replace with:

```typescript
provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
```

### Option 2: Manual Revert

In each file, find the MapView component and change:

**FROM:**

```typescript
<MapView
  style={styles.map}
  // TESTING: Use Google Maps on iOS
  provider={PROVIDER_GOOGLE}
  region={mapRegion}
```

**TO:**

```typescript
<MapView
  style={styles.map}
  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
  region={mapRegion}
```

### Option 3: Git Revert (If Committed)

```bash
# See what changed
git diff app/(tabs)/locations.tsx
git diff app/locations.tsx
git diff app/location-detail.tsx

# Revert specific files
git checkout HEAD -- app/(tabs)/locations.tsx
git checkout HEAD -- app/locations.tsx
git checkout HEAD -- app/location-detail.tsx
```

## Files Modified

- ✅ `app/(tabs)/locations.tsx` - Line ~387
- ✅ `app/locations.tsx` - Line ~271
- ✅ `app/location-detail.tsx` - Line ~486 (mini map preview)
- ✅ `app/location-detail.tsx` - Line ~782 (full map modal)

## Why This Change?

**Before (Production):**

- iOS: Uses Apple Maps (default, no API key needed)
- Android: Uses Google Maps (requires API key)

**Now (Testing):**

- iOS: Uses Google Maps (to test with your Google API key)
- Android: Uses Google Maps (unchanged)

## Important Notes

1. **Restart Expo** after making changes:

   ```bash
   npx expo start --clear
   ```

2. **Google Maps on iOS requires:**

   - Valid Google Maps API key in `.env`
   - `Maps SDK for iOS` enabled in Google Cloud Console
   - Bundle ID restriction: `com.mustafanadeen23.subhanifyreact`

3. **For Production:** Revert to Apple Maps on iOS to avoid:
   - Extra API usage costs
   - Need for iOS-specific Google Maps configuration
   - Better iOS native integration with Apple Maps

## Quick Revert Command

Run this to revert all changes at once:

```bash
# Search and show what will change
grep -n "TESTING: Use Google Maps" app/(tabs)/locations.tsx app/locations.tsx app/location-detail.tsx

# Or use git if committed
git diff app/(tabs)/locations.tsx app/locations.tsx app/location-detail.tsx
```

---

**Current Status:** ✅ iOS is using Google Maps for testing
**To Revert:** Change `provider={PROVIDER_GOOGLE}` back to `provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}`
