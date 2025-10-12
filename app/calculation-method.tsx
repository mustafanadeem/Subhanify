import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrayerTimesRepository } from "../modules/prayer-times/data/repository";
import { UserSettings } from "../modules/prayer-times/domain/entities";

const CALCULATION_METHODS = [
  {
    id: 15,
    name: "London Unified Islamic Prayer Timetable",
    params: "°18.0 :باميدات / °15.0 :خۆويتىن",
    recommended: true,
  },
  {
    id: 17,
    name: "Algerian Minister of Religious Affairs and Wakfs",
    params: "°18.0 :باميدات / °17.0 :خۆويتىن",
  },
  {
    id: 15,
    name: "Basque Country",
    params: "°15.0 :باميدات / °15.0 :خۆويتىن",
  },
  {
    id: 14,
    name: "Custom Angles",
    params: "°16.0 :باميدات / °14.0 :خۆويتىن",
  },
  {
    id: 18,
    name: "Diyanet İşleri Başkanlığı",
    params: "°18.0 :باميدات / °17.0 :خۆويتىن",
  },
  {
    id: 5,
    name: "Egyptian General Authority",
    params: "°19.5 :باميدات / °17.5 :خۆويتىن",
  },
  {
    id: 10,
    name: "Egyptian General Authority (Bis)",
    params: "°20.0 :باميدات / °18.0 :خۆويتىن",
  },
  {
    id: 8,
    name: "Fixed Isha Angle Interval",
    params: "90 min after شام :خۆويتىن / °19.5 :باميدات",
  },
  {
    id: 13,
    name: "France: UOIF",
    params: "°12.0 :باميدات / °12.0 :خۆويتىن",
  },
  {
    id: 11,
    name: "Gulf 90 Minutes",
    params: "90 min after شام :خۆويتىن / °19.5 :باميدات",
  },
  {
    id: 9,
    name: "Gulf Region",
    params: "°19.5 :باميدات / °19.5 :خۆويتىن",
  },
  {
    id: 7,
    name: "Institute of Geophysics, University of Tehran",
    params: "°17.7 :باميدات / °14.0 :خۆويتىن",
  },
  {
    id: 0,
    name: "Ithna Ashari (Shia)",
    params: "°16.0 :باميدات / °14.0 :خۆويتىن",
  },
  {
    id: 1,
    name: "Islamic Society of North America (ISNA)",
    params: "°15.0 :باميدات / °15.0 :خۆويتىن",
  },
  {
    id: 4,
    name: "Karachi: University of Islamic Sciences",
    params: "°18.0 :باميدات / °18.0 :خۆويتىن",
  },
  {
    id: 6,
    name: "Makkah: Umm al-Qura University",
    params: "90 min after شام :خۆويتىن / °18.5 :باميدات",
  },
  {
    id: 15,
    name: "Moonsighting Committee",
    params: "Seasonal adjustment :باميدات / Seasonal adjustment :خۆويتىن",
  },
  {
    id: 2,
    name: "Muslim World League",
    params: "°18.0 :باميدات / °17.0 :خۆويتىن",
  },
  {
    id: 12,
    name: "Qatar",
    params: "90 min after شام :خۆويتىن / °18.0 :باميدات",
  },
  {
    id: 16,
    name: "Russia: Spiritual Administration of Muslims",
    params: "°16.0 :باميدات / °15.0 :خۆويتىن",
  },
  {
    id: 99,
    name: "Singapore",
    params: "°20.0 :باميدات / °18.0 :خۆويتىن",
  },
  {
    id: 3,
    name: "Tunisia: Ministry of Religious Affairs",
    params: "°19.0 :باميدات / °17.0 :خۆويتىن",
  },
  {
    id: 98,
    name: "Turkey: Directorate of Religious Affairs",
    params: "°18.0 :باميدات / °17.0 :خۆويتىن",
  },
];

export default function CalculationMethodScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const repo = useMemo(() => new PrayerTimesRepository(), []);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());

  function selectMethod(methodId: number) {
    const next = { ...settings, method: methodId };
    setSettings(next);
    repo.saveSettings(next);
    // Navigate back after selection
    setTimeout(() => router.back(), 300);
  }

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
          Calculation Method
        </Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {CALCULATION_METHODS.map((method, index) => (
          <TouchableOpacity
            key={`${method.id}-${index}`}
            style={[
              styles.methodCard,
              {
                backgroundColor:
                  settings.method === method.id
                    ? isDark
                      ? "#1C3D2F"
                      : "#E8F5E9"
                    : isDark
                    ? "#1C1C1E"
                    : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={() => selectMethod(method.id)}
          >
            <View style={styles.methodContent}>
              {method.recommended && (
                <View
                  style={[
                    styles.recommendedBadge,
                    { backgroundColor: isDark ? "#2C5F3F" : "#C8E6C9" },
                  ]}
                >
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
              <Text
                style={[
                  styles.methodName,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {method.name}
              </Text>
              {method.params && (
                <Text
                  style={[
                    styles.methodParams,
                    { color: Colors[colorScheme ?? "light"].textSecondary },
                  ]}
                >
                  {method.params}
                </Text>
              )}
            </View>
            {settings.method === method.id && (
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
  infoButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  methodContent: {
    flex: 1,
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  methodName: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 4,
  },
  methodParams: {
    fontSize: 13,
    marginTop: 2,
  },
});


