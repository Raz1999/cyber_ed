import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Level } from '../types/scenario';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

interface LevelCardProps {
  level: Level;
  isCompleted: boolean;
  isUnlocked: boolean;
  onPress: () => void;
}

export default function LevelCard({ level, isCompleted, isUnlocked, onPress }: LevelCardProps) {
  const buttonLabel = isCompleted ? 'שחק שוב' : isUnlocked ? 'התחל' : '🔒 נעול';

  return (
    <Pressable
      style={[styles.card, isCompleted && styles.cardCompleted, !isUnlocked && styles.cardLocked]}
      onPress={isUnlocked ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${level.scenario.title}${isCompleted ? ', נלמד' : !isUnlocked ? ', נעול' : ''}`}
      accessibilityState={{ disabled: !isUnlocked }}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
            {level.scenario.title}
          </Text>
          <Text style={[styles.description, !isUnlocked && styles.lockedText]} numberOfLines={2}>
            {level.scenario.description}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ נלמד</Text>
            </View>
          )}
          {!isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
          <Text style={styles.levelNumber}>{level.levelId}</Text>
        </View>
      </View>
      <Pressable
        style={[styles.button, !isUnlocked && styles.buttonDisabled]}
        onPress={isUnlocked ? onPress : undefined}
        disabled={!isUnlocked}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Text style={[styles.buttonText, !isUnlocked && styles.buttonTextDisabled]}>
          {buttonLabel}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: { borderColor: Colors.success },
  cardLocked: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  info: { flex: 1 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.text, textAlign: 'right', marginBottom: Spacing.xs },
  description: { fontFamily: Typography.fontFamily, fontSize: Typography.captionSize, color: Colors.locked, textAlign: 'right', lineHeight: 20 },
  lockedText: { color: Colors.locked },
  badgeContainer: { alignItems: 'center', gap: Spacing.xs },
  completedBadge: { backgroundColor: '#E8F5E9', borderRadius: Radius.badge, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  completedBadgeText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.captionSize, color: Colors.success },
  lockIcon: { fontSize: 20 },
  levelNumber: { fontFamily: Typography.fontFamilyBold, fontSize: 28, color: Colors.primary },
  button: { backgroundColor: Colors.primary, borderRadius: Radius.button, minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.surface },
  buttonTextDisabled: { color: Colors.surface },
});
