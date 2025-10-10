# Location-Based Adhkar Feature Guide

## Overview

The Subhanify app now includes location-based adhkar reminders that notify you with appropriate adhkar when you enter or leave specific locations like mosques, home, markets, etc.

## Features Implemented

### 1. **Location Management Screen**

- View all saved locations on an interactive map
- See geofence radius for each location
- Enable/disable individual locations
- Toggle global location monitoring
- Access via the "Locations" tab in the bottom navigation

### 2. **Add/Edit Location Screen**

- Set location name (e.g., "Central Mosque", "My Home")
- Choose category: Mosque, Home, Work, Market, Travel, Other
- Pin exact location on the map by tapping
- Adjust geofence radius (50m - 500m)
- Select specific adhkar for entry and exit events

### 3. **New Adhkar Categories**

Added authentic adhkar for:

- **Mosque Entry/Exit** - Du'as for entering and leaving the mosque
- **Home Entry/Exit** - Du'as when coming home or leaving
- **Market Entry** - Du'a for entering shopping areas
- **Travel Start** - Du'a when beginning a journey

### 4. **Background Geofencing**

- Automatically monitors your saved locations
- Works when app is in background
- Low battery impact using native geofencing APIs
- Triggers notifications when entering/leaving zones

### 5. **Smart Notifications**

- Shows adhkar in notifications
- Includes Arabic text and English title
- Sound and vibration alerts
- Tap to open full adhkar details

## How to Use

### Step 1: Grant Permissions

1. Open the app
2. Go to "Locations" tab
3. Grant Location permissions (Always Allow for background monitoring)
4. Grant Notification permissions

### Step 2: Add Your First Location

1. Tap the **+** button in the Locations screen
2. Enter a name (e.g., "Masjid Al-Noor")
3. Select a category (e.g., Mosque)
4. Tap on the map to set the exact location
5. Adjust the radius slider (recommended: 100-200m)
6. Select adhkar for entry (e.g., "Du'a When Entering the Mosque")
7. Select adhkar for exit (e.g., "Du'a When Leaving the Mosque")
8. Tap "Save"

### Step 3: Enable Location Monitoring

1. In the Locations screen, toggle "Location Monitoring" ON
2. The app will now monitor all enabled locations
3. You'll see "Monitoring X locations" status

### Step 4: Test It Out

- Walk to your saved location
- When you cross the geofence boundary, you'll receive a notification
- The notification will display the adhkar text
- Tap to view full details or dismiss

## Permissions Required

### iOS

- **Location When In Use**: For map and current location
- **Location Always**: For background geofencing
- **Notifications**: For adhkar reminders

### Android

- **ACCESS_FINE_LOCATION**: For precise location
- **ACCESS_BACKGROUND_LOCATION**: For background monitoring
- **POST_NOTIFICATIONS**: For sending reminders

## Technical Details

### Database

- Uses SQLite for local storage
- All locations saved on device
- No cloud sync required

### Geofencing

- Native iOS/Android geofencing APIs
- Efficient battery usage
- Works even when app is closed
- Region monitoring up to 20 locations simultaneously

### Privacy

- All data stored locally
- No location tracking or data collection
- Locations never leave your device
- Complete user control over monitoring

## Tips for Best Results

1. **Set Appropriate Radius**

   - Mosques: 100-200m
   - Home: 50-100m
   - Large areas (markets): 200-300m

2. **Place Pin Accurately**

   - Zoom in on the map
   - Place pin at the entrance/center
   - Test by walking around the area

3. **Battery Optimization**

   - Don't add too many locations (max 10-15)
   - Disable locations you don't frequently visit
   - Use reasonable radius sizes

4. **Notification Management**
   - Enable "Do Not Disturb" override for important adhkar
   - Customize notification sounds in system settings
   - Review and update locations regularly

## Troubleshooting

### Notifications Not Working

- Check notification permissions in Settings
- Ensure Location Monitoring is enabled
- Verify the location is enabled (toggle switch)
- Check device is not in Do Not Disturb mode

### Location Not Detected

- Ensure background location permission is granted
- Check GPS is enabled on device
- Verify geofence radius is appropriate
- Location services must be enabled

### App Not Monitoring in Background

- iOS: Grant "Always Allow" location permission
- Android: Disable battery optimization for the app
- Ensure app is not force-closed

## Future Enhancements (Not Yet Implemented)

- Custom adhkar for any location
- Location history and statistics
- Share locations with friends/family
- Automatic mosque detection using Places API
- Time-based geofencing (e.g., only during prayer times)

## Support

For issues or questions, please check app settings and permissions first.


