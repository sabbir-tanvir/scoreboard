import { useState } from "react";
import { ScoreboardView } from "../components/ScoreboardView";
import { useSocketScoreboard } from "../hooks/useSocketScoreboard";
import { loginAdmin, updateScore } from "../lib/api";
import { useScoreboardStore } from "../store/useScoreboardStore";
import type { ScoreAction } from "../types/scoreboard";

export function AdminPage() {
  useSocketScoreboard();

  const connected = useScoreboardStore((state) => state.connected);
  const lastEvent = useScoreboardStore((state) => state.lastEvent);
  const scoreboard = useScoreboardStore((state) => state.scoreboard);
  const setLastEvent = useScoreboardStore((state) => state.setLastEvent);

  const [email, setEmail] = useState("rumon@mail.com");
  const [password, setPassword] = useState("00000000");
  const [token, setToken] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const response = await loginAdmin(email, password);
      setToken(response.token);
      setLastEvent("Admin login successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setLastEvent(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const sendUpdate = async (action: ScoreAction) => {
    try {
      setIsUpdating(true);
      await updateScore(action, token);
      setLastEvent(`Admin update accepted: ${action}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      setLastEvent(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Admin Score Control
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Only admin can update
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Login first, then use controls below. Everyone on /live sees updates
            instantly.
          </p>
          <p className="text-sm text-slate-300">
            Public URL:{" "}
            <a className="text-cyan-300 underline" href="/live">
              /live
            </a>
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <label className="text-sm text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-cyan-400 focus:ring"
            placeholder="Enter admin email"
          />

          <label
            className="mt-4 block text-sm text-slate-300"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-cyan-400 focus:ring"
            placeholder="Enter password"
          />

          <button
            disabled={isLoggingIn || !email || !password}
            onClick={handleLogin}
            className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in..." : "Login"}
          </button>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={!connected || !token || isUpdating}
              onClick={() => void sendUpdate("home+1")}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Home +1
            </button>
            <button
              disabled={!connected || !token || isUpdating}
              onClick={() => void sendUpdate("away+1")}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Away +1
            </button>
            <button
              disabled={!connected || !token || isUpdating}
              onClick={() => void sendUpdate("reset")}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-300">
            Auth: {token ? "Logged in (token ready)" : "Not logged in"}
          </p>

          <p className="mt-4 text-sm text-slate-300">
            Connection: {connected ? "Connected" : "Disconnected"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Last event: {lastEvent || "None"}
          </p>
        </section>

        <ScoreboardView scoreboard={scoreboard} />
      </section>
    </main>
  );
}
