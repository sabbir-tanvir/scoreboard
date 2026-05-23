import express from "express";
import cors from "cors";
import { ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_ORIGIN } from "./config/env.js";
import { createAdminToken, getBearerToken, verifyAdminToken } from "./auth.js";
import { type ScoreAction, type ScoreboardState } from "./scoreboardState.js";
import {
  createMatch,
  finishMatch,
  getMatch,
  getOrCreateMatch,
  listMatchSummaries,
  loadPersistedScoreboardState,
  savePersistedScoreboardState,
  updateMatchAction,
  updateMatchSettings,
  type MatchRecord,
  type MatchSummary,
} from "./matchStore.js";

type LoginBody = {
  email?: string;
  password?: string;
};

type UpdateBody = {
  roomId?: string;
  action?: any;
};

type SettingsBody = {
  roomId?: string;
  matchName?: string;
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
  sport?: string;
};

type CreateMatchBody = {
  roomId?: string;
  matchName?: string;
  homeTeam?: string;
  awayTeam?: string;
  liveEnabled?: boolean;
  sport?: string;
};

type AppOptions = {
  onMatchUpdated?: (match: MatchRecord, message: string) => void;
};

export function createApp(options: AppOptions = {}) {
  const app = express();

  app.use(
    cors({
      origin: CLIENT_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/matches", async (_request, response) => {
    const matches = await listMatchSummaries();
    response.json({ matches });
  });

  app.get("/matches/:roomId", async (request, response) => {
    const match = await getMatch(request.params.roomId);
    if (!match) {
      response.status(404).json({ error: "Match not found" });
      return;
    }

    response.json(match);
  });

  app.get("/scoreboard", async (request, response) => {
    const roomId = String(request.query.roomId ?? "default");
    const match = await getOrCreateMatch(roomId);
    response.json(match.state);
  });

  app.get("/scoreboard/export", async (request, response) => {
    const bearerToken = getBearerToken(request.header("authorization"));
    if (!bearerToken) {
      response.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    const payload = verifyAdminToken(bearerToken);
    if (!payload) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const roomId = String(request.query.roomId ?? "default");
    const match = await getOrCreateMatch(roomId);
    response.setHeader(
      "Content-Disposition",
      "attachment; filename=scoreboard-backup.json",
    );
    response.json({
      exportedAt: new Date().toISOString(),
      match,
    });
  });

  app.post("/matches", async (request, response) => {
    const bearerToken = getBearerToken(request.header("authorization"));
    if (!bearerToken) {
      response.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    const payload = verifyAdminToken(bearerToken);
    if (!payload) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const body = request.body as CreateMatchBody;
    if (!body.matchName || body.matchName.trim().length === 0) {
      response.status(400).json({ error: "Match name is required" });
      return;
    }

    if (
      (body.sport !== undefined &&
        body.sport !== "football" &&
        body.sport !== "cricket") ||
      (body.liveEnabled !== undefined && typeof body.liveEnabled !== "boolean")
    ) {
      response.status(400).json({ error: "Invalid match settings" });
      return;
    }

    try {
      const match = await createMatch({
        roomId: body.roomId,
        matchName: body.matchName,
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        liveEnabled: body.liveEnabled,
        sport: body.sport as ScoreboardState["sport"] | undefined,
      });
      options.onMatchUpdated?.(match, "Match created");
      response.status(201).json({ ok: true, match });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create match";
      response.status(409).json({ error: message });
    }
  });

  app.post("/auth/login", (request, response) => {
    const { email, password } = request.body as LoginBody;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      response.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = createAdminToken(email);
    response.json({ token });
  });

  app.post("/scoreboard/update", async (request, response) => {
    const bearerToken = getBearerToken(request.header("authorization"));
    if (!bearerToken) {
      response.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    const payload = verifyAdminToken(bearerToken);
    if (!payload) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const { action } = request.body as UpdateBody;
    if (!action) {
      response.status(400).json({ error: "Missing action" });
      return;
    }

    const roomId = String((request.body as UpdateBody).roomId ?? "default");
    const match = await updateMatchAction(roomId, action);
    options.onMatchUpdated?.(match, `Score updated: ${match.matchName}`);
    response.json({ ok: true, match });
  });

  app.post("/scoreboard/settings", async (request, response) => {
    const bearerToken = getBearerToken(request.header("authorization"));
    if (!bearerToken) {
      response.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    const payload = verifyAdminToken(bearerToken);
    if (!payload) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const { roomId, matchName, homeTeam, awayTeam, liveEnabled, sport } =
      request.body as SettingsBody;
    if (
      (homeTeam !== undefined && homeTeam.trim().length === 0) ||
      (awayTeam !== undefined && awayTeam.trim().length === 0) ||
      (liveEnabled !== undefined && typeof liveEnabled !== "boolean") ||
      (sport !== undefined && sport !== "football" && sport !== "cricket") ||
      (matchName !== undefined && matchName.trim().length === 0)
    ) {
      response.status(400).json({ error: "Invalid settings" });
      return;
    }

    const match = await updateMatchSettings(String(roomId ?? "default"), {
      matchName,
      homeTeam,
      awayTeam,
      liveEnabled,
      sport: sport as ScoreboardState["sport"] | undefined,
    });
    options.onMatchUpdated?.(
      match,
      `Scoreboard settings updated: ${match.matchName}`,
    );
    response.json({ ok: true, match });
  });

  app.post("/matches/:roomId/finish", async (request, response) => {
    const bearerToken = getBearerToken(request.header("authorization"));
    if (!bearerToken) {
      response.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    const payload = verifyAdminToken(bearerToken);
    if (!payload) {
      response.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const match = await finishMatch(request.params.roomId);
    options.onMatchUpdated?.(match, `Match finished: ${match.matchName}`);
    response.json({ ok: true, match });
  });

  return app;
}
