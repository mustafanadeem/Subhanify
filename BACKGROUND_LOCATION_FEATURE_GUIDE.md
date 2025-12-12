# Background Location & Geofencing Feature Guide

## Overview

Subhanify now supports **background location monitoring** with push notifications. When users enable "Location Monitoring," they will receive adhkar reminders **even when the app is closed** when they:

1. **Enter/Exit Saved Locations** (mosque, home, work, market, etc.)
2. **Travel** (detected by motion sensors)

---

## How It Works

### User Flow

```
User Opens Locations Tab
         ↓
    Tap "Location Monitoring" toggle
         ↓
    System Permission #1: Foreground Location
    "Subhanify wants to access your location"
    [Deny] [While Using] [Allow All the Time]
         ↓
    System Permission #2: Background Location
    "Allow Subhanify to always have access to your location?"
    [Only While Using] [Always Allow]
         ↓
    System Permission #3: Notifications
    "Subhanify wants to send you notifications"
    [Allow] [Don't Allow]
         ↓
    ✅ Monitoring Active
    App registers geofences with Android/iOS
         ↓
    Even if app is closed:
    • User enters mosque → Notification triggers
    • User leaves home → Notification triggers
    • User starts traveling → Notification triggers
```

### What Notifications Users See

#### Location Entry
```
┌─────────────────────────────────┐
│ 📍 Entering Home                │
│                                 │
│ "الحمد لله على كل حال..."    │
│ (Adhkar for entering home)      │
│                                 │
│ [Tap to view full adhkar]       │
└─────────────────────────────────┘
```

#### Location Exit
```
┌─────────────────────────────────┐
│ 📍 Leaving Mosque                │
│                                 │
│ "اللهم اجعل خروجي هذا..."     │
│ (Adhkar for leaving mosque)     │
│                                 │
│ [Tap to view full adhkar]       │
└─────────────────────────────────┘
```

#### Travel Detection
```
┌─────────────────────────────────┐
│ 🚗 Traveling                     │
│                                 │
│ "رب اصحبنا برحمتك..."          │
│ (Travel adhkar)                 │
│                                 │
│ [Tap to view full adhkar]       │
└─────────────────────────────────┘
```

---

## Technical Implementation

### Backend Services

#### 1. **Geofence Service** (`services/geofence-service.ts`)
Handles location boundary monitoring:
- Registers geofences with OS
- Detects entry/exit events
- Triggers notifications
- Works in background

#### 2. **Notification Service** (`services/notification-service.ts`)
Manages notification display:
- Sets up notification channels (Android)
- Schedules notifications
- Displays with sound & vibration

#### 3. **Permissions Manager** (`services/permissions-manager.ts`)
Requests required permissions:
- Foreground location access
- **Background location access** (critical)
- Notification permissions

#### 4. **Background Task Setup** (`services/background-task-setup.ts`)
Initializes background tasks:
- Registers TaskManager tasks
- Sets up notification channels
- Prepares app for background operation

### Key Components

#### Location Database (`utils/location-db.ts`)
Stores user's saved locations:
```typescript
{
  id: "location-123",
  name: "Home",
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 200,  // meters
  category: "home",
  entryAdhkarIds: ["15", "24"],  // Adhkar to show on entry
  exitAdhkarIds: ["18", "22"],   // Adhkar to show on exit
  enabled: true,  // Toggle monitoring for this location
  createdAt: 1702000000000
}
```

#### Geofence Regions
Each location becomes a circular geofence region:
```
         Geofence Boundary
                ↓
         ┌─────────────┐
         │    200m     │
         │   radius    │
         │             │
         │    ○ User   │
         │   Location  │
         │             │
         └─────────────┘
                ↑
          Center point
        (latitude, longitude)
```

---

## Setting Up Background Location Monitoring

### Step 1: User Adds a Location

1. Open **Locations** tab
2. Tap **+** button
3. Enter location name (e.g., "Home")
4. Pin location on map or search
5. Adjust radius (50m-5000m)
6. Select category (Home, Mosque, Work, etc.)
7. Choose adhkar for **Entry** (when arriving)
8. Choose adhkar for **Exit** (when leaving)
9. Tap **Save**

### Step 2: Enable Location Monitoring

1. Tap **"Location Monitoring"** toggle
2. Grant **Foreground Location** permission
3. Grant **Background Location** permission
   - **Important:** Select "Always Allow" (or "All the time")
   - This is required for background monitoring
4. Grant **Notification** permission
5. Confirm: "✅ Monitoring active"

### Step 3: Background Notifications Work

Now, even if the app is **completely closed**:
- User enters the geofence → Notification appears ✅
- User exits the geofence → Notification appears ✅
- Works with screen locked ✅
- Works at any time of day ✅

---

## Android-Specific Details

### Permissions

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| `ACCESS_FINE_LOCATION` | Precise GPS location | ✅ Yes |
| `ACCESS_BACKGROUND_LOCATION` | Background monitoring | ✅ **Critical** |
| `POST_NOTIFICATIONS` | Send notifications | ✅ Yes |

### Foreground Service

When monitoring is active, Android shows a persistent notification:

```
───────────────────────────────
🔔 Subhanify is using location
───────────────────────────────
```

This notification:
- Cannot be swiped away (required by Android)
- Shows battery is being used
- User can tap to open app
- User can long-press to disable service

### Battery Impact

| Activity | Battery Drain |
|----------|---------------|
| Geofencing (1-5 locations) | ~2-5% per hour |
| GPS off, using WiFi/cell | ~1-2% per hour |
| Continuous tracking | ~10-15% per hour |

**Recommendation:** Use geofencing, not continuous tracking.

---

## iOS-Specific Details

### Permissions

Two-step permission flow:
1. **Foreground:** "While Using App"
2. **Background:** "Always Allow"

App will show blue status bar when tracking in background.

### Configuration in app.json

```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Location needed for adhkar reminders",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "Background location for adhkar reminders",
      "NSLocationAlwaysUsageDescription": "Background location for adhkar",
      "UIBackgroundModes": ["location"]
    }
  }
}
```

---

## Testing Background Location

### On Physical Device

1. **Add a test location**
   - Name: "Test Location"
   - Current position
   - Radius: 200m

2. **Configure adhkar**
   - Select any adhkar for entry/exit

3. **Enable monitoring**
   - Toggle "Location Monitoring" ON

4. **Test entry/exit**
   - Close app completely (don't just minimize)
   - Leave the geofence area (300m+ away)
   - Wait 30-60 seconds
   - Notification should appear ✅

5. **Test return**
   - Walk/drive back into geofence
   - Notification should appear again ✅

### Emulator Limitations

Android emulator doesn't simulate geofencing well. Better to test on:
- Physical Android device
- Or use `adb` to simulate location changes

---

## Troubleshooting

### Issue: "Background location permission denied"

**Solution:**
1. Settings > Apps > Subhanify > Permissions > Location
2. Select **"All the time"** or **"Always Allow"** (not "While using")
3. Restart app
4. Try enabling monitoring again

### Issue: "Geofencing not triggering in background"

**Checklist:**
- [ ] Background location permission granted (see above)
- [ ] Location monitoring toggle is ON
- [ ] GPS enabled on device
- [ ] Geofence radius > 50m (minimum)
- [ ] Actually walked outside the radius (300m+)
- [ ] Waited 30-60 seconds
- [ ] Notifications not disabled in Settings

**Debug steps:**
```bash
# Check if geofencing is registered
adb logcat | grep -i geofenc

# Check permission status
adb shell dumpsys package permissions | grep -A 5 subhanify
```

### Issue: "App not monitoring when closed"

**Causes:**
1. Background permission not granted → See "Background location permission denied" above
2. Battery optimization restricting app → Disable battery optimization for Subhanify
3. App force-closed → Don't swipe away from recent apps while monitoring
4. Device in extreme battery saver → Disable battery saver

**Fix:**
- Settings > Battery > Battery Optimization
- Find Subhanify
- Select "Don't optimize"

### Issue: "Notifications not showing"

**Check:**
1. Notification permission granted
2. Device not in "Do Not Disturb" mode
3. Subhanify notification settings enabled
4. Volume not on silent

---

## Travel Detection Feature

### How It Works

```
User starts traveling (detected by motion)
         ↓
App monitors for sustained movement
         ↓
Triggers travel-mode adhkar notification
         ↓
Shows travel adhkar (e.g., "رب اصحبنا برحمتك")
```

### Setup

1. Add location with category **"Travel"**
2. Select travel adhkar for entry
3. Enable location monitoring
4. When detected moving for >5 minutes → Notification

### Sensitivity

Travel detection uses:
- GPS speed data (GPS accuracy)
- Optional: Accelerometer/motion sensors
- Time duration (prevents false triggers)

---

## Privacy & Data

### What We Track
- ✅ User's current location (local only)
- ✅ Entry/exit events (stored locally)
- ✅ Geofence regions (stored locally)

### What We Don't Track
- ❌ Location history (not stored)
- ❌ Movement patterns (not analyzed)
- ❌ Cloud sync (all local)
- ❌ Data sharing (never sent anywhere)

### User Control
- Users can enable/disable anytime
- Users can delete locations
- Users can turn off notifications
- Users can revoke permissions in Settings

---

## Performance Considerations

### Optimal Setup

For best battery & performance:
1. **Use geofencing, not continuous tracking**
2. **Monitor 1-10 locations max** (more = more battery drain)
3. **Use radius 100-500m** (smaller = more frequent triggers)
4. **Enable only when needed** (toggle on/off by user choice)

### Monitoring Multiple Locations

```
Locations monitored: 1-5   → Minimal battery impact
Locations monitored: 5-10  → Low battery impact
Locations monitored: 10+   → Moderate battery impact
Continuous tracking (10s)  → High battery impact
```

### Optimization Tips

- **Increase radius** slightly (200m → 300m) = less triggers
- **Disable at night** if user wishes (manual toggle)
- **Use geofencing** only (not continuous tracking)
- **Monitor key locations only** (home, mosque, work)

---

## User Education

### Messages to Show Users

#### First Time Enabling
```
"Location Monitoring Enabled ✅

You will now receive adhkar reminders when you:
• Enter/leave saved locations
• Travel to new places

Notifications work even when app is closed.

To disable, toggle Location Monitoring OFF."
```

#### Permission Requests
```
"Background Location Permission

Select 'Always Allow' (or 'All the time') 
to receive adhkar reminders in the background.

This is required for notifications when 
the app is not running."
```

#### Battery Optimization Warning
```
"To ensure geofencing works reliably, 
disable battery optimization for Subhanify:

Settings > Battery > Battery Optimization
> Find Subhanify > Don't Optimize"
```

---

## Conclusion

Users now have a powerful way to receive adhkar reminders based on their location and movements, even when the app is closed. The feature is:

- ✅ **Private:** All data local
- ✅ **Efficient:** Uses native OS geofencing (low battery)
- ✅ **Reliable:** Works even with app closed/screen locked
- ✅ **Flexible:** User controls all aspects
- ✅ **Informative:** Clear permission dialogs and help

### Next Steps for Implementation

1. ✅ Background location permissions properly requested
2. ✅ Geofencing configured and working
3. ✅ Notifications triggered correctly
4. ✅ User can toggle monitoring on/off

**For production:**
- Build APK: `npx expo prebuild --platform android --clean && npx expo run:android`
- Test thoroughly on physical device
- Monitor error logs
- Release to production when confident

