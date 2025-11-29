# 🚀 Location Search Migration - Quick Reference

## Quick Copy-Paste Guide for Branch Migration

### Step 1: Copy Files
```bash
# From vibrations branch, copy these files:
components/PlaceAutocomplete.tsx
constants/api-keys.ts
```

### Step 2: Update location-detail.tsx

#### Add Import (Top of File)
```typescript
import { PlaceAutocomplete, PlaceSelection } from "@/components/PlaceAutocomplete";
```

#### Add State Variable (With Other useState)
```typescript
const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
```

#### Add Handler Function (With Other Handlers)
```typescript
const handlePlaceSelect = (place: PlaceSelection) => {
  console.log('[LocationDetail] Place selected:', place.label);
  setName(place.label);
  setLatitude(place.latitude);
  setLongitude(place.longitude);
  setHasSelectedLocation(true);
};
```

#### Replace Search Section (In JSX)
```tsx
{/* Search Bar with Autocomplete */}
<View style={styles.section}>
  <Text
    style={[
      styles.sectionTitle,
      { color: Colors[colorScheme ?? "light"].text },
    ]}
  >
    Search Location
  </Text>
  
  <PlaceAutocomplete
    onSelect={handlePlaceSelect}
    theme={colorScheme ?? "light"}
    placeholder="Search for a place..."
    initialValue={name}
  />

  <TouchableOpacity
    style={[
      styles.locateButton,
      {
        backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
        borderColor: Colors[colorScheme ?? "light"].tint,
      },
    ]}
    onPress={() => setShowMapModal(true)}
  >
    <Ionicons
      name="map"
      size={20}
      color={Colors[colorScheme ?? "light"].tint}
    />
    <Text
      style={[
        styles.locateButtonText,
        { color: Colors[colorScheme ?? "light"].tint },
      ]}
    >
      {hasSelectedLocation ? "Adjust on Map" : "Locate on Map"}
    </Text>
  </TouchableOpacity>
</View>
```

#### Wrap Map Preview (Make it Conditional)
```tsx
{/* Map Preview with Radius Slider (shown after location selected) */}
{hasSelectedLocation && (
  <View style={styles.section}>
    <Text
      style={[
        styles.sectionTitle,
        { color: Colors[colorScheme ?? "light"].text },
      ]}
    >
      Location Preview
    </Text>
    
    {/* Mini Map Preview */}
    <View style={styles.mapPreviewContainer}>
      <MapView
        style={styles.mapPreview}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} />
        <Circle
          center={{ latitude, longitude }}
          radius={radius}
          strokeColor={categoryColors[category]}
          fillColor={`${categoryColors[category]}30`}
          strokeWidth={2}
        />
      </MapView>
      
      {/* Map overlay button */}
      <TouchableOpacity
        style={styles.mapPreviewOverlay}
        onPress={() => setShowMapModal(true)}
      >
        <View style={styles.mapPreviewOverlayContent}>
          <Ionicons name="expand" size={20} color="#FFFFFF" />
          <Text style={styles.mapPreviewOverlayText}>
            Tap to adjust location
          </Text>
        </View>
      </TouchableOpacity>
    </View>

    {/* Radius Slider */}
    <View style={styles.radiusSliderContainer}>
      <View style={styles.radiusHeader}>
        <Text
          style={[
            styles.radiusLabel,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Geofence Radius
        </Text>
        <View
          style={[
            styles.radiusBadge,
            { backgroundColor: categoryColors[category] },
          ]}
        >
          <Text style={styles.radiusBadgeText}>{radius}m</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={50}
        maximumValue={500}
        step={10}
        value={radius}
        onValueChange={setRadius}
        minimumTrackTintColor={categoryColors[category]}
        maximumTrackTintColor={Colors[colorScheme ?? "light"].textSecondary}
        thumbTintColor={categoryColors[category]}
      />
      <View style={styles.radiusLabels}>
        <Text
          style={[
            styles.radiusMinMax,
            { color: Colors[colorScheme ?? "light"].textSecondary },
          ]}
        >
          50m
        </Text>
        <Text
          style={[
            styles.radiusMinMax,
            { color: Colors[colorScheme ?? "light"].textSecondary },
          ]}
        >
          500m
        </Text>
      </View>
    </View>
  </View>
)}
```

#### Add Styles (In StyleSheet.create)
```typescript
locateButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
  borderRadius: 12,
  marginTop: 12,
  gap: 8,
  borderWidth: 1.5,
},
locateButtonText: {
  fontSize: 16,
  fontWeight: "600",
},
mapPreviewContainer: {
  height: 200,
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 16,
  position: "relative",
},
mapPreview: {
  flex: 1,
},
mapPreviewOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.3)",
},
mapPreviewOverlayContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 25,
},
mapPreviewOverlayText: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "600",
},
radiusSliderContainer: {
  marginTop: 8,
},
radiusHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},
radiusLabel: {
  fontSize: 16,
  fontWeight: "600",
},
radiusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
},
radiusBadgeText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "700",
},
radiusLabels: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 4,
},
radiusMinMax: {
  fontSize: 12,
  fontWeight: "500",
},
```

---

## Testing Checklist

After migration, test these scenarios:

### Basic Functionality
- [ ] Type 3+ characters → suggestions appear
- [ ] Loading spinner shows while fetching
- [ ] Tap suggestion → fills search field
- [ ] Coordinates update correctly
- [ ] Map preview appears after selection
- [ ] Clear button works

### Map Interaction
- [ ] "Locate on Map" button opens modal
- [ ] Map centers on selected location
- [ ] Dragging map updates coordinates
- [ ] Pin bounces when drag stops
- [ ] Radius slider works in modal
- [ ] "Done" button closes modal

### Theme Support
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Colors adapt correctly
- [ ] Text readable in both themes

### Edge Cases
- [ ] Works with no internet (shows error)
- [ ] Works with slow connection
- [ ] Handles API errors gracefully
- [ ] Keyboard dismisses on selection
- [ ] Suggestions hide when clicking outside

### Integration
- [ ] Save button works
- [ ] Location saves to database
- [ ] Geofencing restarts
- [ ] Location appears on map
- [ ] Edit mode loads correctly

---

## Key Differences from Google Places Version

| Feature | Nominatim (Current) | Google Places (Old) |
|---------|---------------------|---------------------|
| API Key | Not required | Required |
| Cost | Free | Paid |
| Setup | Zero config | API key setup needed |
| Rate Limit | 1 req/sec | Generous |
| Data Quality | Good | Excellent |
| Component | `PlaceAutocomplete.tsx` | N/A |

---

## Troubleshooting

### No suggestions appearing?
1. Check console for errors
2. Verify query is 3+ characters
3. Test API directly: `https://nominatim.openstreetmap.org/search?q=mosque&format=json`
4. Check internet connection

### Map not updating?
1. Verify `handlePlaceSelect` is called (check console logs)
2. Check `hasSelectedLocation` state is true
3. Verify latitude/longitude are numbers, not strings

### Styles broken?
1. Ensure all styles are added to StyleSheet
2. Check for typos in style names
3. Verify theme colors are imported

---

## Quick Diff Summary

**Files to Copy:**
- `components/PlaceAutocomplete.tsx` (NEW)
- `constants/api-keys.ts` (NEW)

**Files to Modify:**
- `app/location-detail.tsx` (UPDATE)

**Changes:**
- +1 import
- +1 state variable
- +1 handler function
- ~30 lines JSX replacement
- +15 styles

**Time Estimate:** 15-20 minutes

---

## Need Help?

See full documentation: [LOCATION_SEARCH_ENGINE_DOCUMENTATION.md](./LOCATION_SEARCH_ENGINE_DOCUMENTATION.md)

**Common Issues:**
- Suggestions not showing → Check console logs
- Map not updating → Verify handler is connected
- Styles broken → Check StyleSheet has all new styles
- TypeScript errors → Ensure PlaceSelection type is imported

---

**Last Updated**: November 29, 2025
**Status**: ✅ Ready for Migration

