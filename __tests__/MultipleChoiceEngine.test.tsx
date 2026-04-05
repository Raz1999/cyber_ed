import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MultipleChoiceEngine from '../src/features/simulations/engines/MultipleChoiceEngine';
import { MultipleChoiceScenario } from '../src/types/scenario';

const mockScenario: MultipleChoiceScenario = {
  id: 'test-mc',
  type: 'multipleChoice',
  title: 'Test',
  description: 'תיאור בדיקה',
  task: 'מה לעשות?',
  points: 100,
  icon: 'test',
  summaryTip: 'טיפ',
  options: [
    { id: 'o1', text: 'תשובה שגויה', isCorrect: false, feedback: 'משוב שגוי' },
    { id: 'o2', text: 'תשובה נכונה', isCorrect: true, feedback: 'משוב נכון' },
  ],
};

it('renders the task question', () => {
  const { getByText } = render(
    <MultipleChoiceEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={jest.fn()} />
  );
  expect(getByText('מה לעשות?')).toBeTruthy();
});

it('renders all answer options', () => {
  const { getByText } = render(
    <MultipleChoiceEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={jest.fn()} />
  );
  expect(getByText('תשובה שגויה')).toBeTruthy();
  expect(getByText('תשובה נכונה')).toBeTruthy();
});

it('calls onAnswer with correct result when correct option tapped', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={onAnswer} />
  );
  fireEvent.press(getByText('תשובה נכונה'));
  expect(onAnswer).toHaveBeenCalledWith({ isCorrect: true, feedbackText: 'משוב נכון' });
});

it('calls onAnswer with incorrect result when wrong option tapped', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={onAnswer} />
  );
  fireEvent.press(getByText('תשובה שגויה'));
  expect(onAnswer).toHaveBeenCalledWith({ isCorrect: false, feedbackText: 'משוב שגוי' });
});

it('does not call onAnswer when isEnabled is false', () => {
  const onAnswer = jest.fn();
  const { getByText } = render(
    <MultipleChoiceEngine scenario={mockScenario} attemptNumber={1} isEnabled={false} onAnswer={onAnswer} />
  );
  fireEvent.press(getByText('תשובה נכונה'));
  expect(onAnswer).not.toHaveBeenCalled();
});
