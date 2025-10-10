import { useColorScheme } from "@/hooks/use-color-scheme";
import { PrayerTimesRepository } from "@/modules/prayer-times/data/repository";
import { TodayPrayerTimes } from "@/modules/prayer-times/domain/entities";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 40; // match container padding in Home

type PrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

type PrayerItem = { key: PrayerKey; timeIso: string };

export function PrayerCarousel() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [times, setTimes] = useState<TodayPrayerTimes | null>(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const repo = useMemo(() => new PrayerTimesRepository(), []);

  useEffect(() => {
    (async () => {
      try {
        const t = await repo.getToday();
        setTimes(t);
        const idx = computeCurrentIndex(t);
        setInitialIndex(idx);
      } catch {
        // ignore; component will render nothing
      }
    })();
  }, []);

  const data: PrayerItem[] = useMemo(() => {
    if (!times) return [];
    return [
      { key: "Fajr", timeIso: times.fajr.timeIso },
      { key: "Dhuhr", timeIso: times.dhuhr.timeIso },
      { key: "Asr", timeIso: (times as any).asrMithl1?.timeIso ?? times.asrMithl2.timeIso },
      { key: "Maghrib", timeIso: times.maghrib.timeIso },
      { key: "Isha", timeIso: times.isha.timeIso },
    ];
  }, [times]);

  if (!times) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
        },
      ]}
    >
      <Animated.FlatList
        data={data}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 }}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
        initialScrollIndex={initialIndex}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => (
          <CarouselItem
            index={index}
            label={item.key}
            time={formatTime(item.timeIso)}
            scrollX={scrollX}
          />
        )}
      />
    </View>
  );
}

function CarouselItem({ index, label, time, scrollX }: { index: number; label: string; time: string; scrollX: Animated.Value }) {
  const inputRange = [
    (index - 1) * CARD_WIDTH,
    index * CARD_WIDTH,
    (index + 1) * CARD_WIDTH,
  ];
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: "clamp" });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: "clamp" });
  const shadow = scrollX.interpolate({ inputRange, outputRange: [0, 8, 0], extrapolate: "clamp" });

  return (
    <Animated.View style={{ width: CARD_WIDTH, alignItems: "center", transform: [{ scale }], opacity }}>
      <Animated.View style={[styles.centerChip, { shadowOpacity: 0.12, shadowRadius: shadow as any }] }>
        <Text style={styles.centerTitle}>{label}</Text>
        <Text style={styles.centerTime}>{time}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function computeCurrentIndex(t: TodayPrayerTimes): number {
  const order: { key: PrayerKey; iso: string }[] = [
    { key: "Fajr", iso: t.fajr.timeIso },
    { key: "Dhuhr", iso: t.dhuhr.timeIso },
    { key: "Asr", iso: (t as any).asrMithl1?.timeIso ?? t.asrMithl2.timeIso },
    { key: "Maghrib", iso: t.maghrib.timeIso },
    { key: "Isha", iso: t.isha.timeIso },
  ];
  const now = Date.now();
  let idx = 0;
  for (let i = 0; i < order.length; i++) {
    const d = Date.parse(order[i].iso);
    if (now >= d) idx = i;
  }
  return idx;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  centerChip: {
    width: CARD_WIDTH - 32,
    paddingVertical: 20,
    alignItems: "center",
  },
  centerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  centerTime: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: -0.5,
  },
});


