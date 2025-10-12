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

const ASR_METHODS = [
  {
    id: 0,
    name: "Standard (Shafi'i, Maliki & Hanbali)",
    description: "Shadow length = object length",
    detail: "Earlier Asr time, widely used in most Muslim countries",
  },
  {
    id: 1,
    name: "Hanafi",
    description: "Shadow length = 2x object length",
    detail: "Later Asr time, commonly used in South Asia and Central Asia",
  },
];

export default function AsrMethodScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const repo = useMemo(() => new PrayerTimesRepository(), []);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());

  function selectMethod(methodId: 0 | 1) {
    const next = { ...settings, schoolPrimary: methodId };
    setSettings(next);
    repo.saveSettings(next);
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
          Asr Calculation Method
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {ASR_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              {
                backgroundColor:
                  settings.schoolPrimary === method.id
                    ? isDark
                      ? "#1C3D2F"
                      : "#E8F5E9"
                    : isDark
                    ? "#1C1C1E"
                    : "#FFFFFF",
                borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
              },
            ]}
            onPress={() => selectMethod(method.id as 0 | 1)}
          >
            <View style={styles.methodContent}>
              <Text
                style={[
                  styles.methodName,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                {method.name}
              </Text>
              <Text
                style={[
                  styles.methodDescription,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {method.description}
              </Text>
              <Text
                style={[
                  styles.methodDetail,
                  { color: Colors[colorScheme ?? "light"].textSecondary },
                ]}
              >
                {method.detail}
              </Text>
            </View>
            {settings.schoolPrimary === method.id && (
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
  headerSpacer: {
    width: 36,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  methodDescription: {
    fontSize: 15,
    marginBottom: 4,
  },
  methodDetail: {
    fontSize: 13,
    fontStyle: "italic",
  },
});


