# 🤖 Android Build Guide

## ✅ Pre-Build Changes Complete

All necessary changes have been made to your code. You're ready to build!

---

## 📋 What Was Updated

### 1. **app.json**

- ✅ Added `versionCode: 1` for Android
- ✅ Google Maps API key configured
- ✅ All permissions set

### 2. **eas.json**

- ✅ Added Android-specific build configurations
- ✅ Development: APK with debug build
- ✅ Preview: APK for internal testing
- ✅ Production: AAB for Play Store

---

## 🚀 Build Commands

### Option 1: Preview Build (APK - Recommended for Testing)

```bash
# This creates an APK you can install directly on any Android device
eas build --platform android --profile preview
```

**Use this for:**

- ✅ Testing on physical devices
- ✅ Sharing with testers
- ✅ Quick installation via download link

**Build time:** ~15-20 minutes

---

### Option 2: Development Build (APK with Dev Client)

```bash
# This includes development tools and hot reload
eas build --platform android --profile development
```

**Use this for:**

- ✅ Active development
- ✅ Debugging with dev tools
- ✅ Testing native features

**Build time:** ~15-20 minutes

---

### Option 3: Production Build (AAB for Play Store)

```bash
# This creates an Android App Bundle for Google Play Store
eas build --platform android --profile production
```

**Use this for:**

- ✅ Final production release
- ✅ Google Play Store submission
- ✅ Optimized size and performance

**Build time:** ~20-25 minutes

---

## 📱 After Build Completes

### Installing the APK

1. **Download from EAS**

   - EAS will provide a download link
   - Open link on your Android device
   - Download the APK

2. **Enable Installation**

   - Go to Settings → Security
   - Enable "Install from Unknown Sources"

3. **Install**
   - Open the downloaded APK
   - Tap "Install"
   - Open the app!

---

## 🔑 Google Maps API Key Setup

Your API key is configured, but you should **restrict it** for security:

### 1. Go to Google Cloud Console

https://console.cloud.google.com/apis/credentials

### 2. Select Your API Key

`AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8`

### 3. Add Application Restrictions

- Select **Android apps**
- Click **+ Add an item**
- Package name: `com.mustafanadeen23.subhanifyreact`
- SHA-1 certificate fingerprint: (Get this after build)

### 4. Get SHA-1 Fingerprint

```bash
# After your build completes, run:
eas credentials

# Select Android → Select your app
# Copy the SHA-1 fingerprint
# Add it to Google Cloud Console
```

### 5. Enable Required APIs

Make sure these are enabled:

- ✅ Maps SDK for Android
- ✅ Places API
- ✅ Geocoding API

---

## 🎯 Build Profiles Explained

| Profile         | Output | Use Case           | Auto-Update |
| --------------- | ------ | ------------------ | ----------- |
| **development** | APK    | Active development | ✅ Yes      |
| **preview**     | APK    | Testing            | ❌ No       |
| **production**  | AAB    | Play Store         | ❌ No       |

---

## 🐛 Common Build Issues & Solutions

### Issue 1: "No credentials found"

```bash
# Solution: Set up credentials
eas credentials
```

### Issue 2: "Build failed: Gradle error"

```bash
# Solution: Clear cache and retry
eas build --platform android --profile preview --clear-cache
```

### Issue 3: "API key not working in build"

- Make sure SHA-1 fingerprint is added to Google Cloud
- Check that APIs are enabled
- Verify package name matches exactly

### Issue 4: "App crashes on startup"

- Check console logs with: `eas build:list`
- View crash logs in build details
- Test in development build first

---

## 📊 Build Comparison

### Preview Build (Recommended for You)

```bash
eas build --platform android --profile preview
```

**Pros:**

- ✅ Fastest to test
- ✅ Easy to share (direct APK link)
- ✅ No Play Store setup needed
- ✅ Works on any Android device

**Cons:**

- ❌ Larger file size
- ❌ No automatic updates

---

## 🔒 Security Checklist

Before building:

- [ ] API key restricted in Google Cloud Console
- [ ] Package name correct: `com.mustafanadeen23.subhanifyreact`
- [ ] `.env` file in `.gitignore`
- [ ] No sensitive data in code
- [ ] Console logs are acceptable (error logging only)

---

## 📝 Build Process Steps

1. **Prepare** ✅ (Done - files updated)
2. **Run build command**
   ```bash
   eas build --platform android --profile preview
   ```
3. **Wait for build** (~15-20 min)
4. **Download APK** from provided link
5. **Install on device**
6. **Test all features**:
   - Prayer times
   - Adhkar completion
   - Location tracking
   - Google Maps (most important!)
   - Notifications
   - Geofencing

---

## 🎉 You're Ready to Build!

Run this command now:

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview
```

**Expected output:**

- Build will queue on EAS servers
- You'll get a link to track progress
- After ~15-20 min, you'll get download link
- Install APK on your Android device
- Test away! 🚀

---

## 📞 Need Help?

If build fails:

1. Check error logs in terminal
2. Visit: https://expo.dev/accounts/[your-account]/projects/subhanify-react/builds
3. Check build details for specific errors

Common fixes:

- Clear cache: `--clear-cache`
- Update dependencies: `npm install`
- Check EAS credentials: `eas credentials`

---

## 🎯 Quick Start Command

Copy and paste this:

```bash
eas build --platform android --profile preview && echo "✅ Build submitted! Check your Expo dashboard for progress."
```

Good luck with your build! 🚀
