import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min(Math.max(current / total, 0), 1);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%` as any }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginHorizontal: 16, marginBottom: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: Colors.secondary, borderRadius: 4 },
});
