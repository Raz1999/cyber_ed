import { renderHook, act } from '@testing-library/react-native';
import { useGameState } from '../src/hooks/useGameState';
import { useGameStore } from '../src/store/gameStore';

beforeEach(() => {
  useGameStore.setState({ cyberPoints: 0, completedLevelIds: [] });
});

it('level 1 is always unlocked', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelUnlocked(1)).toBe(true);
});

it('level 2 is locked until level 1 is complete', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelUnlocked(2)).toBe(false);
  act(() => result.current.completeLevel(1, 100));
  expect(result.current.isLevelUnlocked(2)).toBe(true);
});

it('isLevelCompleted returns false for incomplete levels', () => {
  const { result } = renderHook(() => useGameState());
  expect(result.current.isLevelCompleted(1)).toBe(false);
});

it('isLevelCompleted returns true after completion', () => {
  const { result } = renderHook(() => useGameState());
  act(() => result.current.completeLevel(1, 100));
  expect(result.current.isLevelCompleted(1)).toBe(true);
});

it('allLevelsComplete returns true when all levels done', () => {
  const { result } = renderHook(() => useGameState());
  act(() => {
    result.current.completeLevel(1, 100);
    result.current.completeLevel(2, 100);
    result.current.completeLevel(3, 100);
    result.current.completeLevel(4, 100);
    result.current.completeLevel(5, 100);
  });
  expect(result.current.allLevelsComplete(5)).toBe(true);
});
