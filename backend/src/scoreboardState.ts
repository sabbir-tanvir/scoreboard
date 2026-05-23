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
  overs: string; // e.g. "12.3"
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

function createCricketTeamState(): CricketTeamState {
  return {
    runs: 0,
    wickets: 0,
    overs: "0.0",
    legalBalls: 0,
    currentOver: [],
    overHistory: [],
  };
}

function buildOvers(legalBalls: number): string {
  const over = Math.floor(legalBalls / 6);
  const ball = legalBalls % 6;
  return `${over}.${ball}`;
}

function applyCricketDelivery(
  team: CricketTeamState,
  event: CricketDeliveryEvent,
): CricketTeamState {
  let nextRuns = team.runs;
  let nextWickets = team.wickets;
  let nextLegalBalls = team.legalBalls;
  const nextCurrentOver = [...team.currentOver, event];
  const nextOverHistory = [...team.overHistory];

  if (event === "NB" || event === "WD") {
    nextRuns += 1;
  } else if (event === "W") {
    nextWickets = Math.min(10, nextWickets + 1);
    nextLegalBalls += 1;
  } else {
    nextRuns += Number(event);
    nextLegalBalls += 1;
  }

  let currentOver = nextCurrentOver;
  if (nextLegalBalls > 0 && nextLegalBalls % 6 === 0) {
    nextOverHistory.push(nextCurrentOver.join(" - "));
    currentOver = [];
  }

  return {
    ...team,
    runs: nextRuns,
    wickets: nextWickets,
    legalBalls: nextLegalBalls,
    overs: buildOvers(nextLegalBalls),
    currentOver,
    overHistory: nextOverHistory,
  };
}

let scoreboardState: ScoreboardState = {
  roomId: "default",
  matchName: "Default Match",
  sport: "football",
  homeTeam: "Home",
  awayTeam: "Away",
  football: {
    homeScore: 0,
    awayScore: 0,
  },
  cricket: {
    home: createCricketTeamState(),
    away: createCricketTeamState(),
  },
  liveEnabled: true,
  updatedAt: new Date().toISOString(),
};

export function createInitialScoreboardState(): ScoreboardState {
  return {
    roomId: "default",
    matchName: "Default Match",
    sport: "football",
    homeTeam: "Home",
    awayTeam: "Away",
    football: {
      homeScore: 0,
      awayScore: 0,
    },
    cricket: {
      home: createCricketTeamState(),
      away: createCricketTeamState(),
    },
    liveEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export function cloneScoreboardState(state: ScoreboardState): ScoreboardState {
  return {
    ...state,
    football: {
      ...state.football,
    },
    cricket: {
      home: {
        ...state.cricket.home,
        currentOver: [...state.cricket.home.currentOver],
        overHistory: [...state.cricket.home.overHistory],
      },
      away: {
        ...state.cricket.away,
        currentOver: [...state.cricket.away.currentOver],
        overHistory: [...state.cricket.away.overHistory],
      },
    },
  };
}

export function setScoreboardState(nextState: ScoreboardState): void {
  scoreboardState = cloneScoreboardState(nextState);
}

export function getScoreboardState(): ScoreboardState {
  return { ...scoreboardState };
}

function touch() {
  scoreboardState = { ...scoreboardState, updatedAt: new Date().toISOString() };
}

function applyFootballStringAction(action: string): boolean {
  if (action === "home+1") {
    scoreboardState = {
      ...scoreboardState,
      football: {
        ...scoreboardState.football,
        homeScore: scoreboardState.football.homeScore + 1,
      },
    };
    return true;
  }

  if (action === "home-1") {
    scoreboardState = {
      ...scoreboardState,
      football: {
        ...scoreboardState.football,
        homeScore: Math.max(0, scoreboardState.football.homeScore - 1),
      },
    };
    return true;
  }

  if (action === "away+1") {
    scoreboardState = {
      ...scoreboardState,
      football: {
        ...scoreboardState.football,
        awayScore: scoreboardState.football.awayScore + 1,
      },
    };
    return true;
  }

  if (action === "away-1") {
    scoreboardState = {
      ...scoreboardState,
      football: {
        ...scoreboardState.football,
        awayScore: Math.max(0, scoreboardState.football.awayScore - 1),
      },
    };
    return true;
  }

  return false;
}

function applyFootballStringActionToState(
  state: ScoreboardState,
  action: string,
): ScoreboardState | null {
  if (action === "home+1") {
    return {
      ...state,
      football: {
        ...state.football,
        homeScore: state.football.homeScore + 1,
      },
    };
  }

  if (action === "home-1") {
    return {
      ...state,
      football: {
        ...state.football,
        homeScore: Math.max(0, state.football.homeScore - 1),
      },
    };
  }

  if (action === "away+1") {
    return {
      ...state,
      football: {
        ...state.football,
        awayScore: state.football.awayScore + 1,
      },
    };
  }

  if (action === "away-1") {
    return {
      ...state,
      football: {
        ...state.football,
        awayScore: Math.max(0, state.football.awayScore - 1),
      },
    };
  }

  return null;
}

function applyResetToState(state: ScoreboardState): ScoreboardState {
  return {
    ...state,
    football: { homeScore: 0, awayScore: 0 },
    cricket: {
      home: createCricketTeamState(),
      away: createCricketTeamState(),
    },
  };
}

export function applyScoreActionToState(
  state: ScoreboardState,
  action: ScoreAction,
): ScoreboardState {
  let nextState = cloneScoreboardState(state);

  if (typeof action === "string") {
    if (action === "reset") {
      return applyResetToState(nextState);
    }

    const updated = applyFootballStringActionToState(nextState, action);
    return updated ?? nextState;
  }

  if (typeof action === "object" && action !== null && "sport" in action) {
    if (action.sport === "football") {
      const a = action as FootballAction;
      if (a.type === "reset") {
        return {
          ...nextState,
          football: { homeScore: 0, awayScore: 0 },
        };
      }

      const updated = applyFootballStringActionToState(nextState, a.type);
      return updated ?? nextState;
    }

    if (action.sport === "cricket") {
      const a = action as CricketAction;
      const teamKey = a.team === "home" ? "home" : "away";
      const existing = nextState.cricket[teamKey];

      if (a.type === "addRuns") {
        return {
          ...nextState,
          cricket: {
            ...nextState.cricket,
            [teamKey]: {
              ...existing,
              runs: existing.runs + Math.max(0, Math.floor(a.runs ?? 0)),
            },
          },
        };
      }

      if (a.type === "addWicket") {
        return {
          ...nextState,
          cricket: {
            ...nextState.cricket,
            [teamKey]: {
              ...existing,
              wickets: Math.min(10, existing.wickets + 1),
            },
          },
        };
      }

      if (a.type === "setOvers") {
        return {
          ...nextState,
          cricket: {
            ...nextState.cricket,
            [teamKey]: {
              ...existing,
              overs: a.overs ?? existing.overs,
            },
          },
        };
      }

      if (a.type === "recordDelivery") {
        return {
          ...nextState,
          cricket: {
            ...nextState.cricket,
            [teamKey]: applyCricketDelivery(existing, a.event),
          },
        };
      }
    }
  }

  return nextState;
}

function applyReset(): void {
  scoreboardState = applyResetToState(scoreboardState);
}

export function applyScoreAction(action: ScoreAction): ScoreboardState {
  scoreboardState = applyScoreActionToState(scoreboardState, action);
  touch();
  return { ...scoreboardState };
}

export function updateScoreboardSettingsOnState(
  state: ScoreboardState,
  settings: {
    homeTeam?: string;
    awayTeam?: string;
    liveEnabled?: boolean;
    sport?: Sport;
  },
): ScoreboardState {
  return {
    ...state,
    sport: settings.sport ?? state.sport,
    homeTeam: settings.homeTeam?.trim() || state.homeTeam,
    awayTeam: settings.awayTeam?.trim() || state.awayTeam,
    liveEnabled:
      typeof settings.liveEnabled === "boolean"
        ? settings.liveEnabled
        : state.liveEnabled,
    updatedAt: new Date().toISOString(),
  };
}

export function updateScoreboardSettings(settings: {
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
  sport?: Sport;
}): ScoreboardState {
  scoreboardState = updateScoreboardSettingsOnState(scoreboardState, settings);

  return { ...scoreboardState };
}
