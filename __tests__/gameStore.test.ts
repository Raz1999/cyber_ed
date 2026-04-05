// Mock localStorage for Jest (jsdom)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { useGameStore } from '../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

describe('completeLevel', () => {
  it('awards points for a new completion', () => {
    useGameStore.getState().completeLevel(1, 100);
    expect(useGameStore.getState().cyberPoints).toBe(100);
  });

  it('adds levelId to completedLevelIds', () => {
    useGameStore.getState().completeLevel(1, 100);
    expect(useGameStore.getState().completedLevelIds).toContain(1);
  });

  it('is idempotent — completing same level twice does not double award', () => {
    useGameStore.getState().completeLevel(1, 100);
    useGameStore.getState().completeLevel(1, 50);
    expect(useGameStore.getState().cyberPoints).toBe(100);
    expect(useGameStore.getState().completedLevelIds.filter((id: number) => id === 1).length).toBe(1);
  });
});

describe('resetProgress', () => {
  it('clears all progress', () => {
    useGameStore.getState().completeLevel(1, 100);
    useGameStore.getState().completeLevel(2, 100);
    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().cyberPoints).toBe(0);
    expect(useGameStore.getState().completedLevelIds).toHaveLength(0);
  });
});
