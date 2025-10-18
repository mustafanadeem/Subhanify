import { useColorScheme } from "@/hooks/use-color-scheme";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COMPASS_SIZE = Math.min(SCREEN_WIDTH * 0.85, 350);

// Kaaba coordinates (Mecca, Saudi Arabia)
const KAABA_LATITUDE = 21.4225;
const KAABA_LONGITUDE = 39.826174;

interface QiblaCompassProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Calculate the bearing (angle) from user's location to Kaaba
 */
function calculateQiblaDirection(
  userLat: number,
  userLon: number,
  kaabaLat: number,
  kaabaLon: number
): number {
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (kaabaLat * Math.PI) / 180;
  const Δλ = ((kaabaLon - userLon) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees

  return bearing;
}

/**
 * Normalize angle difference to -180 to 180 range
 */
function normalizeAngleDiff(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

export function QiblaCompass({ userLocation }: QiblaCompassProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [heading, setHeading] = useState(0); // Device heading (compass direction)
  const [qiblaDirection, setQiblaDirection] = useState(0); // Direction to Kaaba
  const [isAligned, setIsAligned] = useState(false);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const beamRotation = useRef(new Animated.Value(0)).current;
  const beamOpacity = useRef(new Animated.Value(0.6)).current;

  // Subscribe to magnetometer
  useEffect(() => {
    let subscription: any;

    const startMagnetometer = async () => {
      try {
        Magnetometer.setUpdateInterval(100); // Update every 100ms

        subscription = Magnetometer.addListener((data) => {
          setMagnetometerData(data);

          // Calculate heading from magnetometer data
          let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
          
          // Normalize to 0-360
          if (angle < 0) {
            angle += 360;
          }

          // iOS and Android handle compass differently
          if (Platform.OS === "ios") {
            angle = 360 - angle; // iOS reports in opposite direction
          }

          setHeading(angle);
        });
      } catch (error) {
        console.error("Error starting magnetometer:", error);
      }
    };

    startMagnetometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Calculate Qibla direction when user location changes
  useEffect(() => {
    if (userLocation) {
      const direction = calculateQiblaDirection(
        userLocation.latitude,
        userLocation.longitude,
        KAABA_LATITUDE,
        KAABA_LONGITUDE
      );
      setQiblaDirection(direction);
    }
  }, [userLocation]);

  // Check if aligned and animate
  useEffect(() => {
    // Calculate the angle difference between device heading and Qibla direction
    const angleDiff = normalizeAngleDiff(qiblaDirection - heading);
    const relativeQiblaAngle = -heading; // Rotate compass opposite to heading

    // Check if aligned (within ±5 degrees)
    const aligned = Math.abs(angleDiff) < 5;
    setIsAligned(aligned);

    // Animate compass rotation
    Animated.spring(compassRotation, {
      toValue: relativeQiblaAngle,
      tension: 10,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate beam rotation to point to Qibla
    Animated.spring(beamRotation, {
      toValue: qiblaDirection - heading,
      tension: 10,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate beam color/opacity when aligned
    if (aligned) {
      Animated.timing(beamOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(beamOpacity, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [heading, qiblaDirection]);

  if (!userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" }]}>
        <Text style={[styles.loadingText, { color: isDark ? "#FFFFFF" : "#000000" }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  const compassRotate = compassRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const beamRotate = beamRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1C1C1E" : "#F5F5F5" }]}>
      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.statusText,
            {
              color: isAligned ? "#4CAF50" : isDark ? "#FFFFFF" : "#000000",
              fontSize: isAligned ? 24 : 18,
              fontWeight: isAligned ? "bold" : "600",
            },
          ]}
        >
          {isAligned ? "☪️ Aligned with Qibla" : "Turn until aligned"}
        </Text>
        <Text style={[styles.degreeText, { color: isDark ? "#888" : "#666" }]}>
          Qibla: {Math.round(qiblaDirection)}° • Heading: {Math.round(heading)}°
        </Text>
      </View>

      {/* Compass Container */}
      <View style={styles.compassContainer}>
        {/* Direction Beam - Rotates to point at Qibla */}
        <Animated.View
          style={[
            styles.beamContainer,
            {
              transform: [{ rotate: beamRotate }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.beam,
              {
                backgroundColor: isAligned ? "#4CAF50" : "#FF9800",
                opacity: beamOpacity,
              },
            ]}
          />
        </Animated.View>

        {/* Compass Rose - Rotates with device heading */}
        <Animated.View
          style={[
            styles.compass,
            {
              transform: [{ rotate: compassRotate }],
            },
          ]}
        >
          {/* Compass Background Circle */}
          <View
            style={[
              styles.compassCircle,
              {
                backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF",
                borderColor: isDark ? "#444" : "#DDD",
              },
            ]}
          >
            {/* Cardinal Directions */}
            <Text style={[styles.cardinalN, { color: "#E53935" }]}>N</Text>
            <Text style={[styles.cardinalE, { color: isDark ? "#FFF" : "#000" }]}>E</Text>
            <Text style={[styles.cardinalS, { color: isDark ? "#FFF" : "#000" }]}>S</Text>
            <Text style={[styles.cardinalW, { color: isDark ? "#FFF" : "#000" }]}>W</Text>

            {/* Degree Marks */}
            {[...Array(36)].map((_, index) => {
              const angle = index * 10;
              const isCardinal = angle % 90 === 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.degreeMark,
                    {
                      transform: [
                        { rotate: `${angle}deg` },
                        { translateY: -COMPASS_SIZE / 2 + 10 },
                      ],
                      height: isCardinal ? 15 : 8,
                      width: isCardinal ? 3 : 1.5,
                      backgroundColor: isCardinal
                        ? isDark
                          ? "#FFF"
                          : "#000"
                        : isDark
                        ? "#666"
                        : "#CCC",
                    },
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Center Kaaba Icon */}
        <View style={styles.centerIconContainer}>
          <View
            style={[
              styles.kaabaIcon,
              {
                backgroundColor: isAligned ? "#4CAF50" : isDark ? "#3A3A3C" : "#E0E0E0",
                borderColor: isAligned ? "#66BB6A" : isDark ? "#555" : "#CCC",
              },
            ]}
          >
            <Text style={styles.kaabaEmoji}>🕋</Text>
          </View>
        </View>
      </View>

      {/* Info Text */}
      <Text style={[styles.infoText, { color: isDark ? "#888" : "#666" }]}>
        Point your device towards the Kaaba in Mecca
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  degreeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  beamContainer: {
    position: "absolute",
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  beam: {
    width: 4,
    height: COMPASS_SIZE / 2 - 60,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  compassCircle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  degreeMark: {
    position: "absolute",
    top: COMPASS_SIZE / 2,
  },
  cardinalN: {
    position: "absolute",
    top: 15,
    fontSize: 24,
    fontWeight: "bold",
  },
  cardinalE: {
    position: "absolute",
    right: 15,
    fontSize: 20,
    fontWeight: "bold",
  },
  cardinalS: {
    position: "absolute",
    bottom: 15,
    fontSize: 20,
    fontWeight: "bold",
  },
  cardinalW: {
    position: "absolute",
    left: 15,
    fontSize: 20,
    fontWeight: "bold",
  },
  centerIconContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  kaabaIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  kaabaEmoji: {
    fontSize: 40,
  },
  infoText: {
    marginTop: 30,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

