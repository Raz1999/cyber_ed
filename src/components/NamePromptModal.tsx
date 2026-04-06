import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Colors, Typography, Spacing, Radius, TouchTarget } from '../theme';

const RANDOM_NAMES = ['דוד', 'שרה', 'משה', 'רחל', 'יעל', 'אסף', 'נעמה', 'עמי', 'תמר', 'אורי', 'נועה', 'גיל'];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function NamePromptModal() {
  const playerName = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const [input, setInput] = useState('');

  const handleSave = () => {
    const name = input.trim() || pickRandom(RANDOM_NAMES);
    setPlayerName(name);
  };

  const handleRandom = () => {
    setInput(pickRandom(RANDOM_NAMES));
  };

  return (
    <Modal visible={playerName === null} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🛡️</Text>
          <Text style={styles.title}>ברוך הבא!</Text>
          <Text style={styles.subtitle}>איך לקרוא לך?</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="הכנס שם..."
            placeholderTextColor={Colors.locked}
            textAlign="right"
            maxLength={20}
            autoFocus
          />
          <Pressable style={styles.randomButton} onPress={handleRandom}>
            <Text style={styles.randomText}>🎲 בחר שם אקראי</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>בואו נתחיל!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(58,0,102,0.7)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: Spacing.xl, width: '100%', maxWidth: 380, alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 56 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: 28, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.locked, textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    padding: Spacing.md,
    fontSize: Typography.bodySize,
    fontFamily: Typography.fontFamily,
    color: Colors.text,
    minHeight: TouchTarget.min,
    textAlign: 'right',
  },
  randomButton: { paddingVertical: Spacing.sm },
  randomText: { fontFamily: Typography.fontFamily, fontSize: Typography.bodySize, color: Colors.primary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: Radius.button, minHeight: TouchTarget.min, width: '100%', alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.subtitleSize, color: Colors.surface },
});
