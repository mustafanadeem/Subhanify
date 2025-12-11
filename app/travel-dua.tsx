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
    backgroundColor: '#F0F9FF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C4A6E',
    textAlign: 'center',
    marginBottom: 12,
  },
  intensityBadge: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  duaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  duaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  duaArabic: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0C4A6E',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 48,
  },
  duaTransliteration: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
  },
  duaTranslation: {
    fontSize: 18,
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 28,
  },
  meaningCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  meaningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  meaningText: {
    fontSize: 15,
    color: '#1E3A8A',
    lineHeight: 24,
    marginBottom: 12,
  },
  referenceCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
  additionalDuas: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  additionalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  additionalDuaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  additionalArabic: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C4A6E',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  additionalTranslation: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#64748B',
    textAlign: 'center',
  },
});
