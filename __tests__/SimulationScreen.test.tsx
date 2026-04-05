import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SimulationScreen from '../src/features/simulations/SimulationScreen';
import { useGameStore } from '../src/store/gameStore';

jest.mock('../src/data/levels/levels.json', () => ({
  levels: [
    {
      levelId: 1,
      isCompleted: false,
      scenario: {
        id: 'sc-1',
        type: 'multipleChoice',
        title: 'Test Level',
        description: 'תיאור',
        task: 'מה לעשות?',
        points: 100,
        icon: 'test',
        summaryTip: 'טיפ',
        options: [
          { id: 'o1', text: 'נכון', isCorrect: true, feedback: 'מצוין' },
          { id: 'o2', text: 'שגוי', isCorrect: false, feedback: 'לא נכון' },
        ],
      },
    },
  ],
}));

// Mock FeedbackOverlay to avoid Modal issues in test
jest.mock('../src/components/FeedbackOverlay', () => {
  const { View, Text, Pressable } = require('react-native');
  return ({ visible, feedbackText, attemptNumber, isCorrect, onContinue, onTryAgain, summaryTip }: any) => {
    if (!visible) return null;
    return (
      <View testID="feedback-overlay">
        <Text>{feedbackText}</Text>
        {summaryTip && <Text>{summaryTip}</Text>}
        {!isCorrect && attemptNumber === 1
          ? <Pressable onPress={onTryAgain}><Text>נסה שוב</Text></Pressable>
          : <Pressable onPress={onContinue}><Text>המשך</Text></Pressable>
        }
      </View>
    );
  };
});

const Stack = createStackNavigator();
const TestWrapper = ({ levelId = 1 }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Simulation" component={SimulationScreen} initialParams={{ levelId }} />
    </Stack.Navigator>
  </NavigationContainer>
);

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

it('renders the scenario task question', async () => {
  const { findByText } = render(<TestWrapper />);
  expect(await findByText('מה לעשות?')).toBeTruthy();
});

it('shows FeedbackOverlay after answer selected', async () => {
  const { findByText } = render(<TestWrapper />);
  fireEvent.press(await findByText('נכון'));
  expect(await findByText('מצוין')).toBeTruthy();
});

it('shows נסה שוב on first wrong answer', async () => {
  const { findByText } = render(<TestWrapper />);
  fireEvent.press(await findByText('שגוי'));
  expect(await findByText('נסה שוב')).toBeTruthy();
});
