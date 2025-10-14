import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { RAIN_DUA_AR, RAIN_DUA_EN, RainIntensity } from '../types/rain-alerts';

export default function RainDuaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const intensity = (params.intensity as RainIntensity) || 'moderate';
  const leadMinutes = parseInt(params.leadMinutes as string) || 0;

  const getIntensityColor = (intensity: RainIntensity): string => {
    switch (intensity) {
      case 'light':
        return '#60A5FA';
      case 'moderate':
        return '#3B82F6';
      case 'heavy':
        return '#1D4ED8';
      default:
        return '#3B82F6';
    }
  };

  const getIntensityEmoji = (intensity: RainIntensity): string => {
    switch (intensity) {
      case 'light':
        return '🌦️';
      case 'moderate':
        return '🌧️';
      case 'heavy':
        return '⛈️';
      default:
        return '🌧️';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rain Dua',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{getIntensityEmoji(intensity)}</Text>
          <Text style={styles.title}>
            {leadMinutes > 0
              ? `Rain expected in ${leadMinutes} minutes`
              : 'Rain has started nearby'}
          </Text>
          <View
            style={[
              styles.intensityBadge,
              { backgroundColor: getIntensityColor(intensity) },
            ]}
          >
            <Text style={styles.intensityText}>
              {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Rain
            </Text>
          </View>
        </View>

        <View style={styles.duaCard}>
          <Text style={styles.duaLabel}>Dua for Rain</Text>
          <Text style={styles.duaArabic}>{RAIN_DUA_AR}</Text>
          <Text style={styles.duaTransliteration}>Allahumma sayyiban nafi'an</Text>
          <Text style={styles.duaTranslation}>{RAIN_DUA_EN}</Text>
        </View>

        <View style={styles.meaningCard}>
          <Text style={styles.meaningTitle}>Meaning & Context</Text>
          <Text style={styles.meaningText}>
            This beautiful supplication is recited when it rains, asking Allah for beneficial
            rain that brings goodness and blessings to the earth and its inhabitants.
          </Text>
          <Text style={styles.meaningText}>
            Rain is a mercy from Allah, and this dua is a way to recognize His blessings and
            seek His favor.
          </Text>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>Reference</Text>
          <Text style={styles.referenceText}>
            Narrated by Abu Dawood (5099) and authenticated by Al-Albani in Sahih Abu Dawood
          </Text>
        </View>

        <View style={styles.additionalDuas}>
          <Text style={styles.additionalTitle}>Additional Duas for Rain</Text>
          
          <View style={styles.additionalDuaCard}>
            <Text style={styles.additionalArabic}>اللَّهُمَّ اسْقِنَا غَيْثًا مُغِيثًا مَرِيئًا نَافِعًا غَيْرَ ضَارٍّ</Text>
            <Text style={styles.additionalTranslation}>
              "O Allah, send us beneficial rain, satisfying, wholesome, and non-harmful."
            </Text>
          </View>

          <View style={styles.additionalDuaCard}>
            <Text style={styles.additionalArabic}>اللَّهُمَّ حَوَالَيْنَا وَلَا عَلَيْنَا</Text>
            <Text style={styles.additionalTranslation}>
              "O Allah, around us and not upon us."
              {'\n'}
              (When rain becomes too heavy)
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
            May Allah accept our duas and grant us beneficial rain
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

