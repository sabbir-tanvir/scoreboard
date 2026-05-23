import { useEffect, useMemo, useState } from "react";
import { ScoreboardView } from "../components/ScoreboardView";
import { listMatches } from "../lib/api";
import { navigateTo } from "../lib/navigation";
import { useSocketScoreboard } from "../hooks/useSocketScoreboard";
import { useScoreboardStore } from "../store/useScoreboardStore";
import type { MatchSummary } from "../types/scoreboard";

export function LivePage() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("roomId") ?? "default";
  });
  const [matches, setMatches] = useState<MatchSummary[]>([]);

  useSocketScoreboard(roomId);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setRoomId(params.get("roomId") ?? "default");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void listMatches()
      .then((response) => setMatches(response.matches))
      .catch(() => setMatches([]));
  }, [roomId]);

  const connected = useScoreboardStore((state) => state.connected);
  const lastEvent = useScoreboardStore((state) => state.lastEvent);
  const scoreboard = useScoreboardStore((state) => state.scoreboard);

  const activeMatch = useMemo(
    () => matches.find((match) => match.roomId === roomId),
    [matches, roomId],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Public Live Scoreboard
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Realtime score view
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            {scoreboard.liveEnabled
              ? "Anyone can open this page and see score updates instantly."
              : "The admin has hidden the live scoreboard for now."}
          </p>
          <p className="text-sm text-slate-400">
            Active match: {activeMatch?.matchName ?? scoreboard.matchName} •
            Room: {roomId}
          </p>
        </header>

        {scoreboard.liveEnabled ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-300">
                  Connection: {connected ? "Connected" : "Disconnected"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Last event: {lastEvent || "None"}
                </p>
              </aside>

              <ScoreboardView scoreboard={scoreboard} />
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Match history
                  </p>
                  <h2 className="text-xl font-semibold">All rooms</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {matches.length > 0 ? (
                  matches.map((match) => (
                    <button
                      key={match.roomId}
                      onClick={() =>
                        navigateTo(
                          `/live?roomId=${encodeURIComponent(match.roomId)}`,
                        )
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        match.roomId === roomId
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-white/10 bg-slate-950/60 hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-white">
                        {match.matchName}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {match.updatedAt
                          ? new Date(match.updatedAt).toLocaleString()
                          : "Unknown date"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No matches yet.</p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
              Live hidden
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Scoreboard is currently hidden
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Please wait for the admin to turn the live view back on.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
