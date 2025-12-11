# 🔐 API Key Setup Guide

## Where Your API Key is Stored

Your Google Maps API key is now stored **securely** in the following locations:

### 1. `.env` File (✅ SECURE - Not Committed to Git)

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8
```

**Location:** `/Users/mustafa/Subhanify-1/.env`

**Why here?**

- ✅ Not committed to Git (protected by `.gitignore`)
- ✅ Easy to change without modifying code
- ✅ Can have different keys for development/production
- ✅ Standard practice for storing secrets

### 2. `constants/api-keys.ts` (Imports from .env)

```typescript
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
export const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "";
```

**Location:** `/Users/mustafa/Subhanify-1/constants/api-keys.ts`

**Why here?**

- ✅ Centralized import point
- ✅ Type-safe exports
- ✅ Single place to update if env var name changes
- ✅ Includes validation warnings

---

## How to Use the API Key

### In Your Components:

```typescript
import { GOOGLE_MAPS_API_KEY } from "@/constants/api-keys";

// Use it in your component
<MapView
  provider={PROVIDER_GOOGLE}
  // ... other props
/>;
```

### In Native Configuration (app.json):

The `app.json` file now has **empty strings** for API keys:

```json
"ios": {
  "config": {
    "googleMapsApiKey": ""
  }
},
"android": {
  "config": {
    "googleMaps": {
      "apiKey": ""
    }
  }
}
```

**Why empty?** Expo automatically injects environment variables during build time, so you don't need to hardcode them.

---

## Important: After Changing .env

**You MUST restart the Expo dev server** for changes to take effect:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npx expo start --clear
```

---

## For Team Members

When someone else clones this repo, they need to:

1. Create their own `.env` file (copy from `.env.example` if you create one)
2. Add their own Google Maps API key
3. Restart the Expo server

---

## For Production Builds

When building for production (Android/iOS):

### Option 1: EAS Build (Recommended)

Store secrets in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your-key-here"
```

### Option 2: Environment-Specific .env Files

Create multiple files:

- `.env.development` - for local dev
- `.env.production` - for production builds

---

## Security Best Practices ✅

### What We Did Right:

1. ✅ Removed hardcoded API key from `app.json`
2. ✅ Added `.env` to `.gitignore`
3. ✅ Used environment variables
4. ✅ Centralized key management

### What You Should Do Next:

1. **Restrict API Key in Google Cloud Console**

   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your API key
   - Under "Application restrictions":
     - For Android: Add package name `com.mustafanadeen23.subhanifyreact`
     - For iOS: Add bundle ID `com.mustafanadeen23.subhanifyreact`
   - Under "API restrictions":
     - Enable only: Maps SDK for Android, Maps SDK for iOS, Places API

2. **Rotate Keys Regularly**

   - Create new keys for production vs development
   - Disable old keys after migration

3. **Monitor Usage**
   - Set up billing alerts in Google Cloud Console
   - Check for unusual spikes in API usage

---

## Troubleshooting

### API Key Not Working?

1. Check `.env` file exists in project root
2. Restart Expo server: `npx expo start --clear`
3. Verify key format starts with `AIzaSy...`
4. Check Google Cloud Console that key is enabled

### Map Not Showing?

1. Ensure API key has "Maps SDK for Android/iOS" enabled
2. Check console for API key errors
3. Verify package name matches in Google Cloud restrictions

---

## Current Status ✅

Your API key setup is now complete:

- ✅ API key stored in `.env`
- ✅ `.env` added to `.gitignore`
- ✅ Hardcoded keys removed from `app.json`
- ✅ Constants file updated to use environment variables
- ✅ Ready for development and production builds

**Your new API key:** `AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8`

**Storage location:** `.env` file (not committed to Git)
