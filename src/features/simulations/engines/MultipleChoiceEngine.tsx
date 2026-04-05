import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BaseSimulationProps } from './BaseSimulationProps';
import { MultipleChoiceScenario, MultipleChoiceOption } from '../../../types/scenario';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../../../theme';

export default function MultipleChoiceEngine({
  scenario,
  attemptNumber,
  isEnabled,
  onAnswer,
}: BaseSimulationProps) {
  const mc = scenario as MultipleChoiceScenario;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealCorrect, setRevealCorrect] = useState(false);

  // Reset when attemptNumber changes (Try Again pressed)
  useEffect(() => {
    setSelectedId(null);
    setRevealCorrect(false);
  }, [attemptNumber]);

  const handlePress = (option: MultipleChoiceOption) => {
    if (!isEnabled || selectedId !== null) return;
    setSelectedId(option.id);
    if (attemptNumber === 2 && !option.isCorrect) {
      setRevealCorrect(true);
    }
    onAnswer({ isCorrect: option.isCorrect, feedbackText: option.feedback });
  };

  const getOptionStyle = (option: MultipleChoiceOption) => {
    if (!selectedId) return styles.optionDefault;
    if (option.id === selectedId && option.isCorrect) return styles.optionCorrect;
    if (option.id === selectedId && !option.isCorrect) return styles.optionIncorrect;
    if (revealCorrect && option.isCorrect) return styles.optionReveal;
    return styles.optionDefault;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.task}>{mc.task}</Text>
      <View style={styles.optionsContainer}>
        {mc.options.map(option => (
          <Pressable
            key={option.id}
            style={[styles.optionBase, getOptionStyle(option), !isEnabled && styles.disabled]}
            onPress={() => handlePress(option)}
            accessibilityRole="button"
            accessibilityLabel={option.text}
            accessibilityState={{ disabled: !isEnabled }}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  task: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.subtitleSize,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  optionsContainer: { gap: Spacing.md },
  optionBase: {
    minHeight: TouchTarget.min,
    borderRadius: Radius.button,
    padding: Spacing.md,
    borderWidth: 2,
    justifyContent: 'center',
  },
  optionDefault: { backgroundColor: Colors.surface, borderColor: Colors.cardBorder },
  optionCorrect: { backgroundColor: '#E8F5E9', borderColor: Colors.success },
  optionIncorrect: { backgroundColor: '#FFF3E0', borderColor: Colors.accent },
  optionReveal: { backgroundColor: '#E8F5E9', borderColor: Colors.success, borderStyle: 'dashed' },
  disabled: { opacity: 0.6 },
  optionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.bodySize,
    color: Colors.text,
    textAlign: 'right',
  },
});
