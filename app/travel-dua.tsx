/**
 * Travel Dua Display Screen
 *
 * Shows travel duas when opened from notifications or manually.
 * Displays Arabic text, transliteration, translation, and reference.
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getTravelDuas } from "@/services/travel-notification-service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TravelDuaScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();

  const allDuas = getTravelDuas();
  const [currentDuaIndex, setCurrentDuaIndex] = useState(0);

  // If opened from notification with specific dua ID
  React.useEffect(() => {
    if (params.duaId) {
      const index = allDuas.findIndex((dua) => dua.id === params.duaId);
      if (index !== -1) {
        setCurrentDuaIndex(index);
      }
    }
  }, [params.duaId]);

  const currentDua = allDuas[currentDuaIndex];

  const nextDua = () => {
    setCurrentDuaIndex((prev) => (prev + 1) % allDuas.length);
  };

  const previousDua = () => {
    setCurrentDuaIndex((prev) => (prev - 1 + allDuas.length) % allDuas.length);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: Colors[colorScheme ?? "light"].headerBackground },
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
          Travel Duas
        </Text>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.duaCounter,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            {currentDuaIndex + 1} of {allDuas.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dua Card */}
        <View
          style={[
            styles.duaCard,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          {/* Arabic Text */}
          <View style={styles.arabicContainer}>
            <Text
              style={[
                styles.arabicText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              {currentDua.arabic}
            </Text>
          </View>

          {/* Transliteration */}
          <View style={styles.transliterationContainer}>
            <Text
              style={[
                styles.transliterationText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {currentDua.transliteration}
            </Text>
          </View>

          {/* Translation */}
          <View style={styles.translationContainer}>
            <Text
              style={[
                styles.translationText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              "{currentDua.translation}"
            </Text>
          </View>

          {/* Reference */}
          <View style={styles.referenceContainer}>
            <Text
              style={[
                styles.referenceText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              — {currentDua.reference}
            </Text>
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
            onPress={previousDua}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
            <Text
              style={[
                styles.navButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: Colors[colorScheme ?? "light"].cardBackground,
              },
            ]}
            onPress={nextDua}
          >
            <Text
              style={[
                styles.navButtonText,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          <View style={styles.infoHeader}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors[colorScheme ?? "light"].tint}
            />
            <Text
              style={[
                styles.infoTitle,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              About Travel Duas
            </Text>
          </View>
          <Text
            style={[
              styles.infoText,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            These duas are recommended to be recited when beginning a journey.
            They seek Allah's protection and blessing for safe travel.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  duaCounter: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  duaCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  arabicContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 44,
    textAlign: "center",
    fontFamily: "System", // You can use Arabic font here
  },
  transliterationContainer: {
    marginBottom: 16,
  },
  transliterationText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  translationContainer: {
    marginBottom: 16,
  },
  translationText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
  referenceContainer: {
    alignItems: "center",
  },
  referenceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
