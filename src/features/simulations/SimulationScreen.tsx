import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ENGINE_REGISTRY } from './SimulationRegistry';
import { AnswerResult } from './engines/BaseSimulationProps';
import FeedbackOverlay from '../../components/FeedbackOverlay';
import ProgressBar from '../../components/ProgressBar';
import { useGameState } from '../../hooks/useGameState';
import { useGameStore } from '../../store/gameStore';
import levelsData from '../../data/levels/levels.json';
import { Colors, Typography, Spacing, TouchTarget } from '../../theme';

const TOTAL_LEVELS = 5;
const FIRST_TRY_BONUS = 50;

type SimulationRouteProp = RouteProp<RootStackParamList, 'Simulation'>;
type SimulationNavProp = StackNavigationProp<RootStackParamList>;

export default function SimulationScreen() {
  const navigation = useNavigation<SimulationNavProp>();
  const route = useRoute<SimulationRouteProp>();
  const { levelId } = route.params;
  const { completeLevel, allLevelsComplete, cyberPoints } = useGameState();

  const levelData = (levelsData.levels as any[]).find(l => l.levelId === levelId);
  const scenario = levelData?.scenario;

  const [currentAttempt, setCurrentAttempt] = useState<1 | 2>(1);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  if (!scenario) return null;

  const EngineComponent = ENGINE_REGISTRY[scenario.type as keyof typeof ENGINE_REGISTRY];

  const handleAnswer = (result: AnswerResult) => {
    setLastResult(result);
    setIsOverlayVisible(true);
  };

  const handleTryAgain = () => {
    setIsOverlayVisible(false);
    setCurrentAttempt(2);
  };

  const handleContinue = () => {
    const wasFirstTry = currentAttempt === 1;
    const pointsEarned = lastResult?.isCorrect
      ? scenario.points + (wasFirstTry ? FIRST_TRY_BONUS : 0)
      : 0;
    completeLevel(levelId, pointsEarned);
    setIsOverlayVisible(false);
    if (allLevelsComplete(TOTAL_LEVELS)) {
      navigation.replace('Certificate', { totalPoints: useGameStore.getState().cyberPoints });
    } else {
      navigation.navigate('Home');
    }
  };

  const handleBack = () => {
    if (lastResult !== null) {
      Alert.alert(
        'לצאת מהתרגיל?',
        'ההתקדמות בתרגיל זה לא תישמר.',
        [
          { text: 'המשך תרגיל', style: 'cancel' },
          { text: 'צא', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backText}>→</Text>
        </Pressable>
        <Text style={styles.cyberPoints}>{cyberPoints} נק׳</Text>
      </View>
      <ProgressBar current={levelId - 1} total={TOTAL_LEVELS} />
      <Text style={styles.title}>{scenario.title}</Text>
      <Text style={styles.description}>{scenario.description}</Text>
      <View style={styles.engineContainer}>
        <EngineComponent
          scenario={scenario}
          attemptNumber={currentAttempt}
          isEnabled={!isOverlayVisible}
          onAnswer={handleAnswer}
        />
      </View>
      {lastResult && (
        <FeedbackOverlay
          visible={isOverlayVisible}
          isCorrect={lastResult.isCorrect}
          feedbackText={lastResult.feedbackText}
          summaryTip={scenario.summaryTip}
          attemptNumber={currentAttempt}
          onContinue={handleContinue}
          onTryAgain={handleTryAgain}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget.min,
    backgroundColor: Colors.headerBg,
  },
  backButton: { minWidth: TouchTarget.min, minHeight: TouchTarget.min, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF' },
  cyberPoints: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.bodySize, color: Colors.points },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.titleSize, color: Colors.text, textAlign: 'right', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  description: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.text, textAlign: 'right', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, lineHeight: 28 },
  engineContainer: { flex: 1 },
});
