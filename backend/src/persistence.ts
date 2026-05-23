import { MongoClient } from "mongodb";
import { MONGODB_URI } from "./config/env.js";
import {
  createInitialScoreboardState,
  type ScoreboardState,
} from "./scoreboardState.js";

type ScoreboardDocument = {
  _id: string;
  state: ScoreboardState;
};

const COLLECTION_NAME = "scoreboard_state";
const DOCUMENT_ID = "current";

let mongoClient: MongoClient | null = null;

async function getCollection() {
  if (!MONGODB_URI) {
    return null;
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }

  return mongoClient.db().collection<ScoreboardDocument>(COLLECTION_NAME);
}

export async function loadPersistedScoreboardState(): Promise<ScoreboardState> {
  const collection = await getCollection();
  if (!collection) {
    return createInitialScoreboardState();
  }

  const document = await collection.findOne({ _id: DOCUMENT_ID });
  return document?.state ?? createInitialScoreboardState();
}

export async function savePersistedScoreboardState(
  state: ScoreboardState,
): Promise<void> {
  const collection = await getCollection();
  if (!collection) {
    return;
  }

  await collection.updateOne(
    { _id: DOCUMENT_ID },
    {
      $set: {
        state,
      },
    },
    { upsert: true },
  );
}

export async function closePersistence(): Promise<void> {
  await mongoClient?.close();
  mongoClient = null;
}
