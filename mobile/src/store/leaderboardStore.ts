import { create } from 'zustand';
import type { LeaderboardEntry } from '@frigi/shared';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  lastFetched: number | null;
  setEntries: (entries: LeaderboardEntry[]) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  lastFetched: null,
  setEntries: (entries) => set({ entries, lastFetched: Date.now() }),
}));
