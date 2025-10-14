import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { RainAlertStorage } from '../services/rain-alert-storage';
import { RainAlertService } from '../services/rain-alert-service';
import { RainAlertCooldown } from '../services/rain-alert-cooldown';
import {
  RainAlertSettings,
  MIN_LEAD_TIME_MINUTES,
  MAX_LEAD_TIME_MINUTES,
} from '../types/rain-alerts';

export default function RainAlertSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<RainAlertSettings | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    loadSettings();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await RainAlertStorage.getSettings();
      setSettings(loaded);
      await updateCooldown();
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCooldown = async () => {
    const remaining = await RainAlertCooldown.getRemainingCooldown();
    setCooldownRemaining(remaining);
  };

  const updateSetting = async <K extends keyof RainAlertSettings>(
    key: K,
    value: RainAlertSettings[K]
  ) => {
    if (!settings) return;

    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await RainAlertStorage.saveSettings({ [key]: value });

      if (key === 'enabled') {
        if (value) {
          await RainAlertService.enable();
        } else {
          await RainAlertService.disable();
        }
      } else if (['leadTimeMinutes', 'intensityThreshold'].includes(key)) {
        await RainAlertService.updateSettings();
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const testNotification = async () => {
    try {
      const check = await RainAlertCooldown.shouldShowAlert();
      
      if (!check.allowed) {
        Alert.alert('Test Blocked', check.reason || 'Cannot show notification at this time');
        return;
      }

      const payload = await RainAlertService['simulateRainAlert']?.() || {
        type: 'RAIN_START' as const,
        leadMinutes: 0,
        intensity: 'moderate' as const,
        phrase: 'Rain has started nearby',
        dua: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
      };

      await RainAlertService.showRainAlert(payload);
      Alert.alert('Test Sent', 'Check your notifications');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rain Alerts',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Enable Rain Alerts</Text>
              <Text style={styles.description}>
                Get notified when rain starts with a dua reminder
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: '#767577', true: '#3B82F6' }}
              thumbColor={settings.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alert Settings</Text>

              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.label}>Lead Time</Text>
                  <Text style={styles.value}>{settings.leadTimeMinutes} min</Text>
                </View>
                <Text style={styles.description}>
                  Get notified before rain starts (0 = when it starts)
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={MIN_LEAD_TIME_MINUTES}
                  maximumValue={MAX_LEAD_TIME_MINUTES}
                  step={5}
                  value={settings.leadTimeMinutes}
                  onSlidingComplete={(value) => updateSetting('leadTimeMinutes', value)}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Intensity Threshold</Text>
                <Text style={styles.description}>Minimum rain intensity for alerts</Text>
                <View style={styles.buttonGroup}>
                  {['any', 'light+', 'moderate+'].map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.button,
                        settings.intensityThreshold === threshold && styles.buttonActive,
                      ]}
                      onPress={() =>
                        updateSetting('intensityThreshold', threshold as any)
                      }
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          settings.intensityThreshold === threshold &&
                            styles.buttonTextActive,
                        ]}
                      >
                        {threshold === 'any'
                          ? 'Any'
                          : threshold === 'light+'
                          ? 'Light+'
                          : 'Moderate+'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rate Limiting</Text>

              <View style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>One Alert per Hour</Text>
                  <Text style={styles.description}>
                    Limit to at most one notification every 60 minutes
                  </Text>
                </View>
                <Switch
                  value={settings.onePerHourEnabled}
                  onValueChange={(value) => updateSetting('onePerHourEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3B82F6' }}
                  thumbColor={settings.onePerHourEnabled ? '#fff' : '#f4f3f4'}
                />
              </View>

              {cooldownRemaining > 0 && (
                <View style={styles.cooldownInfo}>
                  <Text style={styles.cooldownText}>
                    Next alert available in: {formatTime(cooldownRemaining)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quiet Hours</Text>

              <View style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Enable Quiet Hours</Text>
                  <Text style={styles.description}>
                    Suppress alerts during nighttime hours
                  </Text>
                </View>
                <Switch
                  value={settings.quietHoursEnabled}
                  onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3B82F6' }}
                  thumbColor={settings.quietHoursEnabled ? '#fff' : '#f4f3f4'}
                />
              </View>

              {settings.quietHoursEnabled && (
                <View style={styles.timeRange}>
                  <Text style={styles.timeText}>
                    {settings.quietHoursStart} - {settings.quietHoursEnd}
                  </Text>
                  <Text style={styles.description}>
                    Alerts will be silently queued during these hours
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <TouchableOpacity style={styles.testButton} onPress={testNotification}>
                <Text style={styles.testButtonText}>Send Test Notification</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>How it Works</Text>
              <Text style={styles.infoText}>
                • Uses coarse location tiles (~1 km) for privacy{'\n'}
                • Minimal battery impact with smart updates{'\n'}
                • Backend monitors weather conditions{'\n'}
                • Sends push notification when rain starts{'\n'}
                • Includes dua: اللَّهُمَّ صَيِّبًا نَافِعًا
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  sliderContainer: {
    paddingVertical: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 8,
  },
  pickerContainer: {
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  buttonTextActive: {
    color: '#fff',
  },
  cooldownInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  cooldownText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  timeRange: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 22,
  },
});

