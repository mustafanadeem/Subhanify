# ✅ Testing Checklist for Location-Based Adhkar

## Pre-Testing Setup

### 1. Build & Install Development Client

- [ ] Run `npx expo run:android` or `npx expo run:ios`
- [ ] Wait for build to complete (~5-10 minutes)
- [ ] Verify app installed on device
- [ ] Open the custom dev build (NOT Expo Go)

### 2. Verify Google Maps Configuration

- [ ] Google Maps API key is valid
- [ ] Maps SDK for Android enabled in Google Cloud
- [ ] Maps SDK for iOS enabled in Google Cloud
- [ ] Billing enabled on Google Cloud project

### 3. Grant Permissions

- [ ] Location permission: "Always" / "All the time"
- [ ] Notification permission: Enabled
- [ ] Android: Background location permission granted
- [ ] Android: Battery optimization disabled for app
- [ ] iOS: Background App Refresh enabled

---

## Feature Testing

### 1. Basic Location Access ✅

**Test: Get Current Location**

- [ ] Open Locations tab
- [ ] Map loads with your current position
- [ ] Blue dot shows your location
- [ ] Can zoom/pan the map
- [ ] "My Location" button works

**Expected:** Map centers on your GPS coordinates

---

### 2. Add Location ✅

**Test: Create New Location**

- [ ] Tap + button in header
- [ ] Location detail screen opens
- [ ] Map shows current location
- [ ] Can move pin on map
- [ ] Enter location name (e.g., "Test Home")
- [ ] Select category (e.g., Home)
- [ ] Set radius (try 100m first)
- [ ] Select entry adhkar (at least 1)
- [ ] Select exit adhkar (at least 1)
- [ ] Tap Save

**Expected:**

- Location appears in list
- Marker shows on map with correct icon
- Circle shows geofence radius

---

### 3. Edit Location ✅

**Test: Modify Existing Location**

- [ ] Tap on a location card
- [ ] Edit name
- [ ] Change category
- [ ] Adjust radius
- [ ] Add/remove adhkar
- [ ] Save changes

**Expected:** Changes reflected in list and map

---

### 4. Delete Location ✅

**Test: Remove Location**

- [ ] Long press or swipe location card
- [ ] Confirm deletion
- [ ] Location removed from list
- [ ] Marker removed from map

**Expected:** Location completely removed

---

### 5. Enable/Disable Location ✅

**Test: Toggle Location Monitoring**

- [ ] Toggle switch on location card
- [ ] Disable location
- [ ] Enable location again

**Expected:**

- Geofencing updates automatically
- Disabled locations don't trigger

---

### 6. Geofencing - Entry Trigger 🔔

**Test: Entering a Location**

**Setup:**

1. [ ] Add location with 200m radius
2. [ ] Set entry adhkar (e.g., "Entering Home")
3. [ ] Enable "Location Monitoring" toggle
4. [ ] Walk/drive OUTSIDE the 200m radius
5. [ ] Wait 30 seconds
6. [ ] Walk/drive INSIDE the radius

**Expected:**

- Notification appears when entering
- Notification shows correct adhkar text
- Notification mentions location name
- Sound/vibration (if enabled)

---

### 7. Geofencing - Exit Trigger 🔔

**Test: Leaving a Location**

**Setup:**

1. [ ] Be INSIDE a geofenced location
2. [ ] Make sure exit adhkar is configured
3. [ ] Walk/drive OUTSIDE the radius
4. [ ] Wait 30 seconds

**Expected:**

- Notification appears when exiting
- Shows exit adhkar
- Correct location name

---

### 8. Background Geofencing 🌙

**Test: App Closed/Background**

**Setup:**

1. [ ] Set up geofence with entry/exit adhkar
2. [ ] Close app completely (swipe away from recent apps)
3. [ ] Lock phone screen
4. [ ] Move in/out of geofence

**Expected:**

- Notifications still trigger
- No need to have app open
- Works even with screen locked

---

### 9. Multiple Locations 📍

**Test: Multiple Geofences**

**Setup:**

1. [ ] Add 3-5 different locations
2. [ ] Different categories (home, mosque, market)
3. [ ] Enable all locations
4. [ ] Turn on monitoring

**Expected:**

- All locations show on map
- Each has distinct icon/color
- All trigger notifications correctly
- No conflicts between geofences

---

### 10. Notification Content 📬

**Test: Adhkar Notification Details**

**Check notification contains:**

- [ ] Location name (e.g., "Entering: Home")
- [ ] Arabic adhkar text
- [ ] English translation (if configured)
- [ ] Proper formatting
- [ ] Correct icon/color

---

### 11. Permission Handling ⚙️

**Test: Permission Denial**

**Setup:**

1. [ ] Go to Settings > Apps > Subhanify
2. [ ] Disable location permission
3. [ ] Open app
4. [ ] Try to add location

**Expected:**

- App shows permission request
- Clear explanation of why needed
- Option to open settings
- Graceful fallback

---

### 12. Edge Cases 🐛

**Test: Unusual Scenarios**

1. **Overlapping Geofences**

   - [ ] Create 2 locations very close together
   - [ ] Enter both geofences
   - Expected: Both notifications trigger

2. **Very Small Radius**

   - [ ] Set radius to 10m
   - [ ] Try to trigger
   - Expected: May be less reliable (warn user)

3. **Very Large Radius**

   - [ ] Set radius to 1000m
   - [ ] Monitor behavior
   - Expected: Works but may drain battery

4. **GPS Disabled**

   - [ ] Turn off GPS
   - [ ] Try to add location
   - Expected: Error message, prompt to enable GPS

5. **Airplane Mode**

   - [ ] Enable airplane mode
   - [ ] Check if geofencing still works offline
   - Expected: Works (GPS doesn't need internet)

6. **Low Battery**
   - [ ] Test when battery < 20%
   - [ ] Check if OS restricts background location
   - Expected: May need to whitelist app

---

## Performance Testing

### 1. Battery Usage 🔋

**Test: Monitor Battery Drain**

- [ ] Enable geofencing for 24 hours
- [ ] Check battery usage in settings
- [ ] Should be < 5% per day for normal usage

**If high:**

- Increase geofence radius
- Reduce number of monitored locations
- Lower location accuracy

### 2. Memory Usage 💾

**Test: Check Memory Consumption**

- [ ] Open app
- [ ] Add 10+ locations
- [ ] Monitor app in background
- [ ] Check for memory leaks

**Expected:** < 100MB RAM usage

### 3. Location Accuracy 📍

**Test: GPS Precision**

- [ ] Check location accuracy indicator
- [ ] Should be < 20m in open areas
- [ ] May be less accurate indoors

---

## Android-Specific Tests 🤖

1. **Foreground Service**

   - [ ] Persistent notification shows when tracking
   - [ ] Can be dismissed but service continues
   - [ ] Shows "Subhanify is using location"

2. **Battery Optimization**

   - [ ] Settings > Battery > App Optimization
   - [ ] Subhanify should be "Not optimized"
   - [ ] Test geofencing with optimization ON vs OFF

3. **Location Modes**
   - [ ] Test with "High accuracy" mode
   - [ ] Test with "Battery saving" mode
   - [ ] Test with "Device only" mode

---

## iOS-Specific Tests 🍎

1. **Background Location Indicator**

   - [ ] Blue bar appears when using background location
   - [ ] Or blue pill in status bar (iOS 13+)

2. **Background App Refresh**

   - [ ] Settings > General > Background App Refresh
   - [ ] Must be ON for Subhanify

3. **Location Services**
   - [ ] Settings > Privacy > Location Services > Subhanify
   - [ ] Should be set to "Always"
   - [ ] "Precise Location" should be ON

---

## Regression Testing 🔄

**After making changes, re-test:**

- [ ] Adding a location
- [ ] Receiving entry notification
- [ ] Receiving exit notification
- [ ] Background monitoring
- [ ] Permission requests

---

## User Experience Testing 🎨

1. **First-Time User Flow**

   - [ ] Open app first time
   - [ ] Permission prompts are clear
   - [ ] Onboarding makes sense
   - [ ] Easy to add first location

2. **Map Usability**

   - [ ] Map is responsive
   - [ ] Markers are tappable
   - [ ] Colors are distinguishable
   - [ ] Icons make sense

3. **Location Management**
   - [ ] Easy to find locations in list
   - [ ] Quick to enable/disable
   - [ ] Clear what adhkar are assigned
   - [ ] Obvious how to edit/delete

---

## Final Verification ✨

Before considering complete:

- [ ] All basic features work
- [ ] Geofencing triggers reliably
- [ ] Notifications show correct content
- [ ] Background monitoring works
- [ ] Battery usage is acceptable
- [ ] No crashes or errors
- [ ] Permissions handled gracefully
- [ ] UI is responsive and clear

---

## Known Limitations 📝

**Android:**

- Battery optimization may interfere with background location
- Some manufacturers (Xiaomi, Huawei) aggressively kill background apps
- Geofencing may be delayed by up to 2 minutes

**iOS:**

- Background location shows persistent indicator (by design)
- Force-quitting app stops all background tasks
- Geofencing limited to 20 regions per app (you have plenty)

**Both:**

- Geofencing accuracy depends on device GPS quality
- Indoor locations may not trigger reliably
- Requires "Always" permission for background monitoring

---

## Success Criteria 🎯

Your implementation is ready when:

- ✅ You can add/edit/delete locations
- ✅ Geofencing triggers within 30 seconds of crossing boundary
- ✅ Notifications show correct adhkar text
- ✅ Works with app closed
- ✅ Battery drain is minimal (<5% per day)
- ✅ No crashes during normal usage
- ✅ Permissions are requested appropriately

---

## Next Steps After Testing 🚀

1. **Add More Adhkar**

   - Expand adhkar database
   - Add more categories
   - Include transliterations

2. **Optimize Performance**

   - Fine-tune geofence radii
   - Adjust location accuracy settings
   - Implement smart batching

3. **Enhance UX**

   - Add search for locations
   - Implement location suggestions
   - Add location sharing

4. **Prepare for Release**
   - Test on multiple devices
   - Get user feedback
   - Build production APK/IPA
   - Submit to app stores

---

**Happy Testing! 🎉**

Remember: Real device testing is essential. Simulators/emulators don't accurately simulate geofencing behavior.
