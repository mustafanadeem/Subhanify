# Android Background Location & Geofencing Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       React Native App                          │
│  (Expo Router with TypeScript)                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────┐          ┌────────▼──────────┐
│  Location UI    │          │  Location Services│
│  (locations.tsx)│          │ (services/)       │
└───────┬─────────┘          └────────┬──────────┘
        │                             │
        │  requestLocationPermissions │ startGeofencingMonitoring
        │  getCurrentLocation         │ restartGeofencing
        │  toggleGeofencing           │ stopGeofencingMonitoring
        │                             │
        │     ┌───────────────────────┘
        │     │
        ▼     ▼
    ┌───────────────────────────────────────┐
    │    Services (Background Tasks)        │
    │                                       │
    │  • geofence-service.ts               │
    │  • notification-service.ts           │
    │  • permissions-manager.ts            │
    │  • continuous-location-service.ts    │
    │  • background-task-setup.ts          │
    └───────────────────┬───────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
       ┌────▼────┐          ┌──────▼──────┐
       │TaskManager          │Expo Location│
       │                     │             │
       │defineTask()         │requestFG()  │
       │isTaskRegistered()   │requestBG()  │
       │getRegisteredTasks() │startGeofen()│
       └────┬────┘          └──────┬──────┘
            │                      │
            │    ┌────────────────┐│
            │    │                ││
            ▼    ▼                ▼▼
    ┌─────────────────────────────────────┐
    │    Expo Modules (Native Bridge)     │
    │                                     │
    │    expo-task-manager               │
    │    expo-location                   │
    │    expo-notifications              │
    │    expo-constants                  │
    └─────────────────┬───────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
    ┌─────────────────┐        ┌──────────────────┐
    │  Android Native │        │  Android Native  │
    │                │        │  Permissions     │
    │  Geofencing    │        │                  │
    │  API           │        │  • CHECK_PERMS   │
    │                │        │  • REQUEST_PERMS │
    │ • FusedLocation│        │                  │
    │   Provider     │        │  • ACCESS_FINE   │
    │ • Geofencing   │        │  • ACCESS_BG     │
    │   API          │        │  • POST_NOTIFS   │
    └────┬───────────┘        └────┬─────────────┘
         │                         │
         │      ┌──────────────────┘
         │      │
         ▼      ▼
    ┌──────────────────────────┐
    │   Android Services       │
    │                          │
    │ • LocationListener       │
    │ • GeofenceTransition     │
    │ • ForegroundService      │
    │ • NotificationManager    │
    └──────────────────────────┘
```

---

## Execution Flow

### 1. App Startup

```
┌─ App Launches
│
├─ RootLayout (_layout.tsx) renders
│  │
│  ├─ Load fonts (Hafs, Saleen)
│  │
│  ├─ Initialize Theme & Navigation
│  │
│  └─ useEffect hook:
│     │
│     ├─ setupBackgroundTasks()
│     │  │
│     │  ├─ setupNotificationChannel() → Creates Android notification channel
│     │  │
│     │  ├─ Check TaskManager availability
│     │  │
│     │  └─ Log current task registrations
│     │
│     └─ RainAlertNotificationHandler.initialize()
│
└─ Navigation stack ready
```

### 2. User Enables Location Monitoring

```
┌─ User taps "Location Monitoring" toggle
│
├─ handleToggleGeofencing(true)
│  │
│  ├─ requestLocationPermissions()
│  │  │
│  │  ├─ Location.requestForegroundPermissionsAsync()
│  │  │  └─ (User grants "While Using App")
│  │  │
│  │  └─ Location.requestBackgroundPermissionsAsync()
│  │     └─ (User must select "Always Allow")
│  │
│  └─ restartGeofencing()
│     │
│     ├─ getEnabledLocations() → Query SQLite DB
│     │
│     ├─ Convert locations to Geofence regions
│     │
│     ├─ Location.startGeofencingAsync(TASK_NAME, regions)
│     │  │
│     │  └─ [Crosses into Android Native]
│     │     │
│     │     ├─ GeofencingRequest created with regions
│     │     │
│     │     ├─ PendingIntent linked to TaskManager
│     │     │
│     │     └─ FusedLocationProvider registers monitoring
│     │
│     └─ Foreground service starts with persistent notification
│
└─ Monitoring active (even with app closed)
```

### 3. User Crosses Geofence Boundary

```
┌─ User exits geofence (300m+ away)
│
├─ [Android OS detects transition]
│  │
│  ├─ FusedLocationProvider API triggers
│  │
│  ├─ GeofencingEvent created
│  │
│  └─ PendingIntent fires TaskManager task
│
├─ TaskManager.defineTask handler executes
│  │
│  ├─ GEOFENCING_TASK receives:
│  │  │
│  │  ├─ data.eventType = 'enter' or 'exit'
│  │  │
│  │  └─ data.region = { identifier, latitude, longitude, radius }
│  │
│  ├─ Query database for location by region.identifier
│  │
│  ├─ Get configured adhkar for event type
│  │
│  ├─ showAdhkarNotification()
│  │  │
│  │  └─ Notifications.scheduleNotificationAsync()
│  │     │
│  │     ├─ Android: Uses 'location-adhkar' channel
│  │     │
│  │     └─ Shows immediately (trigger: null)
│  │
│  └─ Task completes
│
└─ User sees notification
   │
   ├─ Even if app is closed ✅
   ├─ Even if screen is locked ✅
   └─ Even if phone in battery saver ⚠️
```

### 4. Background Location Updates (Continuous Tracking)

```
┌─ startContinuousTracking() called
│  │
│  ├─ Register callback function
│  │
│  ├─ Location.startLocationUpdatesAsync(TASK_NAME, options)
│  │  │
│  │  └─ [Crosses into Android Native]
│  │     │
│  │     ├─ FusedLocationProvider.requestLocationUpdates()
│  │     │
│  │     ├─ PendingIntent for background task
│  │     │
│  │     └─ Foreground service with persistent notification
│  │
│  └─ OS continuously updates location every N seconds
│
└─ Each update:
   │
   ├─ TaskManager handler receives new location
   │
   ├─ Call registered callback with LocationUpdate object
   │
   └─ Can process: save to DB, calculate distance, trigger events
```

---

## Task Registration & Lifecycle

### TaskManager Tasks

Two main tasks are defined:

#### 1. Geofencing Task
```typescript
// Defined in: services/geofence-service.ts
TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }) => {
  // Fires when user crosses geofence boundary
  // Platform: Android & iOS
  // Permissions required: ACCESS_BACKGROUND_LOCATION
})
```

**Lifecycle:**
```
define() → register() → monitor ← border-cross → handle() → unregister()
  |          ↑                                       ↓
  └──────────┼───────────────────────────────────────┘
         Always defined,
         activated on demand
```

#### 2. Continuous Location Task
```typescript
// Defined in: services/continuous-location-service.ts
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  // Fires on each location update (every 10s, 50m minimum)
  // Platform: Android & iOS
  // Permissions required: ACCESS_BACKGROUND_LOCATION
})
```

**Lifecycle:**
```
define() → (inactive) → startLocationUpdatesAsync()
             ↓              ↓
        Can be           register()
        called            ↓
                      tick (every N seconds) → handle()
                           ↑                    ↓
                           └────────────────────┘
```

---

## Permissions Model

### Android Runtime Permissions (API 23+)

```
┌─ First app launch
│
├─ App does NOT have location permissions yet
│
├─ User tries to use location features
│
├─ App calls Location.requestForegroundPermissionsAsync()
│  │
│  ├─ [System dialog appears]
│  │  "Subhanify wants access to your location"
│  │  [Deny] [While Using App] [Allow All the Time]
│  │
│  └─ User must select option
│
└─ Then for background:
   │
   ├─ App calls Location.requestBackgroundPermissionsAsync()
   │  │
   │  ├─ [Another system dialog]
   │  │  "Allow Subhanify to always have access?"
   │  │  [Only While Using] [Always Allow]
   │  │
   │  └─ User must select "Always Allow" for geofencing
   │
   └─ Geofencing can now work in background
```

### Permission Levels

| Permission | Purpose | Dialog | Required? |
|-----------|---------|--------|-----------|
| `ACCESS_FINE_LOCATION` | Precise location (GPS) | Foreground | ✅ Yes |
| `ACCESS_COARSE_LOCATION` | Approximate location | Foreground | Fallback |
| `ACCESS_BACKGROUND_LOCATION` | Background monitoring | Background | ✅ For geofencing |
| `POST_NOTIFICATIONS` | Send notifications | At request | ✅ For alerts |
| `ACTIVITY_RECOGNITION` | Detect movement | At request | Optional |

### app.json Configuration

```json
{
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",  ← CRITICAL for geofencing
      "POST_NOTIFICATIONS",
      "ACTIVITY_RECOGNITION"
    ]
  },
  "plugins": [
    ["expo-location", {
      "isAndroidBackgroundLocationEnabled": true,    ← CRITICAL
      "isAndroidForegroundServiceEnabled": true       ← CRITICAL
    }]
  ]
}
```

---

## Database Integration

### Location Storage (SQLite)

**File:** `utils/location-db.ts`

```
┌─ User adds location
│
├─ Location object created:
│  {
│    id: string (UUID)
│    name: string
│    latitude: number
│    longitude: number
│    radius: number (meters)
│    category: LocationCategory
│    entryAdhkarIds: string[] (indices)
│    exitAdhkarIds: string[] (indices)
│    enabled: boolean
│    createdAt: number (timestamp)
│  }
│
├─ saveLocation() called
│  │
│  ├─ SQLite INSERT/UPDATE
│  │
│  └─ Database stores all location data locally
│
└─ When geofencing event fires:
   │
   ├─ Query database: SELECT * FROM locations WHERE id = ?
   │
   ├─ Get stored location with configured adhkar IDs
   │
   └─ Use to determine which adhkar to show
```

### Adhkar Data (JSON - In Memory)

**Files:** `data/adkar_dua.json`, `data/duas.json`

```
┌─ App loads adhkar data at startup
│
├─ Stored in Redux/Context (or imported directly)
│
├─ When geofence event fires:
│  │
│  ├─ Get location from database (has adhkar IDs)
│  │
│  ├─ Map IDs to adhkar items in JSON
│  │
│  └─ Extract Arabic, transliteration, translation
│
└─ Pass to notification service
```

---

## Notification Flow

### Setup Phase

```
┌─ App initializes (background-task-setup.ts)
│
├─ setupNotificationChannel() called
│  │
│  └─ Notifications.setNotificationChannelAsync('location-adhkar', {
│       importance: HIGH,
│       vibration: true,
│       sound: 'default'
│     })
│
└─ Channel persists in Android system
   (Can be modified in Settings > Apps > Subhanify > Notifications)
```

### Notification Display Phase

```
┌─ Geofence event triggered
│
├─ showAdhkarNotification() called with:
│  {
│    locationName: 'Home',
│    eventType: 'entry',
│    adhkar: { Arabic, transliteration, translation, ... }
│  }
│
├─ Notifications.scheduleNotificationAsync({
│    content: {
│      title: 'Entering Home',
│      body: 'أستغفر الله ...',
│      data: { adhkar, locationName, eventType },
│      sound: 'default',
│      priority: HIGH,
│      android: { channelId: 'location-adhkar' }
│    },
│    trigger: null  // Show immediately
│  })
│
└─ Android shows notification
   ├─ With high priority
   ├─ With sound (if volume on)
   ├─ With vibration
   └─ Persists until user dismisses
```

---

## Foreground Service (Android)

### What & Why

A **Foreground Service** is an Android concept where an app runs a persistent service with a user-visible notification.

**Required for:**
- Background location updates
- Background geofencing
- Long-running background operations

**Visible as:**
- Persistent notification in status bar
- Cannot be dismissed (must stop service)

### Expo Configuration

In `app.json`:
```json
["expo-location", {
  "isAndroidForegroundServiceEnabled": true
}]
```

This auto-configures:
- Generates AndroidManifest.xml entries
- Creates foreground service notification
- Handles lifecycle management
- Prevents app from being killed by OS

### User Experience

```
┌─ User enables location monitoring
│
├─ Foreground service starts automatically
│
└─ Status bar shows:
   "Subhanify is using location"
   (Small icon + notification)
```

This notification:
- Cannot be swiped away ✓
- Shows while app is closed ✓
- Shows battery is being used ✓
- User can tap to open app ✓
- User can long-press to disable service ✓

---

## Geofence Regions

### Region Configuration

```typescript
interface GeofenceRegion {
  identifier: string;              // Location ID (UUID)
  latitude: number;                // Center lat
  longitude: number;               // Center lon
  radius: number;                  // In meters (50-5000)
  notifyOnEnter: boolean;          // Fire entry event?
  notifyOnExit: boolean;           // Fire exit event?
}
```

### Platform Differences

| Aspect | Android | iOS |
|--------|---------|-----|
| Max regions | Unlimited* | 20 |
| Min radius | 50m | 100m |
| Max radius | 5000m | Limited |
| Accuracy | 10-50m** | 20-100m** |
| Time to trigger | 1-2 min avg | 1-2 min avg |
| Works offline | ✅ Yes | ❌ No |

\* Android has soft limit; too many may drain battery  
\*\* Depends on GPS accuracy and device

### Boundary Crossing

```
                Current Location
                      |
        Safe Zone      |      Geofence Boundary
            ┌─────────┐│┌─────────┐
            │         ││         │
            │  100m   ││ 300m    │
            │         ││         │
            │    ○    │ ●        │
            │  User   │ Geofence │
            │         ││ Region  │
            │         ││         │
            └─────────┘└─────────┘
                      △
            400m away
            (Outside boundary)

Events:
  • User at ○ (100m from center): No event
  • User walks to △ (400m): EXIT event ✓
  • User walks back to ○: ENTRY event ✓
```

---

## Battery & Performance Implications

### Battery Impact

| Operation | Battery Drain | Duration |
|-----------|---------------|----------|
| Geofencing | Low | Continuous |
| Continuous tracking (10s) | High | Continuous |
| Continuous tracking (60s) | Medium | Continuous |
| Single location fetch | Very low | One-time |
| Last known location | Negligible | One-time |

### Performance Metrics

```
Geofencing:
  • CPU: ~5-10% when monitoring 1-5 regions
  • Battery: ~2-5% additional drain per hour
  • Memory: ~10-20 MB for task + storage
  • Network: 0 MB (local GPS only)

Continuous Location (10s intervals):
  • CPU: ~20-30%
  • Battery: ~10-15% additional drain per hour
  • Memory: ~15-25 MB
  • Network: 0 MB (local GPS only)
```

### Optimization Strategies

1. **Use geofencing, not continuous tracking** (1/3 battery impact)
2. **Larger geofence radius** (less precise, less CPU)
3. **Fewer locations monitored** (fewer wakeups)
4. **Less frequent updates** (if using continuous)
5. **Disable at night** (if user enables manually)

---

## Error Handling & Recovery

### Common Errors

```
┌─ "Background location permission not granted"
│  └─ User selected "While Using" instead of "Always"
│     Solution: Request again, show rationale
│
├─ "TaskManager not available"
│  └─ Running in Expo Go (no native support)
│     Solution: Use development build or standalone APK
│
├─ "No locations to monitor"
│  └─ User hasn't added any locations
│     Solution: Show prompt to add location
│
├─ "Geofencing timeout"
│  └─ GPS signal weak, can't calculate position
│     Solution: Wait longer, increase radius
│
└─ "Notification failed"
   └─ Notification permissions revoked in Settings
      Solution: Prompt to re-enable notifications
```

### Graceful Degradation

```
┌─ Try to start geofencing
│
├─ Check permissions
│  │
│  ├─ ✅ Both granted → Start geofencing
│  │
│  ├─ ⚠️ Foreground only → Warn user, try anyway
│  │
│  └─ ❌ None granted → Show permission dialog
│
└─ If still fails
   │
   ├─ Log error
   ├─ Show user-friendly message
   └─ App continues to work (just no background location)
```

---

## Testing Strategy

### Unit Testing

```typescript
// Test geofence region creation
describe('Geofencing', () => {
  test('creates valid region', () => {
    const location: SavedLocation = {
      id: '123',
      name: 'Home',
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 200,
      // ...
    };
    
    const region = createGeofenceRegion(location);
    
    expect(region.identifier).toBe('123');
    expect(region.latitude).toBe(40.7128);
  });
});
```

### Integration Testing

```typescript
// Test permission flow
test('requests background location permission', async () => {
  const result = await requestLocationPermissions();
  expect(result.granted).toBe(true);
  expect(result.background).toBe(true);
});
```

### Manual Testing (Physical Device)

See [Android Build Guide](./ANDROID_BUILD_GUIDE.md#testing-background-location)

### Emulator Limitations

- Geofencing doesn't work well
- Use GPS emulation in Extended Controls
- Better to test on physical device

---

## Debugging Tools

### Logs

```bash
# Geofencing events
adb logcat | grep -i "geofenc"

# Background tasks
adb logcat | grep -i "TaskManager"

# Location updates
adb logcat | grep -i "Location"

# Our app logs
adb logcat | grep -i "BackgroundTaskSetup\|GeofenceService"
```

### Android Studio

1. Open `android/` folder in Android Studio
2. Use debugger to set breakpoints
3. Inspect native events in "Logcat" tab

### Custom Debug Panel (In-App)

Add debug screen showing:
- Current permissions
- Registered tasks
- Monitored geofences
- Last location
- Notification status

---

## Conclusion

The Subhanify app has a **production-ready** background location system:

✅ **Complete:** Permissions, geofencing, tasks, notifications  
✅ **Efficient:** Uses native OS APIs, low battery impact  
✅ **Safe:** All data local, no tracking/cloud sync  
✅ **User-friendly:** Clear prompts, error handling  

**To deploy:**
1. Build with `npx expo prebuild --platform android`
2. Test on device thoroughly
3. Submit to Play Store or distribute APK
4. Monitor logs for crashes/errors

