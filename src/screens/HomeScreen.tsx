import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LevelCard from '../components/LevelCard';
import { useGameState } from '../hooks/useGameState';
import levelsData from '../data/levels/levels.json';
import { Level } from '../types/scenario';
import { Colors, Typography, Spacing } from '../theme';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { isLevelCompleted, isLevelUnlocked, cyberPoints } = useGameState();
  const levels = levelsData.levels as unknown as Level[];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>מגן דיגיטלי</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{cyberPoints} נק׳</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>למד להגן על עצמך מהונאות ברשת</Text>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {levels.map(level => (
          <LevelCard
            key={level.levelId}
            level={level}
            isCompleted={isLevelCompleted(level.levelId)}
            isUnlocked={isLevelUnlocked(level.levelId)}
            onPress={() => navigation.navigate('Simulation', { levelId: level.levelId })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  appTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.titleSize, color: Colors.text },
  pointsBadge: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  pointsText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.surface },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.locked, textAlign: 'right', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  scrollContent: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
});
