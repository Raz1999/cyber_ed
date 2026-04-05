import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  cyberPoints: number;
  completedLevelIds: number[];
  completeLevel: (levelId: number, pointsEarned: number) => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      cyberPoints: 0,
      completedLevelIds: [],

      completeLevel: (levelId, pointsEarned) => {
        if (get().completedLevelIds.includes(levelId)) return;
        set(state => ({
          cyberPoints: state.cyberPoints + pointsEarned,
          completedLevelIds: [...state.completedLevelIds, levelId],
        }));
      },

      resetProgress: () => set({ cyberPoints: 0, completedLevelIds: [] }),
    }),
    {
      name: 'cyber-ed-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
