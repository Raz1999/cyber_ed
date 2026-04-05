import { useGameStore } from '../store/gameStore';

export const useGameState = () => {
  const { cyberPoints, completedLevelIds, completeLevel, resetProgress } = useGameStore();

  const isLevelCompleted = (id: number): boolean =>
    completedLevelIds.includes(id);

  const isLevelUnlocked = (id: number): boolean =>
    id === 1 || isLevelCompleted(id - 1);

  const allLevelsComplete = (totalLevels: number): boolean =>
    completedLevelIds.length >= totalLevels;

  return {
    cyberPoints,
    isLevelCompleted,
    isLevelUnlocked,
    allLevelsComplete,
    completeLevel,
    resetProgress,
  };
};
