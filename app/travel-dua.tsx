import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';

const TRAVEL_DUAS = [
  {
    id: 'travel_start_1',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
    transliteration: 'Subhāna alladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn',
    translation: 'Glory be to Him who has subjected this to us, and we could never have it (by our efforts).',
    reference: 'Quran 43:13'
  },
  {
    id: 'travel_start_2',
    arabic: 'وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    transliteration: 'wa innā ilā rabbinā lamunqalibūn',
    translation: 'And surely, unto our Lord we are returning.',
    reference: 'Quran 43:14'
  },
  {
    id: 'travel_protection',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَٰذَا الْبِرَّ وَالتَّقْوَىٰ وَمِنَ الْعَمَلِ مَا تَرْضَىٰ',
    transliteration: 'Allāhumma innā nas\'aluka fī safarinā hādhā al-birra wa at-taqwā wa min al-\'amali mā tarḍā',
    translation: 'O Allah, we ask You for righteousness and piety in this journey of ours, and deeds that please You.',
    reference: 'Tirmidhi'
  }
];

export default function TravelDuaScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Travel Dua',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🚗</Text>
          <Text style={styles.title}>Travel Dua</Text>
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityText}>Safe Journey</Text>
          </View>
        </View>

        <View style={styles.duaCard}>
          <Text style={styles.duaLabel}>Dua for Travel</Text>
          <Text style={styles.duaArabic}>{TRAVEL_DUAS[0].arabic}</Text>
          <Text style={styles.duaTransliteration}>{TRAVEL_DUAS[0].transliteration}</Text>
          <Text style={styles.duaTranslation}>{TRAVEL_DUAS[0].translation}</Text>
        </View>

        <View style={styles.meaningCard}>
          <Text style={styles.meaningTitle}>Meaning & Context</Text>
          <Text style={styles.meaningText}>
            This beautiful supplication is recited when beginning a journey, acknowledging Allah's blessing
            in providing us with means of transportation.
          </Text>
          <Text style={styles.meaningText}>
            It reminds us that all conveniences we enjoy are gifts from Allah, and we should be grateful
            for His bounties.
          </Text>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>Reference</Text>
          <Text style={styles.referenceText}>
            {TRAVEL_DUAS[0].reference}
          </Text>
        </View>

        <View style={styles.additionalDuas}>
          <Text style={styles.additionalTitle}>Additional Travel Duas</Text>
          
          <View style={styles.additionalDuaCard}>
            <Text style={styles.additionalArabic}>{TRAVEL_DUAS[1].arabic}</Text>
            <Text style={styles.additionalTranslation}>
              {TRAVEL_DUAS[1].translation}
            </Text>
          </View>

          <View style={styles.additionalDuaCard}>
            <Text style={styles.additionalArabic}>{TRAVEL_DUAS[2].arabic}</Text>
            <Text style={styles.additionalTranslation}>
              {TRAVEL_DUAS[2].translation}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            May Allah grant you a safe and blessed journey
          </Text>
        </View>
      </ScrollView>
    </>
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
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
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








