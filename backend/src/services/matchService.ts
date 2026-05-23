import { randomUUID } from "node:crypto";
import {
  applyScoreActionToState,
  cloneScoreboardState,
  createInitialScoreboardState,
  type ScoreAction,
  type ScoreboardState,
  updateScoreboardSettingsOnState,
} from "../scoreboardState.js";
import {
  closeMatchRepository,
  deleteMatchRecord,
  getMatchRecord,
  listMatchRecords,
  listMatchSummaries,
  saveMatchRecord,
  type MatchRecord,
  type MatchSummary,
  type MatchStatus,
} from "../repositories/matchRepository.js";
import {
  loadPersistedScoreboardState as loadLegacyScoreboardState,
  resetPersistedScoreboardState as resetLegacyScoreboardState,
} from "../persistence.js";

export type CreateMatchInput = {
  roomId?: string;
  matchName: string;
  sport?: ScoreboardState["sport"];
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
};

export type UpdateMatchSettings = {
  matchName?: string;
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
  sport?: ScoreboardState["sport"];
};

const DEFAULT_ROOM_ID = "default";

function now() {
  return new Date().toISOString();
}

function normalizeState(state: ScoreboardState): ScoreboardState {
  return cloneScoreboardState(state);
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "match";
}

function buildRoomId(matchName: string): string {
  return `${slugify(matchName)}-${randomUUID().slice(0, 8)}`;
}

function withMatchMetadata(
  state: ScoreboardState,
  roomId: string,
  matchName: string,
): ScoreboardState {
  return {
    ...state,
    roomId,
    matchName,
  };
}

function buildRecordFromState(
  state: ScoreboardState,
  input: {
    roomId: string;
    matchName: string;
    status?: MatchStatus;
    createdAt?: string;
    updatedAt?: string;
    finishedAt?: string;
  },
): MatchRecord {
  const nextState = withMatchMetadata(
    normalizeState(state),
    input.roomId,
    input.matchName,
  );

  return {
    _id: input.roomId,
    roomId: input.roomId,
    matchName: input.matchName,
    status: input.status ?? "live",
    state: nextState,
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
    finishedAt: input.finishedAt,
  };
}

function buildInitialRecord(input: CreateMatchInput): MatchRecord {
  const roomId = input.roomId?.trim() || buildRoomId(input.matchName);
  const matchName = input.matchName.trim();
  const state = updateScoreboardSettingsOnState(
    normalizeState(createInitialScoreboardState()),
    {
      sport: input.sport,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      liveEnabled: input.liveEnabled,
    },
  );

  return buildRecordFromState(state, { roomId, matchName });
}

function looksLikeLegacyState(state: ScoreboardState): boolean {
  const initial = createInitialScoreboardState();

  return (
    state.roomId !== initial.roomId ||
    state.matchName !== initial.matchName ||
    state.sport !== initial.sport ||
    state.homeTeam !== initial.homeTeam ||
    state.awayTeam !== initial.awayTeam ||
    state.liveEnabled !== initial.liveEnabled ||
    state.football.homeScore !== initial.football.homeScore ||
    state.football.awayScore !== initial.football.awayScore ||
    state.cricket.home.runs !== initial.cricket.home.runs ||
    state.cricket.home.wickets !== initial.cricket.home.wickets ||
    state.cricket.home.overs !== initial.cricket.home.overs ||
    state.cricket.home.legalBalls !== initial.cricket.home.legalBalls ||
    state.cricket.home.currentOver.length !==
      initial.cricket.home.currentOver.length ||
    state.cricket.home.overHistory.length !==
      initial.cricket.home.overHistory.length ||
    state.cricket.away.runs !== initial.cricket.away.runs ||
    state.cricket.away.wickets !== initial.cricket.away.wickets ||
    state.cricket.away.overs !== initial.cricket.away.overs ||
    state.cricket.away.legalBalls !== initial.cricket.away.legalBalls ||
    state.cricket.away.currentOver.length !==
      initial.cricket.away.currentOver.length ||
    state.cricket.away.overHistory.length !==
      initial.cricket.away.overHistory.length
  );
}

async function migrateLegacyMatchIfNeeded(): Promise<MatchRecord | null> {
  const existingRecords = await listMatchRecords();
  if (existingRecords.length > 0) {
    return null;
  }

  const legacyState = await loadLegacyScoreboardState();
  if (!looksLikeLegacyState(legacyState)) {
    return null;
  }

  const roomId = DEFAULT_ROOM_ID;
  const matchName = legacyState.matchName.trim() || "Default Match";
  const record = buildRecordFromState(legacyState, {
    roomId,
    matchName,
    createdAt: legacyState.updatedAt,
    updatedAt: legacyState.updatedAt,
  });

  await saveMatchRecord(record);
  await resetLegacyScoreboardState();
  return record;
}

export async function createMatch(
  input: CreateMatchInput,
): Promise<MatchRecord> {
  if (!input.matchName.trim()) {
    throw new Error("Match name is required");
  }

  const record = buildInitialRecord(input);
  const existing = await getMatchRecord(record.roomId);
  if (existing) {
    throw new Error("Room already exists");
  }

  await saveMatchRecord(record);
  return record;
}

export async function listMatches(): Promise<MatchSummary[]> {
  await migrateLegacyMatchIfNeeded();
  return listMatchSummaries();
}

export async function getMatch(roomId: string): Promise<MatchRecord | null> {
  return getMatchRecord(roomId);
}

export async function getOrCreateMatch(
  roomId: string = DEFAULT_ROOM_ID,
): Promise<MatchRecord> {
  const existing = await getMatchRecord(roomId);
  if (existing) {
    return existing;
  }

  if (roomId === DEFAULT_ROOM_ID) {
    const migrated = await migrateLegacyMatchIfNeeded();
    if (migrated) {
      return migrated;
    }
  }

  const created = buildInitialRecord({ roomId, matchName: "Default Match" });
  await saveMatchRecord(created);
  return created;
}

export async function updateMatchAction(
  roomId: string,
  action: ScoreAction,
): Promise<MatchRecord> {
  const current = await getOrCreateMatch(roomId);
  const nextState = applyScoreActionToState(current.state, action);
  const record: MatchRecord = {
    ...current,
    state: normalizeState(nextState),
    updatedAt: now(),
  };

  await saveMatchRecord(record);
  return record;
}

export async function updateMatchSettings(
  roomId: string,
  settings: UpdateMatchSettings,
): Promise<MatchRecord> {
  const current = await getOrCreateMatch(roomId);
  const nextState = withMatchMetadata(
    updateScoreboardSettingsOnState(current.state, settings),
    current.roomId,
    settings.matchName?.trim() || current.matchName,
  );
  const record: MatchRecord = {
    ...current,
    matchName: settings.matchName?.trim() || current.matchName,
    state: normalizeState(nextState),
    updatedAt: now(),
  };

  await saveMatchRecord(record);
  return record;
}

export async function finishMatch(roomId: string): Promise<MatchRecord> {
  const current = await getOrCreateMatch(roomId);
  const record: MatchRecord = {
    ...current,
    status: "finished",
    updatedAt: now(),
    finishedAt: now(),
  };

  await saveMatchRecord(record);
  return record;
}

export async function deleteMatch(roomId: string): Promise<boolean> {
  return deleteMatchRecord(roomId);
}

export async function loadPersistedScoreboardState(): Promise<ScoreboardState> {
  const record = await getOrCreateMatch(DEFAULT_ROOM_ID);
  return cloneScoreboardState(record.state);
}

export async function savePersistedScoreboardState(
  state: ScoreboardState,
): Promise<void> {
  const record = await getOrCreateMatch(DEFAULT_ROOM_ID);
  await saveMatchRecord({
    ...record,
    state: cloneScoreboardState(state),
    updatedAt: now(),
  });
}

export async function closeMatchStore(): Promise<void> {
  await closeMatchRepository();
}

export type {
  MatchRecord,
  MatchSummary,
  MatchStatus,
} from "../repositories/matchRepository.js";
