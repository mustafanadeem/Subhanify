/**
 * Travel Feedback Modal
 * 
 * Allows users to provide feedback on travel detection accuracy
 * to help improve the system and measure false positive/negative rates.
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logUserFeedback } from "@/services/travel-analytics-service";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface TravelFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  detectedActivity: string;
  onFeedbackSubmitted?: () => void;
}

export default function TravelFeedbackModal({
  visible,
  onClose,
  detectedActivity,
  onFeedbackSubmitted,
}: TravelFeedbackModalProps) {
  const colorScheme = useColorScheme();
  const [selectedFeedback, setSelectedFeedback] = useState<'correct' | 'false_positive' | 'false_negative' | null>(null);
  const [actualActivity, setActualActivity] = useState('');
  const [userComment, setUserComment] = useState('');

  const handleSubmit = async () => {
    if (!selectedFeedback) return;

    let feedbackType: 'correct_detection' | 'false_positive' | 'false_negative' = 'correct_detection';
    
    if (selectedFeedback === 'false_positive') {
      feedbackType = 'false_positive';
    } else if (selectedFeedback === 'false_negative') {
      feedbackType = 'false_negative';
    }

    await logUserFeedback(
      feedbackType,
      actualActivity || detectedActivity,
      detectedActivity,
      userComment || undefined
    );

    // Reset form
    setSelectedFeedback(null);
    setActualActivity('');
    setUserComment('');
    
    onFeedbackSubmitted?.();
    onClose();
  };

  const handleClose = () => {
    setSelectedFeedback(null);
    setActualActivity('');
    setUserComment('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: Colors[colorScheme ?? "light"].text },
              ]}
            >
              Travel Detection Feedback
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={Colors[colorScheme ?? "light"].textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Detection Info */}
          <View style={styles.detectionInfo}>
            <Text
              style={[
                styles.detectionText,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              We detected: <Text style={{ fontWeight: "600" }}>{detectedActivity}</Text>
            </Text>
          </View>

          {/* Feedback Options */}
          <View style={styles.feedbackOptions}>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'correct' && {
                  backgroundColor: Colors[colorScheme ?? "light"].tint,
                },
                { borderColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={() => setSelectedFeedback('correct')}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={
                  selectedFeedback === 'correct'
                    ? 'white'
                    : Colors[colorScheme ?? "light"].tint
                }
              />
              <Text
                style={[
                  styles.feedbackButtonText,
                  {
                    color:
                      selectedFeedback === 'correct'
                        ? 'white'
                        : Colors[colorScheme ?? "light"].tint,
                  },
                ]}
              >
                Correct
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'false_positive' && {
                  backgroundColor: '#FF9500',
                },
                { borderColor: '#FF9500' },
              ]}
              onPress={() => setSelectedFeedback('false_positive')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={selectedFeedback === 'false_positive' ? 'white' : '#FF9500'}
              />
              <Text
                style={[
                  styles.feedbackButtonText,
                  {
                    color: selectedFeedback === 'false_positive' ? 'white' : '#FF9500',
                  },
                ]}
              >
                Wrong - I wasn't traveling
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'false_negative' && {
                  backgroundColor: '#FF3B30',
                },
                { borderColor: '#FF3B30' },
              ]}
              onPress={() => setSelectedFeedback('false_negative')}
            >
              <Ionicons
                name="alert-circle"
                size={20}
                color={selectedFeedback === 'false_negative' ? 'white' : '#FF3B30'}
              />
              <Text
                style={[
                  styles.feedbackButtonText,
                  {
                    color: selectedFeedback === 'false_negative' ? 'white' : '#FF3B30',
                  },
                ]}
              >
                Missed - I was traveling
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          {(selectedFeedback === 'false_positive' || selectedFeedback === 'false_negative') && (
            <View style={styles.additionalInfo}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                What were you actually doing?
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: Colors[colorScheme ?? "light"].text,
                    borderColor: Colors[colorScheme ?? "light"].textSecondary,
                    backgroundColor: Colors[colorScheme ?? "light"].background,
                  },
                ]}
                value={actualActivity}
                onChangeText={setActualActivity}
                placeholder="e.g., walking, sitting at home, on a bus..."
                placeholderTextColor={Colors[colorScheme ?? "light"].textSecondary}
              />
            </View>
          )}

          {/* Optional Comment */}
          {selectedFeedback && (
            <View style={styles.commentSection}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: Colors[colorScheme ?? "light"].text },
                ]}
              >
                Additional comments (optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.commentInput,
                  {
                    color: Colors[colorScheme ?? "light"].text,
                    borderColor: Colors[colorScheme ?? "light"].textSecondary,
                    backgroundColor: Colors[colorScheme ?? "light"].background,
                  },
                ]}
                value={userComment}
                onChangeText={setUserComment}
                placeholder="Any additional details..."
                placeholderTextColor={Colors[colorScheme ?? "light"].textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedFeedback
                  ? Colors[colorScheme ?? "light"].tint
                  : Colors[colorScheme ?? "light"].textSecondary,
              },
            ]}
            onPress={handleSubmit}
            disabled={!selectedFeedback}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text
            style={[
              styles.privacyNote,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Your feedback helps improve travel detection. All data is stored locally and anonymized.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  detectionInfo: {
    marginBottom: 20,
  },
  detectionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  feedbackOptions: {
    gap: 12,
    marginBottom: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  additionalInfo: {
    marginBottom: 16,
  },
  commentSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});




