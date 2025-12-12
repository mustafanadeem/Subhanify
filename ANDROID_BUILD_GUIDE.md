# Android Standalone Build Guide for Background Location

## Quick Start

```bash
# Step 1: Prebuild (generates native Android code)
npx expo prebuild --platform android --clean

# Step 2: Run on device/emulator
npx expo run:android

# Step 3: Test geofencing with app in background
```

---

## Prerequisites

1. **Android Studio** (for emulator) or **physical Android device**
2. **Java Development Kit (JDK)** 17+
3. **EAS CLI**: `npm install -g eas-cli`
4. **Expo CLI**: `npm install -g expo-cli`

---

## Step-by-Step Build Instructions

### 1. Clean Prebuild (IMPORTANT)

```bash
cd c:\Users\Isaka\Subhanify

# Clean any existing Android directory
npx expo prebuild --platform android --clean
```

**What this does:**
- Generates native Android code from Expo config
- Creates `android/` directory with full gradle setup
- Installs native dependencies for location, tasks, notifications
- Applies permissions from `app.json`

**Expected output:**
```
✅ Android project created at: ./android
```

### 2. Build APK (Development)

**Option A: Direct to device/emulator**
```bash
npx expo run:android
```

This will:
- Compile the Android project
- Install APK on connected device or emulator
- Launch the app
- Enable hot reload

**Option B: Build APK file only**
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

Then install manually:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Build with EAS (Production)

```bash
# Configure if not already done
eas build --platform android --profile production

# This creates:
# - APK for side-loading
# - AAB (Android App Bundle) for Play Store
```

**Note:** First build takes 10-15 minutes. Subsequent builds are faster.

---

## Verifying the Build

After installation, verify these capabilities:

### 1. Check App Installed
```bash
# List installed apps
adb shell pm list packages | grep subhanify
```

Expected output:
```
package:com.mustafanadeen23.subhanifyreact
```

### 2. Check Permissions
```bash
# View granted permissions
adb shell dumpsys package permissions | grep -A 5 subhanify
```

Should show:
- `android.permission.ACCESS_FINE_LOCATION` ✅
- `android.permission.ACCESS_BACKGROUND_LOCATION` ✅
- `android.permission.POST_NOTIFICATIONS` ✅

### 3. Test Location Permission Flow

In app Settings > Permissions > Location:
- Should show "All the time" option (not just "While using")
- Grant "All the time" permission

### 4. Enable USB Debugging (Physical Device)

Settings > Developer options > USB Debugging > Enable

Connect device via USB:
```bash
adb devices
```

Should list your device.

---

## Testing Background Location

### Manual Testing on Physical Device

1. **Grant Permissions:**
   - Open Subhanify
   - Go to Locations tab
   - Grant Location permission (select "All the time")
   - Grant Notification permission

2. **Add Test Location:**
   - Tap + button
   - Name: "Home Test"
   - Select current location on map
   - Set radius to 200m
   - Select adhkar for entry
   - Save

3. **Enable Monitoring:**
   - Toggle "Location Monitoring" ON
   - Confirm "Monitoring 1 location"

4. **Test Background Trigger:**
   - Close app completely (swipe from recent apps)
   - Lock phone screen
   - Walk/drive at least 300m away
   - Wait 30-60 seconds
   - Notification should appear ✅
   - Walk back within 200m
   - Notification should appear again ✅

### Testing in Emulator

Emulator geofencing is limited. Better to test on physical device.

If you must use emulator:

```bash
# Start emulator with extended controls
emulator @emulator_name -extended-controls

# In Extended Controls:
# Left menu > Location > Enter coordinates
# Move the dot outside the geofence radius
```

---

## Gradle & Native Build Files

### Key Files Generated After Prebuild

```
android/
├── app/
│   ├── build.gradle          ← Main app build config
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml  ← Generated permissions
│   │       └── res/                 ← Resources
│   └── proguard-rules.pro
├── build.gradle              ← Project build config
├── settings.gradle
└── gradle.properties
```

### Gradle Command Reference

```bash
cd android

# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK (requires signing)
./gradlew assembleRelease

# Run tests
./gradlew test

# View gradle tasks
./gradlew tasks
```

### Important: Gradle Properties

File: `android/gradle.properties`

Should include (auto-configured):
```properties
# SDK versions
android.minSdkVersion=24
android.targetSdkVersion=34
```

---

## Troubleshooting Build Issues

### Issue: "SDK not found"

**Solution:**
```bash
# Set Android SDK path
set ANDROID_HOME=C:\Users\<YourUsername>\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
```

Or in PowerShell:
```powershell
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
```

### Issue: "Gradle build failed"

**Solution:**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue: "Permission denied" with adb

**Solution:**
- Device: Enable USB Debugging (Settings > Developer options)
- Windows: Run PowerShell as Administrator
- Restart adb: `adb kill-server && adb start-server`

### Issue: "Target SDK mismatch"

**Solution:**
The app.json has target SDK 34. Android emulator should be API 34+ or recent physical device Android 14+.

Check supported APIs:
```bash
adb shell getprop ro.build.version.release
```

---

## Build Variants & Signing

### Development Build (Debug)

```bash
# Already created with ./gradlew assembleDebug
# No signing required
# APK: app/build/outputs/apk/debug/app-debug.apk
```

### Release Build (Production)

Requires signing with a keystore:

```bash
# Create keystore (one-time)
keytool -genkey -v -keystore subhanify-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias subhanify-key

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore subhanify-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  subhanify-key

# Align APK
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  Subhanify-Release.apk
```

---

## Logs & Debugging

### View App Logs

```bash
# Real-time logs
adb logcat | grep -i subhanify

# Filter by tag
adb logcat | grep -E "BackgroundTaskSetup|GeofenceService|LocationTask"

# Save to file
adb logcat > app_logs.txt

# Clear logs
adb logcat -c
```

### View Native Exceptions

```bash
# All exceptions
adb logcat | grep -i exception

# Crash logs
adb logcat | grep -i "fatal|crash"
```

### Test Geofencing Directly

Enable verbose geofencing logs:

```bash
adb shell setprop log.tag.GeofencingActivity VERBOSE
adb logcat | grep -i geofenc
```

---

## Build Performance Optimization

### Gradle Daemon (Faster Builds)

```bash
# Enable in gradle.properties (usually already done)
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### Incremental Builds

```bash
# Only rebuild changed parts
./gradlew assembleDebug --build-cache
```

### First Build vs Subsequent Builds

- **First build:** 5-10 minutes (downloads gradle, dependencies, etc.)
- **Subsequent builds:** 1-2 minutes
- **Hot reload (changes only):** 10-30 seconds

---

## Google Play Store Submission

### Requirements

1. Sign APK with release keystore
2. Build as AAB (Android App Bundle)
3. Upload to Google Play Console
4. Fill app details, pricing, ratings

### Build for Play Store

```bash
# Using EAS (recommended)
eas build --platform android --profile production

# Or manually
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Continuous Integration (GitHub Actions)

Example workflow for automated builds:

```yaml
name: Android Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      
      - name: Setup Expo
        run: npm install -g expo-cli eas-cli
      
      - name: Install dependencies
        run: npm ci
      
      - name: Prebuild
        run: npx expo prebuild --platform android --clean
      
      - name: Build APK
        run: cd android && ./gradlew assembleDebug
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/
```

---

## Useful adb Commands Reference

```bash
# Device info
adb devices
adb shell getprop ro.build.version.release      # Android version
adb shell getprop ro.build.version.sdk          # SDK level
adb shell getprop ro.product.device              # Device model

# App management
adb install app.apk
adb uninstall com.mustafanadeen23.subhanifyreact
adb shell pm clear com.mustafanadeen23.subhanifyreact  # Clear app data

# File system
adb push local_file /sdcard/remote_file
adb pull /sdcard/remote_file local_file
adb shell ls /sdcard/Android/data/com.mustafanadeen23.subhanifyreact/

# Logcat
adb logcat
adb logcat -c                                   # Clear logs
adb logcat -G 16M                               # Set buffer size

# Permissions
adb shell pm grant com.mustafanadeen23.subhanifyreact android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.mustafanadeen23.subhanifyreact android.permission.ACCESS_BACKGROUND_LOCATION
```

---

## Summary Checklist

- [ ] Java 17+ installed
- [ ] Android SDK configured
- [ ] Prebuild completed (`npx expo prebuild --platform android --clean`)
- [ ] APK built (`npx expo run:android`)
- [ ] App installed on device
- [ ] Permissions granted in app settings
- [ ] Test location added
- [ ] Location monitoring enabled
- [ ] Background geofencing tested
- [ ] No crashes in logs
- [ ] Ready for production build

---

## Next Steps

1. **Develop & Test**
   - Use `npx expo run:android` for quick iterations
   - Test background location thoroughly

2. **Optimize**
   - Monitor battery impact
   - Adjust geofence radius
   - Fine-tune notification frequency

3. **Release**
   - Build signed APK/AAB
   - Upload to Play Store
   - Monitor crash logs in Play Console

