import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  playerId: string | null;
  startTime: number | null;

  startSession: (sessionId: string | null, playerId: string | null) => void;
  endSession: () => void;
  getElapsedSeconds: () => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  playerId: null,
  startTime: null,

  startSession: (sessionId, playerId) =>
    set({ sessionId, playerId, startTime: Date.now() }),

  endSession: () => set({ sessionId: null, playerId: null, startTime: null }),

  getElapsedSeconds: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  },
}));
