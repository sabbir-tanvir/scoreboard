import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { MONGODB_URI } from "./config/env.js";
import {
  applyScoreActionToState,
  cloneScoreboardState,
  createInitialScoreboardState,
  type ScoreAction,
  type ScoreboardState,
  updateScoreboardSettingsOnState,
} from "./scoreboardState.js";

export type MatchStatus = "live" | "finished";

export type MatchRecord = {
  _id: string;
  roomId: string;
  matchName: string;
  status: MatchStatus;
  state: ScoreboardState;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

export type MatchSummary = {
  roomId: string;
  matchName: string;
  sport: ScoreboardState["sport"];
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

type CreateMatchInput = {
  roomId?: string;
  matchName: string;
  sport?: ScoreboardState["sport"];
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
};

type UpdateMatchSettings = {
  matchName?: string;
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
  sport?: ScoreboardState["sport"];
};

type MemoryStore = Map<string, MatchRecord>;

const COLLECTION_NAME = "matches";
const DEFAULT_ROOM_ID = "default";

let mongoClient: MongoClient | null = null;
const memoryStore: MemoryStore = new Map();

async function getCollection() {
  if (!MONGODB_URI) {
    return null;
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }

  return mongoClient.db().collection<MatchRecord>(COLLECTION_NAME);
}

function now() {
  return new Date().toISOString();
}

function normalizeState(state: ScoreboardState): ScoreboardState {
  return cloneScoreboardState(state);
}

function toSummary(record: MatchRecord): MatchSummary {
  return {
    roomId: record.roomId,
    matchName: record.matchName,
    sport: record.state.sport,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    finishedAt: record.finishedAt,
  };
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

function buildInitialRecord(input: CreateMatchInput): MatchRecord {
  const roomId = input.roomId?.trim() || buildRoomId(input.matchName);
  const matchName = input.matchName.trim();
  const state = withMatchMetadata(
    normalizeState(createInitialScoreboardState()),
    roomId,
    matchName,
  );

  return {
    _id: roomId,
    roomId,
    matchName,
    status: "live",
    state: updateScoreboardSettingsOnState(state, {
      sport: input.sport,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      liveEnabled: input.liveEnabled,
    }),
    createdAt: now(),
    updatedAt: now(),
  };
}

async function readAllRecords(): Promise<MatchRecord[]> {
  const collection = await getCollection();
  if (!collection) {
    return [...memoryStore.values()];
  }

  return collection.find({}).sort({ updatedAt: -1 }).toArray();
}

async function readRecord(roomId: string): Promise<MatchRecord | null> {
  const collection = await getCollection();
  if (!collection) {
    return memoryStore.get(roomId) ?? null;
  }

  return collection.findOne({ _id: roomId });
}

async function writeRecord(record: MatchRecord): Promise<void> {
  const collection = await getCollection();
  if (!collection) {
    memoryStore.set(record.roomId, record);
    return;
  }

  await collection.updateOne(
    { _id: record._id },
    { $set: record },
    { upsert: true },
  );
}

export async function listMatchSummaries(): Promise<MatchSummary[]> {
  const records = await readAllRecords();
  return records.map(toSummary).sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.matchName.localeCompare(right.matchName);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export async function getMatch(roomId: string): Promise<MatchRecord | null> {
  return readRecord(roomId);
}

export async function getOrCreateMatch(
  roomId: string = DEFAULT_ROOM_ID,
): Promise<MatchRecord> {
  const existing = await readRecord(roomId);
  if (existing) {
    return existing;
  }

  const created = buildInitialRecord({ roomId, matchName: "Default Match" });
  await writeRecord(created);
  return created;
}

export async function createMatch(
  input: CreateMatchInput,
): Promise<MatchRecord> {
  if (!input.matchName.trim()) {
    throw new Error("Match name is required");
  }

  const record = buildInitialRecord(input);
  const existing = await readRecord(record.roomId);
  if (existing) {
    throw new Error("Room already exists");
  }

  await writeRecord(record);
  return record;
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

  await writeRecord(record);
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

  await writeRecord(record);
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

  await writeRecord(record);
  return record;
}

export async function loadPersistedScoreboardState(): Promise<ScoreboardState> {
  const record = await getOrCreateMatch(DEFAULT_ROOM_ID);
  return cloneScoreboardState(record.state);
}

export async function savePersistedScoreboardState(
  state: ScoreboardState,
): Promise<void> {
  const record = await getOrCreateMatch(DEFAULT_ROOM_ID);
  await writeRecord({
    ...record,
    state: cloneScoreboardState(state),
    updatedAt: now(),
  });
}

export async function closeMatchStore(): Promise<void> {
  await mongoClient?.close();
  mongoClient = null;
  memoryStore.clear();
}
