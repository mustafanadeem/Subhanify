import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { PrayerTimesRepository } from "../data/repository";
import { TodayPrayerTimes, UserSettings } from "../domain/entities";

const repo = new PrayerTimesRepository();

export default function PrayerTimesScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TodayPrayerTimes | null>(null);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repo.getToday();
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reload settings when screen comes into focus (e.g., after changing settings)
  useFocusEffect(
    useCallback(() => {
      const newSettings = repo.loadSettings();
      setSettings(newSettings);
      // Reload prayer times to reflect any calculation method changes
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const primaryAsr = settings.schoolPrimary === 0 ? data?.asrMithl1 : data?.asrMithl2;

  const textColor = { color: Colors[colorScheme ?? "light"].text };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={textColor}>Loading Prayer Times…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={textColor}>Error: {error}</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16 }}>
      <Text style={[{ fontSize: 20, marginBottom: 8 }, textColor]}>London — {data.info.readable}</Text>
      <Text style={[{ marginBottom: 16 }, textColor]}>Method {settings.method}, High Latitude {settings.lam}</Text>

      <Row label="Fajr" value={formatTime(data.fajr.timeIso)} color={textColor.color} />
      <Row label="Sunrise" value={formatTime(data.sunrise.timeIso)} color={textColor.color} />
      <Row label="Dhuhr" value={formatTime(data.dhuhr.timeIso)} color={textColor.color} />
      <Row label={`Asr (${settings.schoolPrimary === 0 ? "Mithl 1" : "Mithl 2"})`} value={formatTime(primaryAsr?.timeIso ?? "")} color={textColor.color} />
      {settings.showBothAsr && (
        <>
          <Row label="Asr (Mithl 1)" value={formatTime(data.asrMithl1.timeIso)} color={textColor.color} />
          <Row label="Asr (Mithl 2)" value={formatTime(data.asrMithl2.timeIso)} color={textColor.color} />
        </>
      )}
      <Row label="Maghrib" value={formatTime(data.maghrib.timeIso)} color={textColor.color} />
      <Row label="Isha" value={formatTime(data.isha.timeIso)} color={textColor.color} />

      {data.offline && (
        <Text style={[{ marginTop: 12 }, textColor]}>Offline — Last updated {new Date(data.lastUpdated).toLocaleString()}</Text>
      )}
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
      <Text style={{ color, fontSize: 16 }}>{label}</Text>
      <Text style={{ color, fontSize: 16 }}>{value}</Text>
    </View>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}


