# Services Architecture

This directory contains modular service classes/functions for handling cross-platform location tracking, permissions, geofencing, and notifications in the Subhanify app.

## Architecture Overview

The services follow a **clean architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│         UI Layer (React Components)              │
│         - locations.tsx                          │
│         - explore.tsx                            │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│         Service Layer (Business Logic)          │
│  ┌───────────────────────────────────────────┐  │
│  │  permissions-manager.ts                   │  │
│  │  (Single Source of Truth for Permissions)│  │
│  └───────────────────────────────────────────┘  │
│           ↓                    ↓                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ geofence-service │  │ continuous-location  │ │
│  │      .ts         │  │    -service.ts       │ │
│  └──────────────────┘  └──────────────────────┘ │
│           ↓                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  notification-service.ts                 │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│    Platform APIs (Expo Abstraction Layer)       │
│    - expo-location                               │
│    - expo-notifications                          │
│    - expo-task-manager                           │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│         Native Platform APIs                     │
│  Android              │  iOS                     │
│  - FusedLocation      │  - Core Location         │
│  - Geofencing API     │  - CLLocationManager     │
│  - NotificationMgr    │  - UNNotificationCenter  │
└─────────────────────────────────────────────────┘
```

## Module Descriptions

### 1. **permissions-manager.ts** (Core Module)

**Purpose**: Centralized permission management with user rationale dialogs

**Responsibilities**:
- Request location permissions (foreground + background)
- Request notification permissions
- Show user-friendly rationale dialogs explaining why permissions are needed
- Handle permission denial scenarios
- Redirect users to app settings when permissions are permanently denied

**Platform-Specific Details**:
- **Android**: Handles ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION (API 29+)
- **iOS**: Handles WhenInUse and Always location permissions with Info.plist keys

**Key Functions**:
- `requestLocationPermissionsWithRationale()` - Main entry point with user dialog
- `requestLocationPermissions()` - Direct permission request (no dialog)
- `checkLocationPermissions()` - Check current permission status
- `showPermissionDeniedDialog()` - Show settings redirect dialog
- `openAppSettings()` - Navigate to device settings

**Usage Example**:
```typescript
import { requestLocationPermissionsWithRationale } from '@/services/permissions-manager';

const result = await requestLocationPermissionsWithRationale();
if (result.granted && result.background) {
  // Proceed with location tracking
}
```

---

### 2. **geofence-service.ts**

**Purpose**: Handle location-based geofencing triggers (enter/exit regions)

**Responsibilities**:
- Register geofence regions for saved locations
- Monitor geofence enter/exit events in background
- Trigger adhkar notifications when user enters/exits locations
- Provide current location with retry logic

**Platform-Specific Details**:
- **Android**: Uses FusedLocationProvider Geofencing API with PendingIntents
- **iOS**: Uses CLCircularRegion (limit: 20 regions per app)

**Prerequisites**:
- Location permissions must be granted via `permissions-manager.ts`
- Background location permission required for monitoring

**Key Functions**:
- `startGeofencingMonitoring(locations)` - Start monitoring geofence regions
- `stopGeofencingMonitoring()` - Stop all geofence monitoring
- `restartGeofencing()` - Restart with updated locations
- `getCurrentLocation()` - Get user's current position with retry
- `getLastKnownLocation()` - Get cached location (faster but may be stale)

**Usage Example**:
```typescript
import { startGeofencingMonitoring } from '@/services/geofence-service';

await startGeofencingMonitoring([
  {
    id: '1',
    name: 'Local Mosque',
    latitude: 37.78825,
    longitude: -122.4324,
    radius: 100,
    entryAdhkarIds: ['0', '1'],
    exitAdhkarIds: ['2'],
  }
]);
```

---

### 3. **continuous-location-service.ts**

**Purpose**: Continuous real-time location tracking (battery-intensive)

**Responsibilities**:
- Track user location continuously with configurable intervals
- Provide location update callbacks
- Support foreground service on Android for background tracking

**Platform-Specific Details**:
- **Android**: Uses FusedLocationProvider with foreground service notification
- **iOS**: Uses CLLocationManager with continuous updates

**When to Use**:
- Real-time location tracking (e.g., journey recording)
- Scenarios where geofencing alone is insufficient

**When NOT to Use**:
- Location-based triggers (use geofencing instead - more battery efficient)

**Key Functions**:
- `startContinuousTracking(callback, options)` - Start continuous tracking
- `stopContinuousTracking()` - Stop tracking
- `isContinuousTrackingActive()` - Check tracking status
- `getSingleLocationUpdate()` - One-time location fetch

**Usage Example**:
```typescript
import { startContinuousTracking } from '@/services/continuous-location-service';

await startContinuousTracking(
  (update) => {
    console.log('Location:', update.latitude, update.longitude);
  },
  {
    timeInterval: 10000, // 10 seconds
    distanceInterval: 50, // 50 meters
  }
);
```

---

### 4. **notification-service.ts**

**Purpose**: Display notifications for adhkar reminders

**Responsibilities**:
- Show immediate notifications
- Schedule delayed notifications
- Configure notification channels (Android)
- Handle notification listeners

**Platform-Specific Details**:
- **Android**: Uses NotificationManager with channels (API 26+)
- **iOS**: Uses UNUserNotificationCenter

**Note**: Notification permission requests should use `permissions-manager.ts`

**Key Functions**:
- `setupNotificationChannel()` - Initialize Android notification channel
- `showAdhkarNotification()` - Display single adhkar notification
- `showMultipleAdhkarNotifications()` - Display multiple with delays
- `addNotificationReceivedListener()` - Listen for incoming notifications
- `addNotificationResponseListener()` - Listen for user taps

**Usage Example**:
```typescript
import { showAdhkarNotification } from '@/services/notification-service';

await showAdhkarNotification(
  'Local Mosque',
  'entry',
  { Adhkar: 'Subhanallah', Category: 'Mosque' }
);
```

---

## Best Practices

### 1. **Always Request Permissions Through permissions-manager.ts**

❌ **Don't** request permissions directly in services:
```typescript
// DON'T DO THIS
const { status } = await Location.requestForegroundPermissionsAsync();
```

✅ **Do** use the centralized permissions manager:
```typescript
// DO THIS
import { requestLocationPermissionsWithRationale } from '@/services/permissions-manager';
const result = await requestLocationPermissionsWithRationale();
```

### 2. **Check Permissions Before Starting Services**

```typescript
import { checkLocationPermissions } from '@/services/permissions-manager';
import { startGeofencingMonitoring } from '@/services/geofence-service';

const permissions = await checkLocationPermissions();
if (permissions.granted && permissions.background) {
  await startGeofencingMonitoring(locations);
} else {
  // Request permissions or show error
}
```

### 3. **Prefer Geofencing Over Continuous Tracking**

For location-based triggers, always prefer geofencing (battery efficient):

```typescript
// ✅ Good: Battery efficient
await startGeofencingMonitoring(locations);

// ❌ Bad: Battery intensive (only use when necessary)
await startContinuousTracking(callback);
```

### 4. **Handle Permission Denials Gracefully**

```typescript
const result = await requestLocationPermissionsWithRationale();
if (!result.granted) {
  if (!result.canAskAgain) {
    showPermissionDeniedDialog('location');
  } else {
    // User selected "Not Now" - can ask again later
  }
}
```

---

## Platform Requirements

### Android (app.json)

```json
{
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "POST_NOTIFICATIONS"
    ]
  },
  "plugins": [
    [
      "expo-location",
      {
        "isAndroidBackgroundLocationEnabled": true,
        "isAndroidForegroundServiceEnabled": true
      }
    ]
  ]
}
```

### iOS (app.json)

```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Subhanify needs your location to remind you of adhkar when entering/leaving places",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "Subhanify needs background location to send adhkar reminders even when app is not active",
      "NSLocationAlwaysUsageDescription": "Subhanify needs background location for adhkar reminders",
      "UIBackgroundModes": ["location"]
    }
  }
}
```

---

## Testing Considerations

### Expo Go Limitations

⚠️ **Important**: Background location and geofencing **do not work in Expo Go**. 

To test:
1. Build a development client: `eas build --profile development --platform android`
2. Install the development build on device
3. Test location features

### Testing Geofencing

1. Grant all location permissions (including "Allow all the time")
2. Add a test location near your current position (50-100m radius)
3. Walk outside the radius and back in to trigger events
4. Check notifications and logs

### Testing Continuous Tracking

1. Start continuous tracking
2. Check logs for location updates
3. Verify foreground service notification (Android)
4. Test in background by minimizing app

---

## Troubleshooting

### Location Not Updating in Expo Go
**Solution**: Build development client - Expo Go has limitations

### Geofence Not Triggering
**Checklist**:
- Background location permission granted?
- Geofence radius >= 100m? (iOS minimum)
- Are you moving enough distance? (Try 200m+ from boundary)
- Check logs for geofencing events

### Permission Dialog Not Showing
**Checklist**:
- Check Info.plist keys are present (iOS)
- Verify permissions in app.json (Android)
- Try uninstalling and reinstalling app

---

## Future Enhancements

- [ ] Add permission status UI component
- [ ] Implement location history tracking
- [ ] Add map-based location selection UI
- [ ] Support iOS 20-region limit with priority system
- [ ] Add analytics for geofence events
- [ ] Implement offline location caching

---

## Additional Resources

- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Geofencing API](https://developer.android.com/training/location/geofencing)
- [iOS Core Location](https://developer.apple.com/documentation/corelocation)

