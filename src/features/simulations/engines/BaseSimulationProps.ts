import { Scenario } from '../../../types/scenario';

export interface AnswerResult {
  isCorrect: boolean;
  feedbackText: string;
}

export interface BaseSimulationProps {
  scenario: Scenario;
  attemptNumber: 1 | 2;
  isEnabled: boolean;
  onAnswer: (result: AnswerResult) => void;
}
