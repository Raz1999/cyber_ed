import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  cyberPoints: number;
  completedLevelIds: number[];
  playerName: string | null;
  completeLevel: (levelId: number, pointsEarned: number) => void;
  resetProgress: () => void;
  setPlayerName: (name: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      cyberPoints: 0,
      completedLevelIds: [],
      playerName: null,

      completeLevel: (levelId, pointsEarned) => {
        if (get().completedLevelIds.includes(levelId)) return;
        set(state => ({
          cyberPoints: state.cyberPoints + pointsEarned,
          completedLevelIds: [...state.completedLevelIds, levelId],
        }));
      },

      // resetProgress does NOT reset playerName — intentional
      resetProgress: () => set({ cyberPoints: 0, completedLevelIds: [] }),

      setPlayerName: (name) => set({ playerName: name }),
    }),
    {
      name: 'cyber-ed-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
