# Notification Testing Feature

## Overview
Added a complete notification testing system that allows users to:
1. Test location-based adhkar notifications (entry and exit events)
2. Tap notifications to view the full adhkar in the dua-detail screen
3. Test the entire notification flow without needing to actually travel

## Files Modified/Created

### 1. **services/notification-handler.ts** (NEW)
- `setupNotificationResponseListener()` - Sets up listener for when user taps notifications
- `handleNotificationResponse()` - Routes tapped notifications to the dua-detail screen
- `sendTestAdhkarNotification()` - Sends test notifications with adhkar data

**Key Features:**
- Automatically finds the adhkar index in the data
- Passes category, title, and initial index to dua-detail
- Includes metadata (locationName, eventType) for context

### 2. **app/_layout.tsx** (MODIFIED)
- Added import: `useRouter` from expo-router
- Added import: `setupNotificationResponseListener` from notification-handler
- Calls `setupNotificationResponseListener(router)` in useEffect
- Returns unsubscribe function to clean up listener on unmount

### 3. **app/privacy-settings.tsx** (MODIFIED)
- Added import: `sendTestAdhkarNotification`
- Added import: adhkar data
- Added `handleTestAdhkarNotification()` function
- Added "TEST NOTIFICATIONS" section with:
  - Description of feature
  - "Test Entry Notification" button
  - "Test Exit Notification" button

**Styles Added:**
- `testDescription` - Text for test section explanation
- `testAdhkarButton` - Styling for test buttons

## How It Works

### Notification Flow:
1. User goes to **Privacy & Permissions** settings
2. Scrolls to **TEST NOTIFICATIONS** section
3. Taps either "Test Entry Notification" or "Test Exit Notification"
4. Notification appears with:
   - Title: "Entering/Leaving [Location]"
   - Body: Random adhkar text
5. User taps the notification
6. App navigates to dua-detail screen showing that adhkar
7. User can read full adhkar with Arabic, transliteration, and translation

### Data Flow:
```
Test Button Pressed
        ↓
handleTestAdhkarNotification()
        ↓
sendTestAdhkarNotification()
        ↓
Notification appears
        ↓
User taps notification
        ↓
addNotificationResponseReceivedListener triggered
        ↓
handleNotificationResponse()
        ↓
Find adhkar index in data
        ↓
Navigate to dua-detail with category, title, index
        ↓
Dua-detail displays adhkar
```

## Usage

### For Users:
1. Open the app's Privacy & Permissions settings
2. Scroll down to the "TEST NOTIFICATIONS" section
3. Tap "Test Entry Notification" or "Test Exit Notification"
4. Check your notifications
5. Tap the notification to view the full adhkar
6. Navigate between adhkars using swipe gestures on dua-detail screen

### For Developers:
The notification system is integrated with the actual geofencing system:
- When user actually enters/exits a geofence, the same `showAdhkarNotification()` is called
- When they tap the notification, the same handler processes it
- Navigation logic is identical

## Testing Checklist

- [ ] Navigate to Privacy & Permissions settings
- [ ] See "TEST NOTIFICATIONS" section with two buttons
- [ ] Tap "Test Entry Notification"
- [ ] Verify notification appears in notification center
- [ ] Tap notification in notification center
- [ ] Verify app navigates to dua-detail with the adhkar
- [ ] Swipe left/right to navigate between adhkars in that category
- [ ] Tap "Test Exit Notification"
- [ ] Verify different adhkar is shown
- [ ] Test on both Android and iOS

## Integration with Real Geofencing

The test notification system uses the exact same:
1. Notification format as geofencing notifications
2. Data structure (adhkar object, locationName, eventType)
3. Navigation handler for tapping notifications
4. Dua-detail screen for displaying results

So testing with the test buttons validates the entire real geofencing notification flow!

## Troubleshooting

**Notification doesn't appear:**
- Check notification permissions in Privacy & Permissions → Manage in System Settings
- Make sure POST_NOTIFICATIONS permission is granted on Android 13+
- Try sending from notification settings or tap "Grant Notifications"

**Tapping notification doesn't navigate:**
- Make sure notification handler is properly initialized (happens at app startup)
- Check console logs for [NotificationHandler] messages
- Try restarting the app

**Wrong adhkar displayed:**
- The system finds adhkar by matching the text in notification body
- If adhkar text doesn't match exactly, it might show index 0
- Try restarting the app

## Notes

- Test notifications are sent with a 1-second delay for better UX
- Random adhkar is selected from the full dataset
- Location name changes based on entry/exit (Mosque/Home for demo)
- All notification metadata is preserved for full context
