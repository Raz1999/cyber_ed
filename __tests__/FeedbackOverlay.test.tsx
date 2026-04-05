import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FeedbackOverlay from '../src/components/FeedbackOverlay';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');
  const { View } = RN;
  RN.Modal = ({ children, visible }: any) => visible ? React.createElement(View, null, children) : null;
  return RN;
});

const baseProps = {
  visible: true,
  isCorrect: true,
  feedbackText: 'כל הכבוד!',
  summaryTip: 'טיפ זהב',
  attemptNumber: 1 as const,
  onContinue: jest.fn(),
  onTryAgain: jest.fn(),
};

it('renders feedback text when visible', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} />);
  expect(getByText('כל הכבוד!')).toBeTruthy();
});

it('shows המשך button on correct answer', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} isCorrect={true} />);
  expect(getByText('המשך')).toBeTruthy();
});

it('shows נסה שוב button on attempt 1 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} />
  );
  expect(getByText('נסה שוב')).toBeTruthy();
});

it('shows המשך on attempt 2 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={2} />
  );
  expect(getByText('המשך')).toBeTruthy();
});

it('shows summaryTip on success', () => {
  const { getByText } = render(<FeedbackOverlay {...baseProps} isCorrect={true} />);
  expect(getByText('טיפ זהב')).toBeTruthy();
});

it('shows summaryTip on attempt 2 incorrect', () => {
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={2} />
  );
  expect(getByText('טיפ זהב')).toBeTruthy();
});

it('does NOT show summaryTip on attempt 1 incorrect', () => {
  const { queryByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} />
  );
  expect(queryByText('טיפ זהב')).toBeNull();
});

it('calls onTryAgain when נסה שוב pressed', () => {
  const onTryAgain = jest.fn();
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={false} attemptNumber={1} onTryAgain={onTryAgain} />
  );
  fireEvent.press(getByText('נסה שוב'));
  expect(onTryAgain).toHaveBeenCalled();
});

it('calls onContinue when המשך pressed', () => {
  const onContinue = jest.fn();
  const { getByText } = render(
    <FeedbackOverlay {...baseProps} isCorrect={true} onContinue={onContinue} />
  );
  fireEvent.press(getByText('המשך'));
  expect(onContinue).toHaveBeenCalled();
});
