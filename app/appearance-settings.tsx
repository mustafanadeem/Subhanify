import { Colors } from "@/constants/theme";
import { ArabicFont as FontType, useFont } from "@/contexts/FontContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useRef, useState, useEffect } from "react";
import {
    Animated,
    Alert,
    Modal,
    PanResponder,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { checkLocationPermissions, checkNotificationPermissions, openAppSettings } from "@/services/permissions-manager";

type ArabicFontDisplay = "KFGQPC Hafs" | "PDMS Saleem Quran";
type ThemeMode = "light" | "dark" | "auto";

function DraggableThemeSelector({
  value,
  onChange,
  isDark,
}: {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  isDark: boolean;
}) {
  const themes: ThemeMode[] = ["light", "dark", "auto"];
  const selectedIndex = themes.indexOf(value);
  const containerWidth = 300; // approximate width
  const itemWidth = containerWidth / 3;
  
  const slideAnim = useRef(new Animated.Value(selectedIndex * itemWidth)).current;
  const [containerWidthState, setContainerWidthState] = useState(containerWidth);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        slideAnim.setOffset(selectedIndex * (containerWidthState / 3));
        slideAnim.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        slideAnim.flattenOffset();
        
        const currentPosition = selectedIndex * (containerWidthState / 3) + gestureState.dx;
        const newIndex = Math.round(currentPosition / (containerWidthState / 3));
        const clampedIndex = Math.max(0, Math.min(2, newIndex));
        
        Animated.spring(slideAnim, {
          toValue: clampedIndex * (containerWidthState / 3),
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
        
        onChange(themes[clampedIndex]);
      },
    })
  ).current;

  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidthState(width);
    slideAnim.setValue(selectedIndex * (width / 3));
  };

  const handleTap = (index: number) => {
    const newValue = index * (containerWidthState / 3);
    Animated.spring(slideAnim, {
      toValue: newValue,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    onChange(themes[index]);
  };

  return (
    <View
      style={[
        styles.themeSliderContainer,
        { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
      ]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.themeSliderIndicator,
          {
            backgroundColor: isDark ? "#0A84FF" : "#007AFF",
            transform: [{ translateX: slideAnim }],
            width: `${100 / 3}%`,
          },
        ]}
        {...panResponder.panHandlers}
      />
      {themes.map((theme, index) => (
        <TouchableOpacity
          key={theme}
          style={styles.themeSliderOption}
          onPress={() => handleTap(index)}
        >
          <Ionicons
            name={
              theme === "light"
                ? "sunny"
                : theme === "dark"
                ? "moon"
                : "phone-portrait-outline"
            }
            size={20}
            color={value === theme ? "#FFFFFF" : isDark ? "#8E8E93" : "#8E8E93"}
          />
          <Text
            style={[
              styles.themeSliderText,
              {
                color: value === theme ? "#FFFFFF" : isDark ? "#8E8E93" : "#8E8E93",
              },
            ]}
          >
            {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { themeMode, setThemeMode } = useTheme();
  const {
    arabicFont,
    setArabicFont,
    getFontFamily,
    arabicTextSize,
    setArabicTextSize,
  } = useFont();
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [translationTextSize, setTranslationTextSize] = useState(17);
  const [transliterationTextSize, setTransliterationTextSize] = useState(18);

  // Modal state
  const [showFontModal, setShowFontModal] = useState(false);

  // Permission state
  const [locationPermissions, setLocationPermissions] = useState({
    foreground: false,
    background: false,
  });
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Load permission status on component mount
  useEffect(() => {
    loadPermissionStatuses();
  }, []);

  const loadPermissionStatuses = async () => {
    try {
      setPermissionsLoading(true);
      const locationStatus = await checkLocationPermissions();
      const notificationStatus = await checkNotificationPermissions();
      
      setLocationPermissions({
        foreground: locationStatus.foreground,
        background: locationStatus.background,
      });
      setNotificationPermission(notificationStatus.granted);
    } catch (error) {
      console.error("Error loading permission statuses:", error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Map internal font names to display names
  const getFontDisplayName = (font: FontType): ArabicFontDisplay => {
    return font === "Hafs" ? "KFGQPC Hafs" : "PDMS Saleem Quran";
  };

  // Map display names to internal font names
  const getFontInternalName = (displayName: ArabicFontDisplay): FontType => {
    return displayName === "KFGQPC Hafs" ? "Hafs" : "Saleen";
  };

  const getThemeName = (themeMode: string) => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "auto":
        return "System Default";
      default:
        return "System Default";
    }
  };

  // Permission management handlers
  const handleRequestLocationPermission = async () => {
    try {
      const foregroundPerm = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundPerm.status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "Location permission is required for adhkar reminders based on your location.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openAppSettings },
          ]
        );
        return;
      }

      // Request background location
      const backgroundPerm = await Location.requestBackgroundPermissionsAsync();
      
      setLocationPermissions({
        foreground: foregroundPerm.status === "granted",
        background: backgroundPerm.status === "granted",
      });

      const message = backgroundPerm.status === "granted"
        ? "Location permissions granted! You'll receive adhkar reminders in the background."
        : "Foreground location permission granted. Background location is optional for notifications when app is closed.";
      
      Alert.alert("Success", message);
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", "Failed to request location permission.");
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      setNotificationPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Notification Permission Denied",
          "Notification permission is required to receive adhkar reminders.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openAppSettings },
          ]
        );
        return;
      }

      Alert.alert("Success", "Notification permission granted!");
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      Alert.alert("Error", "Failed to request notification permission.");
    }
  };

  const getPermissionStatusColor = (granted: boolean): string => {
    if (isDark) {
      return granted ? "#4CAF50" : "#FF5252";
    }
    return granted ? "#4CAF50" : "#FF5252";
  };

  const getPermissionStatusIcon = (granted: boolean): string => {
    return granted ? "checkmark-circle" : "close-circle";
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Appearance
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Theme
          </Text>
          <DraggableThemeSelector
            value={themeMode}
            onChange={setThemeMode}
            isDark={isDark}
          />
        </View>

        {/* Arabic Font Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Arabic Font
          </Text>
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={() => setShowFontModal(true)}
          >
            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {getFontDisplayName(arabicFont)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Display Toggles Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Display Options
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View
              style={[
                styles.toggleRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Show Translation
              </Text>
              <Switch
                value={showTranslation}
                onValueChange={setShowTranslation}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={showTranslation ? "#4CAF50" : "#f4f3f4"}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Show Transliteration
              </Text>
              <Switch
                value={showTransliteration}
                onValueChange={setShowTransliteration}
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={showTransliteration ? "#4CAF50" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Arabic Text Size Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Arabic Text Size
            </Text>
            <Text
              style={[
                styles.sizeLabel,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {arabicTextSize}px
            </Text>
          </View>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <View style={styles.sliderContainer}>
              <View style={styles.sliderRow}>
                <Ionicons
                  name="text"
                  size={16}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
                <Slider
                  style={styles.slider}
                  minimumValue={14}
                  maximumValue={64}
                  step={1}
                  value={arabicTextSize}
                  onValueChange={setArabicTextSize}
                  minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                  thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                />
                <Ionicons
                  name="text"
                  size={28}
                  color={Colors[colorScheme ?? "light"].textSecondary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Translation Text Size Section */}
        {showTranslation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Translation Text Size
              </Text>
              <Text
                style={[
                  styles.sizeLabel,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {translationTextSize}px
              </Text>
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                  <Ionicons
                    name="text"
                    size={16}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                  <Slider
                    style={styles.slider}
                    minimumValue={14}
                    maximumValue={64}
                    step={1}
                    value={translationTextSize}
                    onValueChange={setTranslationTextSize}
                    minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                    maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                    thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Ionicons
                    name="text"
                    size={28}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Transliteration Text Size Section */}
        {showTransliteration && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Transliteration Text Size
              </Text>
              <Text
                style={[
                  styles.sizeLabel,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {transliterationTextSize}px
              </Text>
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].cardBackground,
                  borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.sliderContainer}>
                <View style={styles.sliderRow}>
                  <Ionicons
                    name="text"
                    size={16}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                  <Slider
                    style={styles.slider}
                    minimumValue={14}
                    maximumValue={64}
                    step={1}
                    value={transliterationTextSize}
                    onValueChange={setTransliterationTextSize}
                    minimumTrackTintColor={isDark ? "#0A84FF" : "#007AFF"}
                    maximumTrackTintColor={isDark ? "#2C2C2E" : "#E5E5EA"}
                    thumbTintColor={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Ionicons
                    name="text"
                    size={28}
                    color={Colors[colorScheme ?? "light"].textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Text Preview Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: Colors[colorScheme ?? "light"].text,
                marginBottom: 12,
              },
            ]}
          >
            Text Preview
          </Text>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            {/* Arabic Text */}
            <View style={styles.previewSection}>
              <Text
                style={[
                  styles.previewArabic,
                  {
                    color: Colors[colorScheme ?? "light"].text,
                    fontFamily: getFontFamily(),
                    fontSize: arabicTextSize,
                    lineHeight: arabicTextSize * 1.8,
                  },
                ]}
              >
                لَا إِلَٰهَ إِلَّا ٱللَّٰهُ
              </Text>
            </View>

            {/* Transliteration */}
            {showTransliteration && (
              <View style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewTransliteration,
                    {
                      fontSize: transliterationTextSize,
                      lineHeight: transliterationTextSize * 1.6,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  lā ʾilāha ʾillā llāh
                </Text>
              </View>
            )}

            {/* Translation */}
            {showTranslation && (
              <View style={styles.previewSection}>
                <Text
                  style={[
                    styles.previewTranslation,
                    {
                      fontSize: translationTextSize,
                      lineHeight: translationTextSize * 1.5,
                      color: Colors[colorScheme ?? "light"].text,
                    },
                  ]}
                >
                  There is no deity except Allah
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Permissions Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Permissions
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            {/* Location Permission */}
            <View
              style={[
                styles.permissionRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.permissionInfo}>
                <View style={styles.permissionHeader}>
                  <Text
                    style={[
                      styles.permissionTitle,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    Location
                  </Text>
                  <View style={styles.statusBadges}>
                    {locationPermissions.foreground && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isDark ? "#1C2C1F" : "#E8F5E9",
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>Foreground</Text>
                      </View>
                    )}
                    {locationPermissions.background && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isDark ? "#1C2C1F" : "#E8F5E9",
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>Background</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  style={[
                    styles.permissionDescription,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Required for location-based adhkar reminders
                </Text>
              </View>
              <Ionicons
                name={getPermissionStatusIcon(locationPermissions.foreground)}
                size={24}
                color={getPermissionStatusColor(locationPermissions.foreground)}
              />
            </View>

            {/* Notification Permission */}
            <View
              style={[
                styles.permissionRow,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
            >
              <View style={styles.permissionInfo}>
                <Text
                  style={[
                    styles.permissionTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Notifications
                </Text>
                <Text
                  style={[
                    styles.permissionDescription,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  Required to receive adhkar reminders
                </Text>
              </View>
              <Ionicons
                name={getPermissionStatusIcon(notificationPermission)}
                size={24}
                color={getPermissionStatusColor(notificationPermission)}
              />
            </View>

            {/* Request Permissions Button */}
            <View style={styles.permissionActionsRow}>
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  {
                    backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                    opacity: !locationPermissions.foreground ? 1 : 0.6,
                  },
                ]}
                onPress={handleRequestLocationPermission}
                disabled={locationPermissions.foreground}
              >
                <Ionicons name="location" size={16} color="white" />
                <Text style={styles.permissionButtonText}>
                  {locationPermissions.foreground ? "Location Granted" : "Grant Location"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  {
                    backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                    opacity: !notificationPermission ? 1 : 0.6,
                  },
                ]}
                onPress={handleRequestNotificationPermission}
                disabled={notificationPermission}
              >
                <Ionicons name="notifications" size={16} color="white" />
                <Text style={styles.permissionButtonText}>
                  {notificationPermission ? "Notifications Granted" : "Grant Notifications"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Settings Link */}
            <TouchableOpacity
              style={[
                styles.settingsLinkRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA",
                },
              ]}
              onPress={openAppSettings}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={Colors[colorScheme ?? "light"].tint}
              />
              <Text
                style={[
                  styles.settingsLinkText,
                  { color: Colors[colorScheme ?? "light"].tint },
                ]}
              >
                Manage in System Settings
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.permissionHint,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Background location tracking allows the app to send you reminders even when not actively using it. This requires "Always Allow" permission on your device.
          </Text>
        </View>

        {/* Test Notifications Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            Test Notifications
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
          >
            <Text
              style={[
                styles.testDescription,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Test location-based adhkar notifications. Tap the notification to view the full adhkar!
            </Text>

            <TouchableOpacity
              style={[
                styles.testAdhkarButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={() => handleTestAdhkarNotification('entry')}
            >
              <Ionicons name="enter" size={18} color="white" />
              <Text style={styles.testButtonText}>Test Entry Notification</Text>
            </TouchableOpacity>

            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Font Selection Modal */}
      <Modal
        visible={showFontModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFontModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFontModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Select Arabic Font
            </Text>
            {(["KFGQPC Hafs", "PDMS Saleem Quran"] as ArabicFontDisplay[]).map(
              (displayFont, index) => {
                const internalFont = getFontInternalName(displayFont);
                const isSelected = arabicFont === internalFont;
                return (
                  <TouchableOpacity
                    key={displayFont}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "#2C5F3F"
                            : "#E8F5E9"
                          : "transparent",
                        borderBottomWidth: index < 1 ? 1 : 0,
                        borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
                      },
                    ]}
                    onPress={() => {
                      setArabicFont(internalFont);
                      setShowFontModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: Colors[colorScheme ?? "light"].text },
                      ]}
                    >
                      {displayFont}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  themeSliderContainer: {
    flexDirection: "row",
    height: 70,
    borderRadius: 16,
    padding: 4,
    position: "relative",
    overflow: "hidden",
  },
  themeSliderIndicator: {
    position: "absolute",
    height: "100%",
    borderRadius: 14,
    top: 0,
    left: 4,
  },
  themeSliderOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  themeSliderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
  sliderContainer: {
    padding: 16,
    paddingHorizontal: 20,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  previewSection: {
    alignItems: "center",
  },
  previewArabic: {
    fontWeight: "400",
    textAlign: "right",
    writingDirection: "rtl",
  },
  previewTransliteration: {
    fontStyle: "italic",
    textAlign: "center",
  },
  previewTranslation: {
    fontWeight: "400",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 17,
    fontWeight: "500",
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  statusBadges: {
    flexDirection: "row",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4CAF50",
  },
  permissionDescription: {
    fontSize: 13,
    fontWeight: "400",
  },
  permissionActionsRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  permissionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  settingsLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  settingsLinkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  permissionHint: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 12,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  testDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  testAdhkarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  testButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});
