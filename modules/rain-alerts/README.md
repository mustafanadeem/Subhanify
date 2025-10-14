# Rain Alerts Module

Cross-platform rain notification system with platform-specific weather sources and unified UX.

## Features

- ✅ Platform-specific weather APIs (WeatherKit for iOS, OpenWeather for Android)
- ✅ Tile-based coarse location for privacy (~1 km geohash precision)
- ✅ Strict 1-alert-per-hour rate limiting
- ✅ Customizable lead time (0-30 minutes)
- ✅ Intensity thresholds (any, light+, moderate+)
- ✅ Quiet hours support (22:00-07:00 default)
- ✅ Beautiful dua display with rain notification
- ✅ Mock backend client for development
- ✅ Native iOS (Swift) and Android (Kotlin) modules
- ✅ Background tasks and push notifications

## Quick Start

### 1. Install Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-community/slider
npm install expo-location expo-notifications
```

### 2. Initialize Service

```typescript
import { RainAlertService } from './modules/rain-alerts';

// In your app initialization
await RainAlertService.initialize();
```

### 3. Add Settings Screen Link

```typescript
import { useRouter } from 'expo-router';

function SettingsScreen() {
  const router = useRouter();
  
  return (
    <TouchableOpacity onPress={() => router.push('/rain-alert-settings')}>
      <Text>Rain Alerts</Text>
    </TouchableOpacity>
  );
}
```

### 4. Handle Notification Actions

```typescript
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

Notifications.addNotificationResponseReceivedListener((response) => {
  if (response.notification.request.content.categoryIdentifier === 'RAIN_ALERT') {
    const actionId = response.actionIdentifier;
    
    if (actionId === 'READ_DUA') {
      const payload = response.notification.request.content.data;
      router.push({
        pathname: '/rain-dua',
        params: {
          intensity: payload.intensity,
          leadMinutes: payload.leadMinutes,
        },
      });
    }
  }
});
```

## Project Structure

```
modules/rain-alerts/
├── ios/                          # iOS Native Module
│   ├── RainAlertModule.swift    # Expo module with cooldown logic
│   ├── AppDelegate+RainAlert.swift  # Background tasks setup
│   └── Info.plist.additions.xml # Required permissions
├── android/                      # Android Native Module
│   └── src/main/java/com/subhanify/rainalert/
│       ├── RainAlertModule.kt   # Expo module
│       ├── RainAlertWorker.kt   # WorkManager for fallback
│       ├── RainAlertFirebaseService.kt  # FCM receiver
│       ├── AndroidManifest.xml  # Permissions & services
│       └── build.gradle         # Dependencies
├── BACKEND_README.md            # Backend implementation guide
├── README.md                    # This file
└── index.ts                     # Module exports

app/
├── rain-alert-settings.tsx      # Settings UI
└── rain-dua.tsx                 # Dua display screen

services/
├── rain-alert-service.ts        # Main service orchestration
├── rain-alert-backend-client.ts # API client (mock mode default)
├── rain-alert-storage.ts        # AsyncStorage wrapper
└── rain-alert-cooldown.ts       # Rate limiting logic

types/
└── rain-alerts.ts               # TypeScript interfaces

utils/
└── geohash-utils.ts             # Location tile encoding
```

## Configuration

### Environment Variables (app.json)

```json
{
  "expo": {
    "extra": {
      "rainAlertBackendUrl": "https://api.subhanify.com",
      "rainAlertMockMode": true
    }
  }
}
```

### iOS Setup

1. Add to `Info.plist`:
   - `NSLocationWhenInUseUsageDescription`
   - `NSLocationAlwaysAndWhenInUseUsageDescription`
   - `BGTaskSchedulerPermittedIdentifiers`

2. Register background tasks in `AppDelegate`:
   ```swift
   import BackgroundTasks
   
   func application(_ application: UIApplication, didFinishLaunchingWithOptions...) {
     registerRainAlertBackgroundTasks()
   }
   ```

### Android Setup

1. Add to `AndroidManifest.xml`:
   - `ACCESS_COARSE_LOCATION`
   - `POST_NOTIFICATIONS`
   - `INTERNET`

2. Add FCM service registration (already in module manifest)

3. Initialize WorkManager (done automatically by module)

## Usage Examples

### Enable Rain Alerts

```typescript
import { RainAlertService, RainAlertStorage } from './modules/rain-alerts';

await RainAlertStorage.saveSettings({ enabled: true });
await RainAlertService.enable();
```

### Update Settings

```typescript
await RainAlertStorage.saveSettings({
  leadTimeMinutes: 10,
  intensityThreshold: 'moderate+',
  quietHoursEnabled: true,
});

await RainAlertService.updateSettings();
```

### Check Cooldown Status

```typescript
import { RainAlertCooldown } from './modules/rain-alerts';

const canShow = await RainAlertCooldown.canShowAlert();
const remaining = await RainAlertCooldown.getRemainingCooldown();

console.log(`Can show: ${canShow}, Remaining: ${remaining}s`);
```

### Manual Location Update

```typescript
import * as Location from 'expo-location';
import { getTileId } from './modules/rain-alerts';
import { RainAlertBackendClient } from './modules/rain-alerts';

const location = await Location.getCurrentPositionAsync();
const tileId = getTileId(location.coords.latitude, location.coords.longitude, 7);

await RainAlertBackendClient.updateLocation({
  deviceId: 'your-device-id',
  tileId,
});
```

### Simulate Test Alert

```typescript
import { RainAlertService, RAIN_DUA_FULL } from './modules/rain-alerts';

const payload = {
  type: 'RAIN_START' as const,
  leadMinutes: 0,
  intensity: 'moderate' as const,
  phrase: 'Rain has started nearby',
  dua: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
};

await RainAlertService.showRainAlert(payload);
```

## API Reference

### RainAlertService

Main orchestration service.

- `initialize()` - Set up notifications, permissions, and location tracking
- `enable()` - Start rain alert monitoring
- `disable()` - Stop monitoring and unregister device
- `updateSettings()` - Sync new settings to backend
- `handlePushNotification(payload)` - Process incoming rain alert
- `showRainAlert(payload)` - Display notification

### RainAlertStorage

Persistent storage wrapper.

- `getSettings()` - Retrieve current settings
- `saveSettings(partial)` - Update settings
- `getState()` - Get alert state (lastAlertAt, tileId, etc.)
- `saveState(partial)` - Update state
- `recordAlert()` - Store timestamp of last alert
- `updateTileId(tileId)` - Update location tile
- `setDeviceId(id)` - Store device registration ID

### RainAlertCooldown

Rate limiting utilities.

- `canShowAlert()` - Check if cooldown has expired
- `getRemainingCooldown()` - Seconds until next alert allowed
- `isQuietHours()` - Check if currently in quiet hours
- `shouldShowAlert()` - Combined check (enabled + cooldown + quiet hours)

### RainAlertBackendClient

Backend API client.

- `registerDevice(registration)` - Register for push notifications
- `updateLocation(update)` - Update device location tile
- `unregisterDevice(deviceId)` - Remove device from system
- `parsePushPayload(data)` - Parse FCM/APNS payload
- `simulateRainAlert()` - Generate test payload

## Backend Integration

See [BACKEND_README.md](./BACKEND_README.md) for complete backend implementation guide including:

- WeatherKit (iOS) integration with JWT authentication
- OpenWeather (Android) API integration
- Tile-based location batching strategy
- Rate limiting enforcement (server + client)
- Push notification payload schema
- Database schema and caching
- Environment variables and deployment

## Testing

### Manual Testing

1. **Enable rain alerts** in settings
2. **Set lead time** to 0 minutes (immediate)
3. **Tap "Send Test Notification"**
4. **Verify notification** appears with dua
5. **Tap "Read Dua"** - should open dua screen
6. **Try sending again** - should be blocked by cooldown

### Automated Testing

```typescript
import { RainAlertCooldown, RainAlertStorage } from './modules/rain-alerts';

describe('Rain Alert Cooldown', () => {
  it('should enforce 1-hour cooldown', async () => {
    await RainAlertStorage.recordAlert();
    
    const canShow = await RainAlertCooldown.canShowAlert();
    expect(canShow).toBe(false);
    
    const remaining = await RainAlertCooldown.getRemainingCooldown();
    expect(remaining).toBeGreaterThan(3500);
  });
});
```

### Integration Testing

1. **Tile changes**: Move device, verify backend update
2. **Quiet hours**: Test notifications during quiet period
3. **Settings sync**: Change intensity threshold, verify filtering
4. **Background refresh**: Verify iOS BGTaskScheduler runs
5. **WorkManager**: Verify Android fallback mode works

## Privacy & Security

✅ **No raw GPS coordinates** - Only coarse tiles transmitted  
✅ **No weather API keys in app** - Backend proxies all requests  
✅ **Minimal battery impact** - Significant-change location only  
✅ **Clear opt-in** - User must enable in settings  
✅ **Transparent storage** - All data in AsyncStorage, easily cleared  

## Troubleshooting

### Notifications not showing

1. Check notification permissions granted
2. Verify rain alerts enabled in settings
3. Check cooldown hasn't been triggered
4. Review device logs for errors
5. Test with mock backend mode

### Location updates failing

1. Verify location permission granted
2. Check network connectivity
3. Review backend URL configuration
4. Test with manual location update

### Cooldown not working

1. Check `onePerHourEnabled` setting
2. Verify AsyncStorage persisting data
3. Review timestamp comparison logic
4. Clear app data and retry

## License

MIT

