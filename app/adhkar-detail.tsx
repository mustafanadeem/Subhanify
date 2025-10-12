import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useFont } from "@/contexts/FontContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AdhkarItem } from "@/types/adhkar";
import { getAdhkarByCategory } from "@/utils/adhkar-utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function AdhkarDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getFontFamily, arabicTextSize } = useFont();

  // Get the category from params
  const categoryTitle = (params.title as string) || "Morning";
  const categoryKey = (params.category as string)?.toLowerCase() || "morning";

  // Fetch adhkar for this category
  const adhkarList = useMemo(
    () => getAdhkarByCategory(categoryKey),
    [categoryKey]
  );
  const totalCount = adhkarList.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Get current adhkar
  const currentAdhkar: AdhkarItem | undefined = adhkarList[currentIndex];

  // Initialize countdown from quantity
  const [count, setCount] = useState(currentAdhkar?.quantity || 0);

  // Reset count when adhkar changes
  useEffect(() => {
    if (currentAdhkar) {
      setCount(currentAdhkar.quantity);
    }
  }, [currentIndex, currentAdhkar]);

  // Handle horizontal scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalCount) {
      setCurrentIndex(newIndex);
    }
  };

  // If no data found, show empty state
  if (!currentAdhkar) {
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>No Data Found</ThemedText>
          </View>
          <View style={styles.headerActions} />
        </View>
      </View>
    );
  }

  const handleCount = () => {
    if (count > 1) {
      // Just decrement normally
      setCount(count - 1);
    } else if (count === 1) {
      // Last click - trigger vertical animation
      setCount(0);
      if (currentIndex < totalCount - 1) {
        setIsAnimating(true);

        // Slide up animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // After animation, update index and scroll
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          scrollViewRef.current?.scrollTo({
            x: nextIndex * SCREEN_WIDTH,
            animated: false,
          });

          // Reset animation and hide overlay
          slideAnim.setValue(SCREEN_HEIGHT);
          setIsAnimating(false);
        });
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < totalCount) {
      scrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
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
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>{categoryTitle}</ThemedText>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol
              name="house.fill"
              size={22}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol
              name="ellipsis"
              size={22}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / totalCount) * 100}%`,
                backgroundColor: isDark ? "#0A84FF" : "#007AFF",
              },
            ]}
          />
        </View>
      </View>

      {/* Content Container with Animation */}
      <View style={styles.contentWrapper}>
        {/* Horizontal Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.horizontalScroll}
        >
          {adhkarList.map((adhkar, index) => (
            <View key={index} style={styles.page}>
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Title and Counter */}
                <View style={styles.titleSection}>
                  <ThemedText style={styles.title}>{adhkar.Adhkar}</ThemedText>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.counterBadge,
                        {
                          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                          borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                        },
                      ]}
                    >
                      <ThemedText style={styles.counterText}>
                        {index + 1}/{totalCount}
                      </ThemedText>
                    </View>
                    {adhkar.quantity > 1 && (
                      <View
                        style={[
                          styles.quantityBadge,
                          {
                            backgroundColor: isDark ? "#0A84FF" : "#007AFF",
                          },
                        ]}
                      >
                        <ThemedText style={styles.quantityText}>
                          {adhkar.quantity}x
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Arabic Text */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                      borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.arabicText,
                      {
                        fontFamily: getFontFamily(),
                        fontSize: arabicTextSize,
                      },
                    ]}
                  >
                    {adhkar.Arabic}
                  </ThemedText>
                </View>

                {/* Transliteration */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                      borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                    },
                  ]}
                >
                  <ThemedText style={styles.transliteration}>
                    {adhkar.transliteration}
                  </ThemedText>
                </View>

                {/* Translation */}
                {typeof adhkar.translation === "string" && (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                        borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                      },
                    ]}
                  >
                    <ThemedText style={styles.translation}>
                      {adhkar.translation}
                    </ThemedText>
                  </View>
                )}

                {/* Virtue */}
                {adhkar.virtue && (
                  <View
                    style={[
                      styles.virtueCard,
                      {
                        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                        borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                      },
                    ]}
                  >
                    <View style={styles.referenceHeader}>
                      <IconSymbol
                        name="star.fill"
                        size={18}
                        color={isDark ? "#FFD60A" : "#FFCC00"}
                      />
                      <ThemedText style={styles.referenceTitle}>
                        Virtue
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.referenceText}>
                      {adhkar.virtue}
                    </ThemedText>
                  </View>
                )}

                {/* Reference */}
                {adhkar.reference && (
                  <View
                    style={[
                      styles.referenceCard,
                      {
                        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                        borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                      },
                    ]}
                  >
                    <View style={styles.referenceHeader}>
                      <IconSymbol
                        name="book.fill"
                        size={18}
                        color={isDark ? "#8E8E93" : "#8E8E93"}
                      />
                      <ThemedText style={styles.referenceTitle}>
                        Reference
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.referenceText}>
                      {adhkar.reference}
                    </ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* Vertical Slide Animation Overlay - Content Only */}
        {isAnimating && currentIndex < totalCount - 1 && (
          <Animated.View
            style={[
              styles.contentAnimationOverlay,
              {
                transform: [{ translateY: slideAnim }],
                backgroundColor: isDark ? "#000000" : "#F2F2F7",
              },
            ]}
          >
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Next Adhkar Content */}
              {adhkarList[currentIndex + 1] &&
                (() => {
                  const nextAdhkar = adhkarList[currentIndex + 1];
                  return (
                    <>
                      {/* Title and Counter */}
                      <View style={styles.titleSection}>
                        <ThemedText style={styles.title}>
                          {nextAdhkar.Adhkar}
                        </ThemedText>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.counterBadge,
                              {
                                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                              },
                            ]}
                          >
                            <ThemedText style={styles.counterText}>
                              {currentIndex + 2}/{totalCount}
                            </ThemedText>
                          </View>
                          {nextAdhkar.quantity > 1 && (
                            <View
                              style={[
                                styles.quantityBadge,
                                {
                                  backgroundColor: isDark
                                    ? "#0A84FF"
                                    : "#007AFF",
                                },
                              ]}
                            >
                              <ThemedText style={styles.quantityText}>
                                {nextAdhkar.quantity}x
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Arabic Text */}
                      <View
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                            borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.arabicText,
                            {
                              fontFamily: getFontFamily(),
                              fontSize: arabicTextSize,
                            },
                          ]}
                        >
                          {nextAdhkar.Arabic}
                        </ThemedText>
                      </View>

                      {/* Transliteration */}
                      <View
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                            borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                          },
                        ]}
                      >
                        <ThemedText style={styles.transliteration}>
                          {nextAdhkar.transliteration}
                        </ThemedText>
                      </View>

                      {/* Translation */}
                      {typeof nextAdhkar.translation === "string" && (
                        <View
                          style={[
                            styles.card,
                            {
                              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                            },
                          ]}
                        >
                          <ThemedText style={styles.translation}>
                            {nextAdhkar.translation}
                          </ThemedText>
                        </View>
                      )}

                      {/* Virtue */}
                      {nextAdhkar.virtue && (
                        <View
                          style={[
                            styles.virtueCard,
                            {
                              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                            },
                          ]}
                        >
                          <View style={styles.referenceHeader}>
                            <IconSymbol
                              name="star.fill"
                              size={18}
                              color={isDark ? "#FFD60A" : "#FFCC00"}
                            />
                            <ThemedText style={styles.referenceTitle}>
                              Virtue
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.referenceText}>
                            {nextAdhkar.virtue}
                          </ThemedText>
                        </View>
                      )}

                      {/* Reference */}
                      {nextAdhkar.reference && (
                        <View
                          style={[
                            styles.referenceCard,
                            {
                              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                              borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                            },
                          ]}
                        >
                          <View style={styles.referenceHeader}>
                            <IconSymbol
                              name="book.fill"
                              size={18}
                              color={isDark ? "#8E8E93" : "#8E8E93"}
                            />
                            <ThemedText style={styles.referenceTitle}>
                              Reference
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.referenceText}>
                            {nextAdhkar.reference}
                          </ThemedText>
                        </View>
                      )}
                    </>
                  );
                })()}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: Colors[colorScheme ?? "light"].headerBackground,
            borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA",
            paddingBottom: 34,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <IconSymbol
            name="play.fill"
            size={24}
            color={
              currentIndex === 0
                ? isDark
                  ? "#3A3A3C"
                  : "#C7C7CC"
                : isDark
                ? "#FFFFFF"
                : "#000000"
            }
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            name="info.circle.fill"
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>

        <View style={styles.countButtonContainer}>
          {/* Circular Progress Background */}
          <Svg width={68} height={68} style={styles.progressCircle}>
            {/* Background circle */}
            <Circle
              cx="34"
              cy="34"
              r="30"
              stroke={isDark ? "#2C2C2E" : "#E5E5EA"}
              strokeWidth="4"
              fill="none"
            />
            {/* Progress circle */}
            {currentAdhkar && currentAdhkar.quantity > 0 && (
              <Circle
                cx="34"
                cy="34"
                r="30"
                stroke={
                  count === 0
                    ? isDark
                      ? "#2C2C2E"
                      : "#E5E5EA"
                    : isDark
                    ? "#0A84FF"
                    : "#007AFF"
                }
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${
                  2 * Math.PI * 30 * (count / currentAdhkar.quantity)
                }`}
                strokeLinecap="round"
                transform="rotate(-90 34 34)"
              />
            )}
          </Svg>

          {/* Counter Button */}
          <TouchableOpacity
            style={[
              styles.countButton,
              {
                backgroundColor:
                  count === 0
                    ? isDark
                      ? "#2C2C2E"
                      : "#E5E5EA"
                    : isDark
                    ? "#0A84FF"
                    : "#007AFF",
              },
            ]}
            onPress={handleCount}
            disabled={count === 0}
          >
            <ThemedText
              style={[
                styles.countButtonText,
                count === 0 && { color: isDark ? "#8E8E93" : "#8E8E93" },
              ]}
            >
              {count}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol
            name="square.and.arrow.up.fill"
            size={24}
            color={isDark ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleNext}
          disabled={currentIndex === totalCount - 1}
        >
          <IconSymbol
            name="play.fill"
            size={24}
            color={
              currentIndex === totalCount - 1
                ? isDark
                  ? "#3A3A3C"
                  : "#C7C7CC"
                : isDark
                ? "#FFFFFF"
                : "#000000"
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  contentWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  horizontalScroll: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    paddingTop: 8,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  counterBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 15,
    fontWeight: "600",
  },
  quantityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  arabicText: {
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 50,
    letterSpacing: 1,
  },
  transliteration: {
    fontSize: 18,
    fontStyle: "italic",
    lineHeight: 26,
  },
  translation: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
  },
  virtueCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  referenceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  referenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  referenceTitle: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.8,
  },
  referenceText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.7,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  countButtonContainer: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  progressCircle: {
    position: "absolute",
  },
  countButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  countButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contentAnimationOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
