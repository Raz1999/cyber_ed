import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../theme';

interface ProgressBarProps {
  current: number;   // 0–total
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progress * 100}%` as any }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
  },
});
