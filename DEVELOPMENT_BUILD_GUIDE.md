# 📱 Development Build Guide for Subhanify

## Why You Need a Development Build

Your app uses features that **cannot run in Expo Go**:

- ✅ Geofencing (background location monitoring)
- ✅ Background task execution
- ✅ TaskManager for location triggers
- ✅ Full Google Maps integration
- ✅ Background notifications

**Expo Go** = Sandbox with limitations  
**Development Build** = Your own custom "Expo Go" with all native features

---

## 🚀 Quick Start: Build Your Dev Client

### Option 1: Local Build (Recommended for Testing)

#### For Android:

```bash
# Install/update EAS CLI
npm install -g eas-cli

# Login to Expo (create free account if needed)
eas login

# Build development client for Android
eas build --profile development --platform android

# Or build locally if you have Android Studio
npx expo run:android
```

#### For iOS (Mac only):

```bash
# Build development client for iOS
eas build --profile development --platform ios

# Or build locally if you have Xcode
npx expo run:ios
```

### Option 2: Instant Local Build (Fastest)

If you have Android Studio or Xcode installed:

```bash
# Android (creates APK in ~5-10 minutes)
npx expo run:android

# iOS (Mac only, creates app in ~5-10 minutes)
npx expo run:ios
```

This creates a development build directly on your connected device!

---

## 📦 What Happens During Build

1. **EAS CLI** compiles your app with all native modules
2. Creates a custom APK/IPA with expo-dev-client
3. Your device gets a custom version of your app
4. You can then use hot reload just like Expo Go!

**Build time:**

- First build: ~10-20 minutes (cloud) or ~5-10 minutes (local)
- Subsequent builds: Only needed when changing native code/dependencies

---

## 🎯 After Installation

### 1. Install the Dev Build on Your Device

**Android:**

- Download APK from EAS build page
- Install on your device
- Or if using `npx expo run:android`, it installs automatically

**iOS:**

- Download from EAS or TestFlight
- Or if using `npx expo run:ios`, it installs automatically

### 2. Start Development Server

```bash
npx expo start --dev-client
```

### 3. Open Your Custom App

- Open the installed dev build app (not Expo Go!)
- It will connect to your dev server
- You now have full native features!

---

## 🧪 Testing Location Features

### Step 1: Grant Permissions

When you first open the app:

1. Allow location permissions (Always/All the time)
2. Allow notification permissions
3. Go to Locations tab

### Step 2: Add a Test Location

```
1. Tap the + button
2. Your current location loads on map
3. Add a location (e.g., "Test Home")
4. Set radius (start with 100-200m for testing)
5. Select entry/exit adhkar
6. Save
```

### Step 3: Enable Geofencing

```
1. Toggle "Location Monitoring" ON
2. Lock your phone
3. Walk outside the radius
4. Walk back inside the radius
5. You should receive notifications!
```

### Step 4: Test Background Triggers

```
1. Close the app completely
2. Move in/out of geofenced locations
3. Notifications should still trigger
4. Check notification content shows correct adhkar
```

---

## 🐛 Troubleshooting

### Build Issues

**Error: "ANDROID_HOME not set"**

```bash
# Install Android Studio first, then set:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Error: "Command failed: gradlew"**

- Make sure Android Studio is fully set up
- Open Android Studio > SDK Manager > Install required SDKs

**iOS Build Fails**

- Make sure Xcode is installed (Mac only)
- Open Xcode > Preferences > Accounts > Add your Apple ID
- Run: `sudo xcode-select --install`

### Location/Geofencing Issues

**Geofencing not triggering:**

1. Check permissions are set to "Always" (not "While Using")
2. Make sure geofencing is enabled in the UI
3. Check that location has entry/exit adhkar configured
4. Radius might be too small - try 200m+

**Android: Notifications not showing**

1. Settings > Apps > Subhanify > Notifications > Enable all
2. Settings > Apps > Subhanify > Battery > Unrestricted
3. Disable battery optimization for Subhanify

**iOS: Background location stopped**

1. Settings > Subhanify > Location > Always
2. Settings > Subhanify > Background App Refresh > ON
3. Don't force quit the app (iOS stops background tasks)

**Map not loading:**

- Check Google Maps API key is valid
- Enable Maps SDK for Android/iOS in Google Cloud Console
- Make sure billing is enabled (Google requires it)

### Testing Without Moving

Use location spoofing:

**Android:**

1. Enable Developer Options
2. Settings > Developer Options > Select mock location app
3. Install "Fake GPS Location" app
4. Spoof locations to test geofences

**iOS:**

1. Xcode > Debug > Simulate Location
2. Or use third-party apps (requires jailbreak)

---

## 🔄 When Do You Need to Rebuild?

### ❌ NO Rebuild Needed:

- Changing TypeScript/JavaScript code
- Updating UI components
- Modifying business logic
- Changing constants

### ✅ Rebuild Required:

- Adding new native dependencies
- Changing app.json permissions
- Updating native modules
- Changing bundle identifier

---

## 💡 Pro Tips

1. **Use Local Builds During Development**

   ```bash
   npx expo run:android
   # OR
   npx expo run:ios
   ```

   This is faster and keeps your dev loop tight!

2. **Use Cloud Builds for Testing**

   ```bash
   eas build --profile development --platform android
   ```

   Share the APK/IPA with testers without needing their devices connected

3. **Hot Reload Still Works!**
   After installing dev build, code changes hot reload just like Expo Go

4. **Keep Expo Go for Quick Prototypes**
   Use Expo Go for UI work, dev build for native features

5. **Test on Real Device**
   Geofencing and location features work poorly on simulators

---

## 📚 Next Steps

After getting your development build working:

1. ✅ Test all location features thoroughly
2. ✅ Verify background notifications work
3. ✅ Test battery usage (optimize if needed)
4. ✅ Add more test locations
5. ✅ Fine-tune geofence radii
6. ✅ Build production version: `eas build --platform android --profile production`

---

## 🆘 Still Having Issues?

Common solutions:

1. Delete `node_modules` and `package-lock.json`, run `npm install`
2. Clear Metro cache: `npx expo start -c`
3. Rebuild: `npx expo run:android --no-build-cache`
4. Check EAS build logs for detailed errors

---

## ⚡ Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Local development build (FASTEST)
npx expo run:android              # Android
npx expo run:ios                  # iOS (Mac only)

# Cloud development build
eas build --profile development --platform android
eas build --profile development --platform ios

# Start dev server
npx expo start --dev-client

# Production build
eas build --profile production --platform android
eas build --profile production --platform ios
```

---

**You're all set!** The development build opens up the full power of React Native. Yes, it's an extra step, but it's necessary for your location-based features to work properly. 🚀
