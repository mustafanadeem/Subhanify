# Rain Alerts Backend Documentation

## Overview

The Rain Alerts backend service monitors weather conditions and sends push notifications to users when rain starts or is imminent near their location. The service uses platform-specific weather APIs and implements strict rate limiting to ensure users receive at most one alert per hour.

## Architecture

### Weather Data Sources

#### iOS - Apple WeatherKit
- **Endpoint**: WeatherKit REST API
- **Authentication**: JWT signed with Apple Developer credentials
- **Data**: Minute precipitation nowcast + current conditions
- **Refresh Rate**: Every 5-10 minutes per tile
- **Coverage**: Worldwide (where Apple Weather is available)

#### Android - OpenWeather One Call 3.0
- **Endpoint**: `https://api.openweatherweather.org/data/3.0/onecall`
- **Authentication**: API key in query params
- **Data**: Minute precipitation forecast (next 60 minutes)
- **Refresh Rate**: Every 5-10 minutes per tile
- **Coverage**: Worldwide

### Tile-Based Location System

**Geohash Precision 7** (~1.2 km × 600 m tiles)
- Provides coarse location for privacy
- Reduces API calls by batching users in same tile
- Example: `u4pruyd` (central London)

**Tile Grouping Strategy**:
1. Device sends `tileId` on registration/update
2. Backend groups all devices by `tileId`
3. Single weather check per tile serves all users in that tile
4. Tile cache TTL: 5-10 minutes

## API Endpoints

### POST /weather/register-device

Register a device for rain alerts.

**Request Body**:
```json
{
  "deviceTokenOrFcm": "expo-push-token or FCM token",
  "platform": "ios" | "android",
  "tileId": "u4pruyd",
  "leadMinutes": 0,
  "intensityThreshold": "any" | "light+" | "moderate+"
}
```

**Response**:
```json
{
  "deviceId": "uuid-v4",
  "success": true
}
```

**Logic**:
1. Validate device token format
2. Generate unique `deviceId`
3. Store device preferences in database
4. Add device to tile group
5. Return `deviceId` for future updates

### POST /weather/update-location

Update device's location tile.

**Request Body**:
```json
{
  "deviceId": "uuid-v4",
  "tileId": "u4pruye"
}
```

**Response**:
```json
{
  "success": true
}
```

**Logic**:
1. Validate `deviceId` exists
2. Remove device from old tile group
3. Add device to new tile group
4. Update device record with new `tileId`

### POST /weather/unregister-device

Remove device from rain alerts.

**Request Body**:
```json
{
  "deviceId": "uuid-v4"
}
```

**Response**:
```json
{
  "success": true
}
```

## Push Notification Payload

### Schema

```json
{
  "type": "RAIN_START",
  "leadMinutes": 0,
  "intensity": "light" | "moderate" | "heavy",
  "phrase": "Rain has started nearby",
  "dua": "اللَّهُمَّ صَيِّبًا نَافِعًا"
}
```

### Field Definitions

- **type**: Always `"RAIN_START"` for rain alerts
- **leadMinutes**: Minutes until rain starts (0 = already started)
- **intensity**: Categorized precipitation rate
  - `light`: 0.2-2.5 mm/hr
  - `moderate`: 2.5-10 mm/hr
  - `heavy`: >10 mm/hr
- **phrase**: Human-readable alert text
- **dua**: Arabic supplication for rain

## Weather Monitoring Logic

### Trigger Conditions

Alert is triggered when **any** of these conditions are met:

1. **Immediate Rain Start**
   - Previous check: precipitation = 0 mm/hr
   - Current check: precipitation > 0.2 mm/hr
   - leadMinutes = 0

2. **Nowcast Prediction**
   - Nowcast shows precipitation within next N minutes (user's leadMinutes setting)
   - Probability ≥ 60%
   - Intensity ≥ user's threshold (default 0.2 mm/hr)

### Rate Limiting

**Server-Side (Primary)**:
- Track `lastRainAlertAt` per `userId` + `tileId` combination
- Only send push if: `now - lastRainAlertAt >= 3600 seconds`
- Store timestamp in Redis/database with 1-hour TTL

**Client-Side (Backup)**:
- Devices also enforce local cooldown in UserDefaults/SharedPreferences
- Drop notifications if received within cooldown window
- Provides defense against server bugs or race conditions

### Tile Caching Strategy

```
For each tile:
  1. Fetch nowcast data every 5-10 minutes
  2. Store in cache with TTL
  3. Compare with previous state
  4. If transition detected (0 → rain):
     - Query all devices in this tile
     - For each device:
       - Check rate limit
       - Check intensity threshold
       - Check lead time preference
       - Send push if all conditions met
```

## WeatherKit Integration (iOS)

### Authentication

1. **JWT Token Generation**
   ```
   Header:
     kid: <Apple Key ID>
     alg: ES256
   
   Payload:
     iss: <Team ID>
     iat: <Current timestamp>
     exp: <iat + 3600>
     sub: <Bundle ID>
   
   Signature: Sign with Apple Private Key (.p8 file)
   ```

2. **API Request**
   ```http
   GET https://weatherkit.apple.com/api/v1/weather/en_US/{lat}/{lon}?dataSets=forecastNextHour,currentWeather
   Authorization: Bearer <JWT_TOKEN>
   ```

### Data Extraction

```javascript
{
  currentWeather: {
    precipitationIntensity: 0.5  // mm/hr
  },
  forecastNextHour: {
    minutes: [
      { precipitationChance: 0.75, precipitationIntensity: 1.2, startTime: "..." },
      // ... next 60 minutes
    ]
  }
}
```

### Rate Limits
- 500,000 calls/month (free tier)
- Group by tiles to stay within limits
- Cache aggressively (5-10 min TTL)

## OpenWeather Integration (Android)

### API Request

```http
GET https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=daily,hourly&appid={API_KEY}
```

### Data Extraction

```javascript
{
  current: {
    weather: [...],
    rain: { "1h": 0.8 }  // mm in last hour
  },
  minutely: [
    { dt: 1234567890, precipitation: 0.5 },  // mm
    // ... next 60 minutes
  ]
}
```

### Rate Limits
- 1,000 calls/day (free tier)
- 60 calls/minute
- Use tile batching to maximize efficiency

## Database Schema

### Devices Table

```sql
CREATE TABLE devices (
  device_id UUID PRIMARY KEY,
  platform VARCHAR(10) NOT NULL,
  push_token TEXT NOT NULL,
  tile_id VARCHAR(10) NOT NULL,
  lead_minutes INT DEFAULT 0,
  intensity_threshold VARCHAR(10) DEFAULT 'any',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_tile_id (tile_id)
);
```

### Rate Limit Table

```sql
CREATE TABLE rain_alert_cooldowns (
  device_id UUID NOT NULL,
  tile_id VARCHAR(10) NOT NULL,
  last_alert_at TIMESTAMP NOT NULL,
  PRIMARY KEY (device_id, tile_id),
  INDEX idx_expiry (last_alert_at)
);
```

Or use Redis:
```
Key: rain_cooldown:{deviceId}:{tileId}
Value: {timestamp}
TTL: 3600 seconds
```

## Environment Variables

```bash
# Apple WeatherKit
APPLE_TEAM_ID=ABC123
APPLE_KEY_ID=XYZ789
APPLE_BUNDLE_ID=com.subhanify.app
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_XYZ789.p8

# OpenWeather
OPENWEATHER_API_KEY=your_api_key_here

# Push Notifications
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
FCM_SERVER_KEY=your_fcm_server_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/raindb
REDIS_URL=redis://localhost:6379

# Server Config
TILE_CACHE_TTL_SECONDS=300
WEATHER_CHECK_INTERVAL_SECONDS=300
COOLDOWN_PERIOD_SECONDS=3600
```

## Deployment Considerations

### Scaling
- Weather checks run as cron jobs every 5 minutes
- Use worker queues (Bull, Celery) for push sending
- Cache tile weather data in Redis
- Use database connection pooling

### Monitoring
- Track API quota usage (WeatherKit, OpenWeather)
- Alert on high error rates
- Monitor push delivery success rates
- Log cooldown suppressions for debugging

### Cost Optimization
- Batch users by tiles to minimize API calls
- Use longer cache TTLs during low-activity hours
- Implement smart tile prioritization (active users first)
- Consider fallback to lower-resolution forecasts

## Testing

### Mock Weather Responses

**WeatherKit Mock**:
```json
{
  "currentWeather": {
    "precipitationIntensity": 0.0
  },
  "forecastNextHour": {
    "minutes": [
      { "precipitationChance": 0.8, "precipitationIntensity": 2.5, "startTime": "2025-10-13T14:05:00Z" }
    ]
  }
}
```

**OpenWeather Mock**:
```json
{
  "current": { "rain": null },
  "minutely": [
    { "dt": 1697200800, "precipitation": 0 },
    { "dt": 1697200860, "precipitation": 1.5 }
  ]
}
```

### Test Scenarios

1. **Rain Start Detection**: 0 mm/hr → 0.5 mm/hr
2. **Nowcast Alert**: 10-minute lead time with 80% probability
3. **Rate Limit Enforcement**: Back-to-back showers 30 minutes apart
4. **Intensity Threshold**: Light rain when user wants moderate+
5. **Tile Changes**: User moves from dry tile to rainy tile

## Security

### API Key Protection
- Never expose keys in client apps
- Use environment variables or secret management
- Rotate keys periodically

### Data Privacy
- Only store tile IDs (coarse location)
- No GPS coordinates in database
- GDPR-compliant: allow device deletion
- Clear privacy policy disclosure

### Rate Limiting
- Prevent abuse of registration endpoint
- Throttle location updates per device
- Use CAPTCHA for web-based registrations

## Troubleshooting

### No Alerts Received

1. Check device registration: `SELECT * FROM devices WHERE device_id = ?`
2. Verify tile has rain: Query weather API for tile coordinates
3. Check cooldown: `SELECT * FROM rain_alert_cooldowns WHERE device_id = ?`
4. Verify push token validity
5. Check server logs for errors

### Alerts Too Frequent

1. Confirm cooldown enforcement in code
2. Check for race conditions with multiple workers
3. Verify Redis/database TTL is working
4. Review tile grouping logic

### High API Costs

1. Audit tile cache hit rates
2. Increase cache TTL if acceptable
3. Reduce active tile count (prune inactive users)
4. Consider lower-resolution weather data

## Future Enhancements

- **Quiet Hours Inbox**: Store suppressed alerts for morning review
- **Audio Playback**: Stream dua recitation on notification tap
- **Intensity Escalation**: Optional override for severe weather
- **Multi-Language**: Localized dua translations
- **Weather History**: Track rain patterns per tile

