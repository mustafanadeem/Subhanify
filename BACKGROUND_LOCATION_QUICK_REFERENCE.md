# Background Location Monitoring - Quick Reference

## What It Does

📍 Sends you adhkar notifications when you:
- Enter/exit saved locations (mosque, home, work, etc.)
- Start traveling

⚠️ **Only works if enabled AND permissions granted**

---

## How to Enable

### Step 1: Grant Permissions

When you tap "Location Monitoring" toggle, grant:

1. **Foreground Location** - "While Using App" ✓
2. **Background Location** - **"Always Allow"** ⭐ IMPORTANT
3. **Notifications** - "Allow" ✓

### Step 2: Add Locations

1. Locations tab > + button
2. Name your location
3. Pin on map
4. Set radius (100-500m recommended)
5. Select adhkar for entry & exit
6. Save

### Step 3: Enable Monitoring

Toggle "Location Monitoring" ON

That's it! You'll receive notifications even when app is closed.

---

## What You'll See

### When Entering Location
```
📍 Entering Home

"الحمد لله على كل حال"
```

### When Leaving Location
```
📍 Leaving Mosque

"اللهم اجعل خروجي هذا"
```

### Foreground Service (Always Visible)
```
🔔 Subhanify is using location
```
(Can't be dismissed while monitoring is active)

---

## Troubleshooting

### ❌ Not Getting Notifications?

**Check 1: Permission**
- Settings > Apps > Subhanify > Permissions > Location
- Select **"All the time"** or **"Always Allow"**

**Check 2: Monitoring**
- Locations tab
- Is "Location Monitoring" toggle ON?

**Check 3: Location Setup**
- Did you add locations with entry/exit adhkar?
- Is location enabled (toggle next to location name)?

**Check 4: GPS**
- Is GPS enabled on device?
- Are you actually 300m+ away to trigger exit?

**Check 5: Battery**
- Settings > Battery > Battery Optimization
- Find Subhanify > "Don't Optimize"

### ❌ Battery Draining Too Fast?

- Geofencing uses minimal battery
- If draining fast, check battery optimization (see above)
- Disable "Location Monitoring" when not needed

### ❌ Foreground Service Notification Won't Go Away?

This is normal and required by Android when location monitoring is active.

- To remove it: Toggle "Location Monitoring" OFF
- To hide it: Android doesn't allow this (by design)

---

## Important Settings

### Permission Settings
Path: **Settings > Apps > Subhanify > Permissions > Location**

**Required for background notifications:**
- Android: Select **"All the time"**
- iPhone: Select **"Always Allow"**

### Battery Optimization
Path: **Settings > Battery > Battery Optimization**

**To ensure geofencing works reliably:**
- Find "Subhanify"
- Select **"Don't Optimize"**

### Notification Settings
Path: **Settings > Apps > Subhanify > Notifications**

**Ensure enabled:**
- [ ] Allow notifications
- [ ] Allow sound
- [ ] Allow vibration

---

## FAQ

**Q: Does this work when app is closed?**
A: Yes! That's the whole point. Even if you swipe it away, geofencing still works.

**Q: Does this work with screen locked?**
A: Yes! Notifications appear even with screen locked.

**Q: How accurate is location?**
A: Within 10-50m typically. Larger radius = more reliable.

**Q: Will this drain my battery?**
A: No. Geofencing uses 2-5% extra battery per hour (very low). This is much better than continuous tracking.

**Q: What if I want to temporarily stop?**
A: Toggle "Location Monitoring" OFF anytime.

**Q: Can I monitor multiple locations?**
A: Yes! Add as many as you want. Recommended max: 10 locations.

**Q: What if I delete a location?**
A: Monitoring stops for that location immediately.

**Q: Can I edit a location?**
A: Yes! Just tap edit, change details, and save.

---

## Settings Locations

### Android

**Location Permission:**
Settings > Apps > Subhanify > Permissions > Location
- Select: "All the time"

**Battery Optimization:**
Settings > Apps > Subhanify > Battery
- Select: "Unrestricted"

**Notifications:**
Settings > Apps > Subhanify > Notifications
- Toggle: All switches ON

### iPhone

**Location Permission:**
Settings > Subhanify > Location
- Select: "Always"

**Background App Refresh:**
Settings > Subhanify > Background App Refresh
- Toggle: ON

**Notifications:**
Settings > Notifications > Subhanify
- Toggle: Allow Notifications ON

---

## When It Works

✅ App closed
✅ Screen locked
✅ App in background
✅ Multiple locations
✅ At any time of day
✅ Without internet

---

## When It Might Not Work

❌ Background permission not "Always Allow"
❌ GPS disabled
❌ Notifications disabled
❌ Battery optimization blocking app
❌ Location disabled globally
❌ App force-closed (don't swipe away)

---

## Need Help?

1. Check troubleshooting above
2. Verify all permissions are correct
3. Try disabling and re-enabling monitoring
4. Restart phone
5. Clear app cache (Settings > Apps > Subhanify > Storage > Clear Cache)

---

## Summary

**Background location monitoring lets you get adhkar reminders automatically based on where you are - even when the app isn't running.**

Just enable it, grant permissions, add your locations, and you're done!
