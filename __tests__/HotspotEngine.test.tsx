import React from 'react';
import { render } from '@testing-library/react-native';
import HotspotEngine, { findHotspotHit, extractNormalizedTapCoords } from '../src/features/simulations/engines/HotspotEngine';
import { HotspotScenario, Hotspot } from '../src/types/scenario';

const hotspots: Hotspot[] = [
  {
    id: 'hs-url',
    label: 'קישור',
    region: { x: 0.0, y: 0.6, width: 1.0, height: 0.3 },
    isCorrect: true,
    feedback: 'משוב נכון',
  },
];

const mockScenario: HotspotScenario = {
  id: 'test-hs',
  type: 'hotspot',
  title: 'Test',
  description: 'הודעת SMS מזויפת',
  task: 'לחץ על הקישור החשוד',
  points: 100,
  icon: 'test',
  summaryTip: 'טיפ',
  imageAsset: '',
  imageAltText: 'תיאור תמונה',
  hotspots,
  missedFeedback: 'פספסת',
};

// Unit test the pure coordinate function
describe('findHotspotHit', () => {
  it('returns hotspot when tap is inside region', () => {
    const hit = findHotspotHit(hotspots, 0.5, 0.75);
    expect(hit?.id).toBe('hs-url');
  });

  it('returns null when tap is outside all regions', () => {
    const hit = findHotspotHit(hotspots, 0.5, 0.1);
    expect(hit).toBeNull();
  });

  it('returns hotspot when tap is on boundary (inclusive)', () => {
    const hit = findHotspotHit(hotspots, 0.0, 0.6);
    expect(hit).not.toBeNull();
  });
});

describe('extractNormalizedTapCoords — native path', () => {
  it('normalizes locationX/Y against layout dimensions', () => {
    const event = { nativeEvent: { locationX: 50, locationY: 75 } };
    const layout = { width: 200, height: 300 };
    const ref = { current: null }; // native path: ref not used
    const result = extractNormalizedTapCoords(event, layout, ref);
    expect(result.tapX).toBeCloseTo(0.25);
    expect(result.tapY).toBeCloseTo(0.25);
  });

  it('returns 0 for a tap at the top-left corner', () => {
    const event = { nativeEvent: { locationX: 0, locationY: 0 } };
    const layout = { width: 100, height: 100 };
    const ref = { current: null };
    const result = extractNormalizedTapCoords(event, layout, ref);
    expect(result.tapX).toBe(0);
    expect(result.tapY).toBe(0);
  });
});

// Component smoke tests
it('renders the task instruction', () => {
  const { getByText } = render(
    <HotspotEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={jest.fn()} />
  );
  expect(getByText('לחץ על הקישור החשוד')).toBeTruthy();
});

it('renders message content', () => {
  const { getByText } = render(
    <HotspotEngine scenario={mockScenario} attemptNumber={1} isEnabled={true} onAnswer={jest.fn()} />
  );
  expect(getByText('הודעת SMS מזויפת')).toBeTruthy();
});
