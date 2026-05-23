export type Sport = "football" | "cricket";

export type FootballState = {
  homeScore: number;
  awayScore: number;
};

export type CricketTeamState = {
  runs: number;
  wickets: number;
  overs: string;
  legalBalls: number;
  currentOver: CricketDeliveryEvent[];
  overHistory: string[];
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

export type FootballAction =
  | { sport: "football"; type: "home+1" | "home-1" | "away+1" | "away-1" }
  | { sport: "football"; type: "reset" };

export type CricketAction =
  | { sport: "cricket"; type: "addRuns"; team: "home" | "away"; runs: number }
  | { sport: "cricket"; type: "addWicket"; team: "home" | "away" }
  | {
      sport: "cricket";
      type: "setOvers";
      team: "home" | "away";
      overs: string;
    }
  | {
      sport: "cricket";
      type: "recordDelivery";
      team: "home" | "away";
      event: CricketDeliveryEvent;
    };

export type ScoreAction = FootballAction | CricketAction | string;

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
