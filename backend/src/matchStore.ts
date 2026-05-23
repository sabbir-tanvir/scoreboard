export {
  createMatch,
  deleteMatch,
  closeMatchStore,
  finishMatch,
  getMatch,
  getOrCreateMatch,
  listMatches,
  loadPersistedScoreboardState,
  savePersistedScoreboardState,
  updateMatchAction,
  updateMatchSettings,
} from "./services/matchService.js";

export type {
  CreateMatchInput,
  MatchRecord,
  MatchStatus,
  MatchSummary,
  UpdateMatchSettings,
} from "./services/matchService.js";
