import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdhkarDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [currentIndex, setCurrentIndex] = useState(1);
  const [count, setCount] = useState(0);

  // Mock data - in a real app, this would come from your data source
  const categoryTitle = params.category || "Morning Adhkar";
  const totalCount = 7;

  const adhkarData = {
    title: "Allah is Enough for Us",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Hasbunallahu wa ni'mal Wakil.",
    translation: "Allah is enough for us and He is the Best Protector.",
    reference: {
      title: "Hadith",
      text: "Ibn ʿAbbās (radiy Allāhū ʿanhumā) narrated: \"[The above] was said by Ibrāhīm (ʿalayhis-salām) when he was thrown into the fire; and it was said by Muḥammad ﷺ when (the hypocrites) said, 'Your enemies have mobilised their forces against you, so fear them,' — but this only increased them in faith and they replied: 'Allah is enough for us and He is the Best Protector (3:173).'\" (Bukhārī 4563)",
    },
  };

  const handleCount = () => {
    setCount(count + 1);
  };

  const handleNext = () => {
    if (currentIndex < totalCount) {
      setCurrentIndex(currentIndex + 1);
      setCount(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 1) {
      setCurrentIndex(currentIndex - 1);
      setCount(0);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F2F2F7" },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#000000" : "#F2F2F7"}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderBottomColor: isDark ? "#2C2C2E" : "#E5E5EA",
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
            color={isDark ? "#FFFFFF" : "#000000"}
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
              color={isDark ? "#FFFFFF" : "#000000"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol
              name="ellipsis"
              size={22}
              color={isDark ? "#FFFFFF" : "#000000"}
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
                width: `${(currentIndex / totalCount) * 100}%`,
                backgroundColor: isDark ? "#0A84FF" : "#007AFF",
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and Counter */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>{adhkarData.title}</ThemedText>
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
              {currentIndex}/{totalCount}
            </ThemedText>
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
          <ThemedText style={styles.arabicText}>{adhkarData.arabic}</ThemedText>
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
            {adhkarData.transliteration}
          </ThemedText>
        </View>

        {/* Translation */}
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
            {adhkarData.translation}
          </ThemedText>
        </View>

        {/* Reference */}
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
              {adhkarData.reference.title}
            </ThemedText>
          </View>
          <ThemedText style={styles.referenceText}>
            {adhkarData.reference.text}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            borderTopColor: isDark ? "#2C2C2E" : "#E5E5EA",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePrevious}
          disabled={currentIndex === 1}
        >
          <IconSymbol
            name="play.fill"
            size={24}
            color={
              currentIndex === 1
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

        <TouchableOpacity
          style={[
            styles.countButton,
            {
              backgroundColor: isDark ? "#0A84FF" : "#007AFF",
            },
          ]}
          onPress={handleCount}
        >
          <ThemedText style={styles.countButtonText}>{count}</ThemedText>
        </TouchableOpacity>

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
          disabled={currentIndex === totalCount}
        >
          <IconSymbol
            name="play.fill"
            size={24}
            color={
              currentIndex === totalCount
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
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    paddingTop: 8,
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
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 12,
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 32,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
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
});
