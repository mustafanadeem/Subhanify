# 🗺️ Fix: Blank Google Maps on iOS

## Problem

Google Maps shows blank/minimal tiles on iOS in the location selection screen.

## Root Cause

The Google Maps API key needs to be embedded in the native iOS code during build time. Simply adding it to `.env` isn't enough for iOS native maps.

## ✅ What I Fixed

1. **Added API key to `app.json`**

   ```json
   "ios": {
     "config": {
       "googleMapsApiKey": "AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8"
     }
   }
   ```

2. **Added loading indicators to MapView**
   - `loadingEnabled={true}`
   - `loadingIndicatorColor="#666666"`
   - `loadingBackgroundColor="#ffffff"`

## ⚠️ CRITICAL: You Must Rebuild the App

The blank map issue is because the native iOS code doesn't have the Google Maps API key yet.

### Option 1: Rebuild with Expo Go (Quick Test)

```bash
# Stop current Expo server (Ctrl+C)
npx expo start --clear

# Then press 'i' to rebuild and open iOS simulator
```

### Option 2: Build Development Client (Recommended)

```bash
# This properly compiles the native code with your API key
eas build --profile development --platform ios
```

### Option 3: Prebuild Locally (For Local Testing)

```bash
# Generate native iOS folder with API key
npx expo prebuild --platform ios

# Then run the native build
npx expo run:ios
```

## Why This Happens

**React Native Maps on iOS** requires:

1. Google Maps SDK to be linked in native code
2. API key to be set in `AppDelegate.m` or `Info.plist`
3. Native code to be recompiled

**What Expo Go lacks:**

- Expo Go has a pre-built iOS app that can't access your `app.json` config
- Custom native config (like Google Maps API keys) requires a custom build

## Quick Workaround: Use Apple Maps for Now

If you want to keep testing without rebuilding:

1. Revert to Apple Maps on iOS:

   ```typescript
   // In location-detail.tsx, change:
   provider={PROVIDER_GOOGLE}

   // Back to:
   provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
   ```

2. Apple Maps works immediately without API keys
3. Test Google Maps features on Android instead

## Long-term Solution

For production, you should:

1. **Use EAS Build** for development builds:

   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

2. **Install development build** on your device

3. **Then** you can use Expo's dev server with your custom native code

## Current Status

- ✅ API key added to `app.json`
- ✅ Loading indicators added
- ⏳ **Waiting for app rebuild** to see Google Maps tiles
- ✅ Will work fine once you rebuild with `eas build` or `expo prebuild`

## Alternative: Test on Android First

Android works better with Expo Go for Google Maps:

1. Press 'a' in Expo terminal to open Android
2. Google Maps should work there without rebuilding
3. Once confirmed working on Android, then rebuild for iOS

---

**TL;DR:** The map is blank because Expo Go can't use your Google Maps API key. You need to either:

- Build a development client with `eas build --profile development --platform ios`, OR
- Revert to Apple Maps on iOS (works without API key)
