# Qibla Compass Implementation

## Overview
Implemented a fully functional Qibla compass with directional beam indicator on the Locations page. The compass uses the device's magnetometer to detect heading and calculates the precise direction to the Kaaba in Mecca, Saudi Arabia.

## Features

### 1. **Precise Qibla Calculation**
- Uses the exact coordinates of the Kaaba: **21.4225° N, 39.826174° E**
- Implements geodetic bearing calculation using the Haversine formula
- Accounts for Earth's curvature for accurate direction anywhere in the world

### 2. **Directional Beam**
- Visual beam that points towards the Qibla direction
- **Orange color** when not aligned (#FF9800)
- **Green color** when aligned within ±5° (#4CAF50)
- Smooth spring animations for natural movement
- Opacity animation for visual feedback

### 3. **Compass Rose**
- Full 360° compass with cardinal directions (N, E, S, W)
- North highlighted in red for easy identification
- 36 degree marks (every 10°) for precise readings
- Rotates inversely to device heading for natural orientation

### 4. **Kaaba Icon**
- Centered 🕋 emoji in circular container
- Background changes to green when aligned with Qibla
- Elevated design with shadows for depth
- Always faces up for easy identification

### 5. **Real-time Alignment Detection**
- Checks if device is aligned within ±5° tolerance
- Visual feedback: "Aligned with Qibla ☪️" message
- Text size and color changes when aligned
- Smooth transitions between aligned/unaligned states

### 6. **Status Display**
- Current heading in degrees
- Qibla direction in degrees
- Alignment status with Islamic moon symbol
- Instructional text for user guidance

## Technical Implementation

### Component: `components/qibla-compass.tsx`

#### Key Functions

**1. `calculateQiblaDirection()`**
```typescript
function calculateQiblaDirection(
  userLat: number,
  userLon: number,
  kaabaLat: number,
  kaabaLon: number
): number
```
- Uses spherical trigonometry to calculate bearing
- Formula: `θ = atan2(sin(Δλ) × cos(φ2), cos(φ1) × sin(φ2) - sin(φ1) × cos(φ2) × cos(Δλ))`
- Returns bearing in degrees (0-360)

**2. `normalizeAngleDiff()`**
```typescript
function normalizeAngleDiff(angle: number): number
```
- Normalizes angle difference to -180° to 180° range
- Used for determining shortest rotation path

#### Sensors Used

**Magnetometer (expo-sensors)**
- Update interval: 100ms (10 Hz)
- Detects Earth's magnetic field
- Calculates device heading (compass direction)
- Platform-specific handling:
  - iOS: Inverts angle (360° - angle)
  - Android: Uses angle directly

#### Animations

**1. Compass Rotation**
```typescript
Animated.spring(compassRotation, {
  toValue: relativeQiblaAngle,
  tension: 10,
  friction: 8,
  useNativeDriver: true,
})
```
- Spring animation for smooth, natural rotation
- Low tension and friction for gradual movement

**2. Beam Rotation**
```typescript
Animated.spring(beamRotation, {
  toValue: qiblaDirection - heading,
  tension: 10,
  friction: 8,
  useNativeDriver: true,
})
```
- Independent rotation to always point at Qibla
- Relative to compass rotation

**3. Alignment Feedback**
```typescript
Animated.timing(beamOpacity, {
  toValue: aligned ? 1 : 0.6,
  duration: 300,
  useNativeDriver: true,
})
```
- Opacity change when aligned
- Smooth 300ms transition

### Integration: `app/(tabs)/locations.tsx`

#### View Mode System
```typescript
type ViewMode = "locations" | "qibla";
const [viewMode, setViewMode] = useState<ViewMode>("locations");
```
- Two-tab interface: Locations and Qibla
- Tab-based navigation with icons
- Conditional rendering based on active tab

#### Tabs UI
- **Locations Tab**: Location icon, shows saved locations and map
- **Qibla Tab**: Compass icon, shows Qibla compass
- Active tab highlighted with background color
- Smooth transitions between views

## Visual Design

### Color Scheme

**Beam Colors:**
- Not aligned: Orange `#FF9800` (warm, attention-grabbing)
- Aligned: Green `#4CAF50` (success, confirmation)

**Compass:**
- Light mode background: `#FFFFFF`
- Dark mode background: `#2C2C2E`
- Border: Themed gray
- Cardinal North: Red `#E53935`
- Other cardinals: Theme text color

**Kaaba Icon:**
- Not aligned background: Theme-based gray
- Aligned background: Green `#4CAF50`
- Border: Lighter shade for depth
- Size: 80x80 with 40px border radius (circular)

### Dimensions
- Compass size: 85% of screen width (max 350px)
- Beam height: Half compass radius - 60px
- Beam width: 4px
- Degree marks: Major (cardinal) = 15px, Minor = 8px

### Layout Structure
```
┌─────────────────────────────────────┐
│        Status Text                  │
│     "Aligned with Qibla ☪️"        │
│   Qibla: 234° • Heading: 232°      │
├─────────────────────────────────────┤
│                                     │
│         ╱ Beam (Green/Orange)       │
│        │                            │
│    ┌───┴────────┐                  │
│    │     N      │                  │
│    │            │                  │
│    │   🕋       │  Compass Rose    │
│    │            │                  │
│    │     S      │                  │
│    └────────────┘                  │
│                                     │
├─────────────────────────────────────┤
│   Point device towards Kaaba        │
└─────────────────────────────────────┘
```

## Mathematical Background

### Geodetic Bearing Calculation
The bearing from point A to point B on Earth's surface:

**Given:**
- φ₁, λ₁ = latitude and longitude of point A (user location)
- φ₂, λ₂ = latitude and longitude of point B (Kaaba)

**Formula:**
```
Δλ = λ₂ - λ₁
y = sin(Δλ) × cos(φ₂)
x = cos(φ₁) × sin(φ₂) - sin(φ₁) × cos(φ₂) × cos(Δλ)
θ = atan2(y, x)
bearing = (θ × 180/π + 360) mod 360
```

This accounts for:
- Earth's spherical geometry
- Great circle distance
- True north orientation

### Alignment Tolerance
- **±5° tolerance** chosen for practical alignment
- Allows for device sensor imprecision
- Provides clear feedback without being too strict
- Corresponds to ~550m at 10km distance

## User Experience

### States

**1. Loading State**
- Shows "Getting your location..." message
- Displayed when location permission pending
- Clean, minimal UI

**2. Active State**
- Full compass display
- Real-time heading updates
- Smooth animations
- Continuous feedback

**3. Aligned State**
- Green beam color
- Bold "Aligned with Qibla ☪️" text
- Green Kaaba icon background
- Larger status text
- Full opacity beam

**4. Not Aligned State**
- Orange beam color
- "Turn until aligned" instruction
- Regular Kaaba icon background
- Standard opacity beam

### Accessibility Features
- Large, clear status text
- Color-coded visual feedback
- Multiple indicators (text, color, icon)
- Degree readings for precision
- Islamic symbols for cultural relevance

## Dependencies

### Required Packages
```json
{
  "expo-sensors": "~16.0.8",
  "expo-location": "~19.0.7",
  "react-native": "0.81.4"
}
```

### Permissions Required

**Android (app.json):**
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "SENSORS"
    ]
  }
}
```

**iOS (app.json):**
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "We need your location to calculate Qibla direction",
      "NSMotionUsageDescription": "We need access to compass to show Qibla direction"
    }
  }
}
```

## Platform Differences

### iOS
- Magnetometer reports angles in opposite direction
- Requires motion permission
- Compass generally more accurate
- Smooth sensor updates

### Android
- Magnetometer reports standard angles
- May require sensor calibration
- Can be affected by magnetic interference
- Update rate may vary by device

## Testing

### Testing Locations

**1. London, UK**
- Expected Qibla: ~118° (SE)
- Good for testing European locations

**2. New York, USA**
- Expected Qibla: ~58° (NE)
- Good for testing North American locations

**3. Sydney, Australia**
- Expected Qibla: ~277° (W)
- Good for testing Southern Hemisphere

**4. Tokyo, Japan**
- Expected Qibla: ~293° (WNW)
- Good for testing East Asian locations

### Calibration
Users may need to calibrate device compass:
- **iOS**: Move device in figure-8 motion
- **Android**: Move device in circular motion
- **Both**: Away from metal objects and magnets

## Future Enhancements

### Potential Features
1. **GPS Qibla Bearing**: Use GPS heading when available for better accuracy
2. **3D Tilt Adjustment**: Account for device tilt angle
3. **Prayer Time Integration**: Show next prayer time on compass
4. **Distance to Mecca**: Display distance in km/miles
5. **Vibration Feedback**: Haptic feedback when aligned
6. **Calibration Guide**: Built-in compass calibration instructions
7. **Night Mode**: Special color scheme for night prayers
8. **Multiple Mosques**: Show distance to multiple important mosques
9. **AR View**: Augmented reality overlay showing Qibla direction
10. **Lock Orientation**: Lock compass when aligned

### Performance Optimizations
- Debounce magnetometer updates
- Reduce animation complexity on low-end devices
- Cache calculations
- Implement sensor fusion (magnetometer + accelerometer + gyroscope)

## Known Limitations

1. **Magnetic Interference**: Compass affected by nearby metal/magnets
2. **Sensor Accuracy**: Device sensor quality varies
3. **Calibration**: Requires periodic recalibration
4. **Indoor Performance**: May be less accurate indoors
5. **Platform Differences**: iOS and Android handle sensors differently

## Support

### Troubleshooting

**Problem: Compass not moving**
- Check location permissions
- Check sensor permissions
- Calibrate device compass
- Restart app

**Problem: Inaccurate direction**
- Calibrate compass (figure-8 motion)
- Move away from metal objects
- Ensure location services enabled
- Check for software updates

**Problem: Beam not turning green**
- Alignment tolerance is ±5°
- Try calibrating compass
- Ensure stable device position
- Check magnetic interference

## Credits

- **Kaaba Coordinates**: Official coordinates from Saudi authorities
- **Bearing Formula**: Standard geodetic calculation
- **Icons**: Expo vector-icons
- **Emoji**: System emoji (🕋, ☪️)

## License

This implementation is part of the Subhanify app and follows the project's license terms.

