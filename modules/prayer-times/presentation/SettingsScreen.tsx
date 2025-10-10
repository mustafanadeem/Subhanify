import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useMemo, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { PrayerTimesRepository } from "../data/repository";
import { UserSettings } from "../domain/entities";

const METHODS: { id: number; name: string }[] = [
  { id: 15, name: "Moonsighting Committee" },
  { id: 2, name: "ISNA" },
  { id: 3, name: "Muslim World League" },
  { id: 13, name: "UOIF" },
];

export default function SettingsScreen() {
  const repo = useMemo(() => new PrayerTimesRepository(), []);
  const [settings, setSettings] = useState<UserSettings>(repo.loadSettings());
  const cs = useColorScheme();
  const text = { color: Colors[cs ?? "light"].text };

  function update(partial: Partial<UserSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    repo.saveSettings(next);
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={[{ fontSize: 20, marginBottom: 8 }, text]}>Prayer Settings</Text>

      <Text style={text}>Calculation Method</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {METHODS.map((m) => (
          <Choice key={m.id} label={m.name} selected={settings.method === m.id} onPress={() => update({ method: m.id })} />
        ))}
      </View>

      <Text style={[{ marginTop: 8 }, text]}>Asr School (Mithl)</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Choice label="Mithl 1" selected={settings.schoolPrimary === 0} onPress={() => update({ schoolPrimary: 0 })} />
        <Choice label="Mithl 2" selected={settings.schoolPrimary === 1} onPress={() => update({ schoolPrimary: 1 })} />
      </View>

      <Text style={[{ marginTop: 8 }, text]}>High Latitude Adjustment</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Choice label="Angle Based" selected={settings.lam === 3} onPress={() => update({ lam: 3 })} />
        <Choice label="Middle of Night" selected={settings.lam === 1} onPress={() => update({ lam: 1 })} />
        <Choice label="One Seventh" selected={settings.lam === 2} onPress={() => update({ lam: 2 })} />
      </View>

      <Text style={[{ marginTop: 8 }, text]}>Show both Asr</Text>
      <Switch value={settings.showBothAsr} onValueChange={(v) => update({ showBothAsr: v })} />

      <Text style={[{ marginTop: 8 }, text]}>Tune (minutes)</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <TuneChoice label="Fajr -1" onPress={() => update({ tune: { ...settings.tune, fajr: settings.tune.fajr - 1 } })} />
        <TuneChoice label="Fajr +1" onPress={() => update({ tune: { ...settings.tune, fajr: settings.tune.fajr + 1 } })} />
        <TuneChoice label="Dhuhr -1" onPress={() => update({ tune: { ...settings.tune, dhuhr: settings.tune.dhuhr - 1 } })} />
        <TuneChoice label="Dhuhr +1" onPress={() => update({ tune: { ...settings.tune, dhuhr: settings.tune.dhuhr + 1 } })} />
        <TuneChoice label="Asr -1" onPress={() => update({ tune: { ...settings.tune, asr: settings.tune.asr - 1 } })} />
        <TuneChoice label="Asr +1" onPress={() => update({ tune: { ...settings.tune, asr: settings.tune.asr + 1 } })} />
        <TuneChoice label="Maghrib -1" onPress={() => update({ tune: { ...settings.tune, maghrib: settings.tune.maghrib - 1 } })} />
        <TuneChoice label="Maghrib +1" onPress={() => update({ tune: { ...settings.tune, maghrib: settings.tune.maghrib + 1 } })} />
        <TuneChoice label="Isha -1" onPress={() => update({ tune: { ...settings.tune, isha: settings.tune.isha - 1 } })} />
        <TuneChoice label="Isha +1" onPress={() => update({ tune: { ...settings.tune, isha: settings.tune.isha + 1 } })} />
      </View>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: selected ? "#0A84FF" : "#CCC", backgroundColor: selected ? "#0A84FF22" : "transparent" }}>
      <Text style={{ color: selected ? "#0A84FF" : "#666" }}>{label}</Text>
    </Pressable>
  );
}

function TuneChoice({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#CCC" }}>
      <Text style={{ color: "#666" }}>{label}</Text>
    </Pressable>
  );
}


