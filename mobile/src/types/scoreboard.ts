export type Sport = "football" | "cricket";

export type FootballState = {
  homeScore: number;
  awayScore: number;
};

export type CricketDeliveryEvent =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "6"
  | "W"
  | "NB"
  | "WD";

export type CricketTeamState = {
  runs: number;
  wickets: number;
  overs: string;
  legalBalls: number;
  currentOver: CricketDeliveryEvent[];
  overHistory: string[];
};

export type CricketState = {
  home: CricketTeamState;
  away: CricketTeamState;
};

export type ScoreboardState = {
  roomId: string;
  matchName: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  football: FootballState;
  cricket: CricketState;
  liveEnabled: boolean;
  updatedAt: string;
};

export type MatchStatus = "live" | "finished";

export type MatchSummary = {
  roomId: string;
  matchName: string;
  sport: Sport;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

export type MatchRecord = MatchSummary & {
  state: ScoreboardState;
};
