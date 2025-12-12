import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DuaItem } from "@/types/adhkar";
import { getDuasByCategory } from "@/utils/adhkar-utils";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useEffect, useState, useLayoutEffect } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DuaDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Get the category from params
  const categoryTitle = (params.title as string) || "Home";
  const categoryKey = (params.category as string)?.toLowerCase() || "home";
  const initialIndex = params.initialIndex ? parseInt(params.initialIndex as string, 10) : 0;

  // State for duas list
  const [duasList, setDuasList] = useState<DuaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Set navigation options once
  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryTitle,
      headerBackTitle: 'Back',
      presentation: 'modal',
    });
  }, [navigation, categoryTitle]);

  useEffect(() => {
    const loadDuasList = () => {
      try {
        setIsLoading(true);
        const list = getDuasByCategory(categoryKey);
        setDuasList(list);
      } catch (error) {
        console.error("Error loading duas:", error);
        setDuasList([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDuasList();
  }, [categoryKey]);

  const currentDua: DuaItem | undefined = duasList[currentIndex];

  const nextDua = () => {
    if (currentIndex < duasList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousDua = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading || !currentDua || duasList.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F0F9FF', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F0F9FF' }]}>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]} onPress={() => router.back()}>
        <Text style={[styles.backArrow, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>←</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
      >
        {duasList.map((dua, index) => (
          <ScrollView key={`${dua.id}-${index}`} style={styles.duaPage} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.categoryTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>{categoryTitle}</Text>
              <Text style={[styles.title, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>{dua.title}</Text>
              <View style={[styles.countBadge, { backgroundColor: isDark ? '#1E40AF' : '#3B82F6' }]}>
                <Text style={styles.countText}>
                  {index + 1} of {duasList.length}
                </Text>
              </View>
            </View>

            <View style={[styles.duaCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
              <Text style={[styles.duaLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Dua</Text>
              <Text style={[styles.duaArabic, { color: isDark ? '#E0F2FE' : '#0C4A6E' }]}>{dua.arabic}</Text>
              <Text style={[styles.duaTransliteration, { color: isDark ? '#94A3B8' : '#475569' }]}>{dua.transliteration}</Text>
              <Text style={[styles.duaTranslation, { color: isDark ? '#CBD5E1' : '#1E293B' }]}>{dua.translation}</Text>
            </View>

            <View style={[styles.referenceCard, { backgroundColor: isDark ? '#422006' : '#FEF3C7' }]}>
              <Text style={[styles.referenceTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>Reference</Text>
              <Text style={[styles.referenceText, { color: isDark ? '#FCD34D' : '#78350F' }]}>{dua.reference}</Text>
            </View>

            {dua.commentary && (
              <View style={[styles.meaningCard, { backgroundColor: isDark ? '#0A0A0A' : '#EFF6FF' }]}>
                <Text style={[styles.meaningTitle, { color: isDark ? '#60A5FA' : '#1E40AF' }]}>Commentary</Text>
                <Text style={[styles.meaningText, { color: isDark ? '#93C5FD' : '#1E3A8A' }]}>{dua.commentary}</Text>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                May Allah accept our duas
              </Text>
            </View>
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backArrow: {
    fontSize: 24,
    color: '#0C4A6E',
    fontWeight: '600',
  },
  duaPage: {
    width: SCREEN_WIDTH,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C4A6E',
    textAlign: 'center',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
  },
  countText: {
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
