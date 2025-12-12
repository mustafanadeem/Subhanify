# Android Background Location & Geofencing Implementation Guide

## Executive Summary

Your Subhanify application **already has a solid foundation** for background location tracking and geofencing. However, to make it work in a standalone Android build (outside Expo Go), we need to ensure:

1. **Proper TaskManager registration** at app startup
2. **Foreground service configuration** for background location
3. **Correct Android permissions** in app.json
4. **Build configuration** for standalone builds

**Current Status:** ✅ Most code is already implemented and correct
**Missing:** 🔧 Proper initialization sequence and build configuration

---

## Current Implementation Analysis

### ✅ What's Already Done

1. **`app.json` Configuration**
   - ✅ Android permissions correctly declared:
     - `ACCESS_FINE_LOCATION`
     - `ACCESS_COARSE_LOCATION`
     - `ACCESS_BACKGROUND_LOCATION`
     - `ACTIVITY_RECOGNITION`
     - `POST_NOTIFICATIONS`
   
   - ✅ Expo-location plugin configured:
     ```json
     ["expo-location", {
       "isAndroidBackgroundLocationEnabled": true,
       "isAndroidForegroundServiceEnabled": true
     }]
     ```

2. **TaskManager Setup** (`services/geofence-service.ts`)
   - ✅ Geofencing task defined with `TaskManager.defineTask()`
   - ✅ Proper error handling
   - ✅ Notification triggering on geofence events
   - ✅ Support for entry/exit events

3. **Permissions System** (`services/permissions-manager.ts`)
   - ✅ Foreground location request
   - ✅ Background location request
   - ✅ Notification permissions
   - ✅ User-friendly rationale dialogs

4. **Geofencing Service** (`services/geofence-service.ts`)
   - ✅ `startGeofencingMonitoring()` - Start monitoring
   - ✅ `stopGeofencingMonitoring()` - Stop monitoring
   - ✅ `restartGeofencing()` - Update regions
   - ✅ `getGeofencingStatus()` - Check status

5. **Continuous Location** (`services/continuous-location-service.ts`)
   - ✅ Background location updates
   - ✅ Configurable tracking options
   - ✅ Distance and time filtering

6. **Notification System** (`services/notification-service.ts`)
   - ✅ Android notification channels
   - ✅ Proper priority levels
   - ✅ Adhkar notification display

---

## What Needs Verification/Enhancement

### 1. TaskManager Registration Initialization

**Current Issue:** TaskManager defines tasks, but we need to ensure they're registered before the app is fully loaded.

**Solution:** Add initialization in app startup

### 2. Foreground Service Notification

**Current Issue:** Android requires a persistent notification when doing background location updates.

**Status:** Already configured in `app.json` but we should verify it's working

### 3. Build Configuration

**Current Issue:** Expo Go doesn't support background location fully; we need proper builds.

---

## Implementation Plan

### Phase 1: Ensure Proper Initialization

**File:** `app/_layout.tsx`

Add TaskManager initialization at app startup to ensure tasks are registered before being called.

### Phase 2: Android Build Configuration

**File:** `android/app/build.gradle`

Verify proper dependencies and Google Play Services configuration.

### Phase 3: EAS Build Configuration

**File:** `eas.json`

Ensure EAS build uses correct configuration for Android development/production builds.

### Phase 4: Testing & Debugging

Add helper functions for testing background location in development.

---

## Detailed Implementation

### Step 1: Update `app/_layout.tsx`

Add TaskManager initialization at the very top of the app lifecycle:

```typescript
// Add this import
import { setupBackgroundTasks } from "@/services/background-task-setup";

// In RootLayout or before navigation setup
useEffect(() => {
  const initialize = async () => {
    try {
      // Initialize background tasks
      await setupBackgroundTasks();
      
      // Other initialization code...
    } catch (error) {
      console.error("Failed to initialize background tasks:", error);
    }
  };
  
  initialize();
}, []);
```

### Step 2: Create Background Task Setup Service

**File:** `services/background-task-setup.ts`

This service ensures all background tasks are properly registered before they're needed.

### Step 3: Verify Android Manifest

The expo-location plugin should automatically add:
- `ACCESS_BACKGROUND_LOCATION` permission
- `ACCESS_FINE_LOCATION` permission
- Foreground service configuration

### Step 4: Build Instructions

For standalone builds:

```bash
# Prebuild (generates native code)
npx expo prebuild --platform android --clean

# Run on device
npx expo run:android

# Or EAS Build
eas build --platform android --profile production
```

---

## Testing Checklist

### Before Building
- [ ] All permissions in app.json are correct
- [ ] TaskManager tasks are defined
- [ ] Notification channels are configured
- [ ] Background permissions flow works

### After Building
- [ ] App installs without errors
- [ ] Can grant location permissions
- [ ] Can add a test location/geofence
- [ ] Can enable location monitoring
- [ ] Walking outside geofence triggers notification (app in background)
- [ ] Walking back in triggers exit notification
- [ ] Works with screen locked
- [ ] Works with app swiped away

### Battery/Performance
- [ ] No excessive battery drain
- [ ] Geofence triggers within 1-2 minutes
- [ ] Notifications appear reliably
- [ ] App doesn't crash when background location active

---

## Troubleshooting Guide

### Issue: "Background location permission denied"
**Solution:**
1. Go to App Settings > Permissions > Location
2. Select "Allow all the time" (not "Allow while using")
3. Restart the app

### Issue: "Geofencing events not triggering"
**Causes & Solutions:**
1. Background permission not granted → Follow steps above
2. Geofence radius too small → Try 200m+
3. GPS disabled → Enable GPS in device settings
4. App force-closed → Don't force close the app
5. Geofencing not enabled in UI → Toggle it on

### Issue: "Notifications not showing"
**Solutions:**
1. Check notification permissions granted
2. Check "Do Not Disturb" mode is off
3. Check app notification settings in OS
4. Verify notification channel is set up for Android

### Issue: "Permission requests don't show"
**Solutions:**
1. Clear app data
2. Uninstall and reinstall
3. Check device language/locale settings
4. Verify Info.plist has correct usage descriptions

---

## Files to Review/Update

### Configuration Files
- ✅ `app.json` - Already correct
- 📝 `eas.json` - May need minor updates
- 📝 `android/app/build.gradle` - Verify after prebuild

### Service Files
- ✅ `services/geofence-service.ts` - Already correct
- ✅ `services/notification-service.ts` - Already correct
- ✅ `services/continuous-location-service.ts` - Already correct
- ✅ `services/permissions-manager.ts` - Already correct
- 🔧 `services/background-task-setup.ts` - NEW FILE (to create)

### App Files
- 🔧 `app/_layout.tsx` - Add initialization
- ✅ `app/(tabs)/locations.tsx` - Already correct
- ✅ `app/location-detail.tsx` - Already correct

---

## Key Environment Variables

No additional environment variables needed. All configuration is in:
- `app.json` (expo configuration)
- `eas.json` (build configuration)
- Code (permissions & services)

---

## Build & Deployment

### Local Development
```bash
# Option 1: Prebuild + Run
npx expo prebuild --platform android --clean
npx expo run:android

# Option 2: Development client
npx expo install expo-dev-client
eas build --platform android --profile development
# Install on device, then run: npm start -- --dev-client
```

### Production Build
```bash
# Create production build
eas build --platform android --profile production

# Download and install APK
# Or push to Play Store
```

### Testing in Emulator
Note: Android emulators have limitations with geofencing. Better to test on physical device.

```bash
# List emulators
emulator -list-avds

# Run emulator with extended controls
emulator @emulator_name -extended-controls

# GPS in extended controls:
# Left menu > Extended controls > Location
```

---

## Next Steps

1. **Create** `services/background-task-setup.ts`
2. **Update** `app/_layout.tsx` to call setup
3. **Run** `npx expo prebuild --platform android --clean`
4. **Test** with `npx expo run:android`
5. **Verify** geofencing works with app in background
6. **Build** for production with `eas build`

---

## References

- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo TaskManager Documentation](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Android Geofencing API](https://developers.google.com/location-context/geofencing)
- [Foreground Services (Android)](https://developer.android.com/guide/components/foreground-services)

