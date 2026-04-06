import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  feedbackText: string;
  summaryTip: string;
  attemptNumber: 1 | 2;
  onContinue: () => void;
  onTryAgain: () => void;
}

export default function FeedbackOverlay({
  visible,
  isCorrect,
  feedbackText,
  summaryTip,
  attemptNumber,
  onContinue,
  onTryAgain,
}: FeedbackOverlayProps) {
  const showTryAgain = !isCorrect && attemptNumber === 1;
  const showSummaryTip = isCorrect || attemptNumber === 2;
  const headerColor = isCorrect ? Colors.success : Colors.accent;
  const headerText = isCorrect ? '✓ כל הכבוד!' : 'נסו שוב';

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={[styles.header, { backgroundColor: headerColor }]}>
            <Text style={styles.headerText}>{headerText}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
            {showSummaryTip && (
              <View style={styles.tipContainer}>
                <Text style={styles.tipLabel}>💡 טיפ זהב</Text>
                <Text style={styles.tipText}>{summaryTip}</Text>
              </View>
            )}
            {showTryAgain ? (
              <Pressable style={styles.buttonSecondary} onPress={onTryAgain}>
                <Text style={styles.buttonSecondaryText}>נסה שוב</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.buttonPrimary} onPress={onContinue}>
                <Text style={styles.buttonPrimaryText}>המשך</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(58,0,102,0.5)' },
  sheet: { backgroundColor: '#FAF5FF', borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card, overflow: 'hidden' },
  header: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  headerText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.titleSize, color: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.md },
  feedbackText: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.text, textAlign: 'right', lineHeight: 28 },
  tipContainer: { backgroundColor: '#FFF8E1', borderRadius: Radius.card, padding: Spacing.md, borderRightWidth: 4, borderRightColor: '#FFC107' },
  tipLabel: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.text, textAlign: 'right', marginBottom: Spacing.xs },
  tipText: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.text, textAlign: 'right', lineHeight: 26 },
  buttonPrimary: { backgroundColor: Colors.primary, borderRadius: Radius.button, minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  buttonPrimaryText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.surface },
  buttonSecondary: { backgroundColor: Colors.accent, borderRadius: Radius.button, minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  buttonSecondaryText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.surface },
});
