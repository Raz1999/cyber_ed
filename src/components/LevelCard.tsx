import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Level } from '../types/scenario';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

interface LevelCardProps {
  level: Level;
  isCompleted: boolean;
  isUnlocked: boolean;
  onPress: () => void;
}

const GRADIENT_ACTIVE: [string, string] = [Colors.primary, Colors.secondary];
const GRADIENT_COMPLETED: [string, string] = [Colors.secondary, Colors.secondary];

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
      {isUnlocked ? (
        <View style={styles.buttonWrapper}>
          <LinearGradient
            colors={isCompleted ? GRADIENT_COMPLETED : GRADIENT_ACTIVE}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </LinearGradient>
        </View>
      ) : (
        <View style={[styles.button, styles.buttonDisabled]}>
          <Text style={[styles.buttonText, styles.buttonTextDisabled]}>{buttonLabel}</Text>
        </View>
      )}
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
    shadowColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCompleted: { borderColor: Colors.secondary },
  cardLocked: { opacity: 0.6, backgroundColor: '#F5F5F5' },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  info: { flex: 1 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.text, textAlign: 'right', marginBottom: Spacing.xs },
  description: { fontFamily: Typography.fontFamily, fontSize: Typography.captionSize, color: Colors.locked, textAlign: 'right', lineHeight: 20 },
  lockedText: { color: Colors.locked },
  badgeContainer: { alignItems: 'center', gap: Spacing.xs },
  completedBadge: { backgroundColor: '#E0F7F4', borderRadius: Radius.badge, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  completedBadgeText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.captionSize, color: Colors.secondary },
  lockIcon: { fontSize: 20 },
  levelNumber: { fontFamily: Typography.fontFamilyBold, fontSize: 28, color: Colors.primary },
  buttonWrapper: { borderRadius: Radius.button, overflow: 'hidden', minHeight: TouchTarget.min },
  button: { minHeight: TouchTarget.min, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.surface },
  buttonTextDisabled: { color: Colors.surface },
});
