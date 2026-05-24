import { create } from "zustand";
import type { ScoreboardState } from "@/types/scoreboard";

const initialScoreboard: ScoreboardState = {
  roomId: "default",
  matchName: "Default Match",
  sport: "football",
  homeTeam: "Home",
  awayTeam: "Away",
  football: { homeScore: 0, awayScore: 0 },
  cricket: {
    home: {
      runs: 0,
      wickets: 0,
      overs: "0.0",
      legalBalls: 0,
      currentOver: [],
      overHistory: [],
    },
    away: {
      runs: 0,
      wickets: 0,
      overs: "0.0",
      legalBalls: 0,
      currentOver: [],
      overHistory: [],
    },
  },
  liveEnabled: true,
  updatedAt: new Date(0).toISOString(),
};

type AppState = {
  connected: boolean;
  lastEvent: string;
  scoreboard: ScoreboardState;
  setConnected: (connected: boolean) => void;
  setLastEvent: (message: string) => void;
  setScoreboard: (scoreboard: ScoreboardState) => void;
};

export const useScoreboardStore = create<AppState>((set) => ({
  connected: false,
  lastEvent: "",
  scoreboard: initialScoreboard,
  setConnected: (connected) => set({ connected }),
  setLastEvent: (message) => set({ lastEvent: message }),
  setScoreboard: (scoreboard) => set({ scoreboard }),
}));
