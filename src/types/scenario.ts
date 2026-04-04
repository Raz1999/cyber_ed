// src/types/scenario.ts

export interface BaseScenario {
  id: string;
  type: 'hotspot' | 'multipleChoice';
  title: string;
  description: string;
  task: string;
  points: number;
  icon: string;
  summaryTip: string;
}

export interface HotspotRegion {
  x: number;       // 0–1, fraction of container width from physical left edge
  y: number;       // 0–1, fraction of container height from physical top edge
  width: number;   // 0–1 fraction
  height: number;  // 0–1 fraction
}

export interface Hotspot {
  id: string;
  label: string;
  region: HotspotRegion;
  isCorrect: boolean;
  feedback: string;
}

export interface HotspotScenario extends BaseScenario {
  type: 'hotspot';
  imageAsset: string;       // Path to PNG mockup (Phase 2); empty string uses styled View
  imageAltText: string;     // accessibilityLabel for screen readers
  hotspots: Hotspot[];
  missedFeedback: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface MultipleChoiceScenario extends BaseScenario {
  type: 'multipleChoice';
  options: MultipleChoiceOption[];
}

export type Scenario = HotspotScenario | MultipleChoiceScenario;

export interface Level {
  levelId: number;
  scenario: Scenario;
  isCompleted: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  feedbackText: string;
}
