import { MongoClient } from "mongodb";
import { MONGODB_URI } from "../config/env.js";
import type { ScoreboardState } from "../scoreboardState.js";

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

const COLLECTION_NAME = "matches";

let mongoClient: MongoClient | null = null;

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

export async function listMatchRecords(): Promise<MatchRecord[]> {
  const collection = await getCollection();
  if (!collection) {
    return [];
  }

  return collection.find({}).sort({ updatedAt: -1 }).toArray();
}

export async function listMatchSummaries(): Promise<MatchSummary[]> {
  const records = await listMatchRecords();
  return records.map(toSummary).sort((left, right) => {
    if (left.updatedAt === right.updatedAt) {
      return left.matchName.localeCompare(right.matchName);
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export async function getMatchRecord(
  roomId: string,
): Promise<MatchRecord | null> {
  const collection = await getCollection();
  if (!collection) {
    return null;
  }

  return collection.findOne({ _id: roomId });
}

export async function saveMatchRecord(record: MatchRecord): Promise<void> {
  const collection = await getCollection();
  if (!collection) {
    return;
  }

  await collection.updateOne(
    { _id: record._id },
    { $set: record },
    { upsert: true },
  );
}

export async function deleteMatchRecord(roomId: string): Promise<boolean> {
  const collection = await getCollection();
  if (!collection) {
    return false;
  }

  const result = await collection.deleteOne({ _id: roomId });
  return result.deletedCount > 0;
}

export async function closeMatchRepository(): Promise<void> {
  await mongoClient?.close();
  mongoClient = null;
}
