# 🕌 Automatic Nearby Mosque Monitoring

## Overview

Intelligent geofencing system that automatically monitors nearby mosques and cleans up those you haven't been near in a while.

## Features

### ✅ Auto-Enable Nearby Mosques
- Automatically monitors the **15 nearest mosques** to your location
- Updates when you move significantly (>2km) or every 6 hours
- Respects iOS 20-region limit by being selective

### ✅ Smart Prioritization
Mosques are ranked by:
1. **Distance**: Closer mosques prioritized
2. **Visit Frequency**: Frequently visited mosques stay monitored
3. **Recency**: Recently visited mosques prioritized

### ✅ Auto-Cleanup
- Removes mosques not visited in **7 days**
- Frees up geofence slots for more relevant mosques
- Keeps monitoring optimized

### ✅ Battery Efficient
- Only monitors relevant nearby mosques
- Automatic updates prevent unnecessary geofence changes
- Works within iOS/Android limits

---

## How It Works

### 1. Initial Setup
When you enable "Auto Mosque Monitoring":
- System finds 15 nearest mosques within 10km
- Enables geofencing for those mosques
- Starts tracking visits

### 2. Automatic Updates
System updates when:
- You move more than 2km from last update
- 6 hours have passed since last update
- You manually toggle the feature

### 3. Visit Tracking
When you're near a mosque:
- Visit is recorded with timestamp
- Visit counter increments
- Mosque priority increases

### 4. Cleanup
Every 7 days:
- Removes mosques not seen recently
- Keeps frequently visited mosques
- Optimizes geofence usage

---

## UI Controls

### Auto Mosque Monitoring Toggle
**Location**: Locations Tab → Toggle Switch

**States:**
- **Enabled**: "Monitoring X nearby mosques"
- **Disabled**: "Disabled - only saved locations"

### Show All Mosques Toggle
**Location**: Locations Tab → Toggle Switch

Shows/hides all 300+ mosque markers on map (visual only, doesn't affect geofencing)

---

## Technical Details

### Storage
Uses AsyncStorage to persist:
- Currently monitored mosques
- Visit history per mosque
- Last update timestamp

### Geofence Limits
- **iOS**: 20 regions maximum
- **Android**: No hard limit, but battery considerations
- **Strategy**: 15 mosques + 5 user locations = 20 total

### Update Logic
```typescript
shouldUpdate = (
  moved > 2km OR
  timeSince > 6 hours OR
  noMosquesMonitored
)
```

### Scoring Algorithm
```typescript
score = (
  1 / (distance + 1) +     // Closer = higher score
  visitCount * 0.1 +       // More visits = higher score
  (recent ? 1 : 0)         // Recently visited = bonus
)
```

---

## API Reference

### `updateNearbyMosqueGeofencing(lat, lon, userLocations)`
Main function to update nearby mosque monitoring.

```typescript
const count = await updateNearbyMosqueGeofencing(
  51.5074,
  -0.1278,
  userSavedLocations
);
```

### `shouldUpdateMosqueMonitoring(lat, lon)`
Check if update is needed based on movement/time.

```typescript
const shouldUpdate = await shouldUpdateMosqueMonitoring(lat, lon);
if (shouldUpdate) {
  // Update geofencing
}
```

### `getMosqueMonitoringStats()`
Get statistics about mosque monitoring.

```typescript
const stats = await getMosqueMonitoringStats();
// {
//   monitored: 15,
//   totalVisits: 42,
//   mostVisited: "mosque-51.507400--0.127800",
//   lastUpdate: Date
// }
```

### `cleanupMosqueMonitoring(daysOld)`
Manually trigger cleanup of old mosque visits.

```typescript
await cleanupMosqueMonitoring(7); // Remove visits older than 7 days
```

### `clearMosqueMonitoring()`
Clear all mosque monitoring data.

```typescript
await clearMosqueMonitoring();
```

---

## Configuration

Edit `services/nearby-mosque-manager.ts` to customize:

```typescript
const NEARBY_MOSQUE_LIMIT = 15;          // Max mosques to monitor
const DAYS_UNTIL_REMOVAL = 7;            // Days before removal
const DISTANCE_THRESHOLD = 10000;        // Max distance (meters)
```

---

## Testing

### Test Nearby Mosque Monitoring

1. **Enable Feature**:
   - Go to Locations tab
   - Toggle "Auto Mosque Monitoring" ON
   - Should see "Monitoring X nearby mosques"

2. **Check Geofencing**:
   - Walk/drive near a monitored mosque
   - Should receive adhkar notification on entry/exit

3. **Test Updates**:
   - Move 2-3km away
   - Re-open app or wait 6 hours
   - Monitoring should update automatically

4. **Verify Cleanup**:
   - Wait 7 days without visiting a mosque
   - That mosque should be removed from monitoring

### Check Statistics

Add this to see stats:
```typescript
import { getMosqueMonitoringStats } from '@/services/nearby-mosque-manager';

const stats = await getMosqueMonitoringStats();
console.log('Stats:', stats);
```

---

## Troubleshooting

### Mosques Not Monitoring
**Check:**
1. "Auto Mosque Monitoring" toggle enabled?
2. Location permissions granted?
3. Are you within 10km of mosques?
4. Check console: `[NearbyMosqueManager]`

### Too Many/Few Mosques
**Adjust:**
- Edit `NEARBY_MOSQUE_LIMIT` in `nearby-mosque-manager.ts`
- Default: 15 mosques
- iOS limit: Max 20 total regions

### Update Not Triggering
**Check:**
1. Have you moved >2km?
2. Has 6+ hours passed?
3. Is auto-monitoring enabled?

### Cleanup Not Working
**Check:**
1. Are 7+ days passed since last visit?
2. Check storage: AsyncStorage keys `@nearby_mosques` and `@mosque_visits`

---

## Data Privacy

All data is stored **locally** on device:
- No server communication
- No data sharing
- User controlled cleanup

Storage Keys:
- `@nearby_mosques`: Currently monitored mosques
- `@mosque_visits`: Visit history

---

## Future Enhancements

### Phase 1: User Controls
- [ ] Adjustable monitoring radius
- [ ] Custom cleanup period
- [ ] Manual mosque selection

### Phase 2: Smart Features
- [ ] Learn user patterns (home/work mosques always monitored)
- [ ] Prayer time integration (monitor more during prayer times)
- [ ] Route prediction (monitor mosques on regular routes)

### Phase 3: Analytics
- [ ] Visit statistics dashboard
- [ ] Most visited mosques list
- [ ] Visit history calendar
- [ ] Geofence performance metrics

---

## Performance

### Battery Impact
- **Low**: Only monitors 15 mosques
- **Optimization**: Updates only when needed
- **Platform**: Uses native geofencing (very efficient)

### Memory Usage
- **Storage**: ~50KB per 15 mosques
- **Runtime**: Minimal overhead
- **AsyncStorage**: Efficient key-value storage

### Network Usage
- **None**: All data local
- **Offline**: Works without internet

---

## Compatibility

### iOS
- ✅ Works on iOS 13+
- ✅ Respects 20-region limit
- ✅ Uses Core Location efficiently

### Android
- ✅ Works on Android 8+
- ✅ No hard region limit
- ✅ Uses FusedLocationProvider

### Expo Go
- ⚠️ Limited (foreground only)
- ✅ Full features in development build

---

## Summary

**What It Does:**
- ✅ Auto-monitors 15 nearest mosques
- ✅ Updates as you move
- ✅ Removes old mosques (7 days)
- ✅ Battery efficient
- ✅ Respects device limits

**What You Get:**
- 🕌 Automatic mosque reminders
- 🔔 No manual setup needed
- ⚡ Optimized performance
- 🧹 Self-cleaning system

**Perfect For:**
- Users who travel frequently
- Users in mosque-dense areas
- Users who want automatic monitoring
- Users who don't want to manually add mosques

**Status**: ✅ Production Ready

