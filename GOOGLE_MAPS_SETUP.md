# Google Maps API Setup Guide

## Step 1: Get Your Free Google Maps API Key

### 1. Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### 2. Create a New Project

- Click **Select a project** dropdown (top left)
- Click **NEW PROJECT**
- Name it: `Subhanify` or any name you prefer
- Click **CREATE**

### 3. Enable Required APIs

Go to: https://console.cloud.google.com/apis/library

Enable these APIs:

- **Maps SDK for Android** (required for Android)
- **Maps SDK for iOS** (required for iOS)
- **Places API** (optional, for future features)

Click **ENABLE** for each one.

### 4. Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS**
3. Select **API Key**
4. Copy your API key (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 5. Restrict Your API Key (Important for Security)

After creating the key:

1. Click **EDIT API KEY** (pencil icon)
2. Under **Application restrictions**:
   - For testing: Select **None** temporarily
   - For production: Select **Android apps** or **iOS apps**
3. Under **API restrictions**:
   - Select **Restrict key**
   - Check: Maps SDK for Android, Maps SDK for iOS
4. Click **SAVE**

## Step 2: Add API Key to Your App

Open `app.json` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      }
    }
  }
}
```

## Step 3: Secure Your API Key (Recommended)

### Option 1: Use Environment Variables (Best Practice)

1. Install dotenv:

```bash
npm install dotenv
```

2. Create `.env` file in root:

```
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Add `.env` to `.gitignore`:

```
.env
```

4. Update `app.json` to `app.config.js`:

```javascript
export default {
  expo: {
    // ... other config
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};
```

### Option 2: Keep in app.json (Simpler but less secure)

- Just replace the placeholder with your key
- Don't commit to public repositories

## Step 4: Rebuild Your App

After adding the API key, rebuild:

```bash
# Prebuild with new config
npx expo prebuild --clean

# Build for Android
npx expo run:android

# Or build with EAS
eas build --profile development --platform android
```

## Testing Your Setup

1. Open the Locations tab
2. You should see a map loading
3. Tap to add a location
4. The map should show with markers and circles

## Free Tier Limits

Google Maps provides:

- **$200 free credit per month**
- This equals approximately:
  - 28,000 map loads per month
  - 40,000 geocoding requests per month

For a personal adhkar app, this is more than enough!

## Pricing After Free Tier (Unlikely to Hit)

If you exceed the free tier:

- Maps SDK: $7 per 1,000 loads
- Most users won't exceed free tier for personal use

## Troubleshooting

### Map Not Showing

1. ✅ Check API key is correct in `app.json`
2. ✅ Verify APIs are enabled in Google Cloud Console
3. ✅ Rebuild app after adding key (`npx expo prebuild --clean`)
4. ✅ Check API key restrictions aren't blocking requests

### "This API key is not authorized"

1. Go to Google Cloud Console → Credentials
2. Edit your API key
3. Under **API restrictions**, ensure Maps SDK is allowed
4. Under **Application restrictions**, select "None" for testing

### Map Shows but Says "For Development Purposes Only"

- This means billing is not enabled
- For testing, it's fine
- For production, add billing details to Google Cloud

## Security Best Practices

1. ✅ **Restrict API Key** to only needed APIs
2. ✅ **Add Application Restrictions** (Android/iOS package names)
3. ✅ **Use Environment Variables** for the key
4. ✅ **Monitor Usage** in Google Cloud Console
5. ✅ **Never commit API keys** to public repositories

## Alternative: No API Key Required (Limited)

If you don't want to use Google Maps API:

- The app will still work for location features
- Maps just won't load properly
- You can manually enter coordinates
- All adhkar notifications will still work

## Summary

1. ✅ Create Google Cloud project
2. ✅ Enable Maps SDK for Android/iOS
3. ✅ Create API key
4. ✅ Add key to `app.json`
5. ✅ Rebuild app
6. ✅ Test maps functionality

Your API key setup is now complete! 🎉


