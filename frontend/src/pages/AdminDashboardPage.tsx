import { useEffect, useState } from "react";
import { useSocketScoreboard } from "../hooks/useSocketScoreboard";
import { clearAdminToken, getAdminToken } from "../lib/adminSession";
import { navigateTo } from "../lib/navigation";
import { createMatch, finishMatch, listMatches, updateScore } from "../lib/api";
import { useScoreboardStore } from "../store/useScoreboardStore";
import type {
  CricketDeliveryEvent,
  CricketTeamState,
  MatchSummary,
  ScoreAction,
} from "../types/scoreboard";

export function AdminDashboardPage() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("roomId") ?? "default";
  });
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [newMatchName, setNewMatchName] = useState("");
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isFinishingMatch, setIsFinishingMatch] = useState(false);

  useSocketScoreboard(roomId);

  const connected = useScoreboardStore((state) => state.connected);
  const lastEvent = useScoreboardStore((state) => state.lastEvent);
  const scoreboard = useScoreboardStore((state) => state.scoreboard);
  const setLastEvent = useScoreboardStore((state) => state.setLastEvent);

  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      navigateTo("/admin/login");
    }
  }, [token]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setRoomId(params.get("roomId") ?? "default");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const refreshMatches = () => {
    void listMatches()
      .then((response) => setMatches(response.matches))
      .catch(() => setMatches([]));
  };

  useEffect(() => {
    refreshMatches();
  }, [roomId]);

  const ongoingMatches = matches.filter((match) => match.status === "live");
  const previousMatches = matches.filter(
    (match) => match.status === "finished",
  );

  const ongoingFootball = ongoingMatches.filter(
    (match) => match.sport === "football",
  );
  const ongoingCricket = ongoingMatches.filter(
    (match) => match.sport === "cricket",
  );
  const previousFootball = previousMatches.filter(
    (match) => match.sport === "football",
  );
  const previousCricket = previousMatches.filter(
    (match) => match.sport === "cricket",
  );

  const handleUpdate = async (action: ScoreAction) => {
    try {
      await updateScore(action, token, roomId);
      const formatAction = (nextAction: ScoreAction) => {
        if (typeof nextAction === "string") return nextAction;
        if (
          typeof nextAction === "object" &&
          nextAction !== null &&
          nextAction.type === "recordDelivery"
        ) {
          return `recordDelivery: ${nextAction.team} => ${String(nextAction.event)}`;
        }

        try {
          return JSON.stringify(nextAction);
        } catch {
          return String(nextAction);
        }
      };

      setLastEvent(`Admin update accepted: ${formatAction(action)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      setLastEvent(message);

      if (message.toLowerCase().includes("token")) {
        clearAdminToken();
        navigateTo("/admin/login");
      }
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigateTo("/admin/login");
  };

  const handleCreateMatch = async () => {
    if (!newMatchName.trim()) {
      setLastEvent("Match name is required");
      return;
    }

    try {
      setIsCreatingMatch(true);
      const response = await createMatch(
        {
          matchName: newMatchName,
          homeTeam: scoreboard.homeTeam,
          awayTeam: scoreboard.awayTeam,
          liveEnabled: scoreboard.liveEnabled,
          sport: scoreboard.sport,
        },
        token,
      );
      setNewMatchName("");
      navigateTo(
        `/admin/dashboard?roomId=${encodeURIComponent(response.match.roomId)}`,
      );
      refreshMatches();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create failed";
      setLastEvent(message);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleFinishMatch = async () => {
    try {
      setIsFinishingMatch(true);
      await finishMatch(roomId, token);
      refreshMatches();
      setLastEvent(`Match finished: ${scoreboard.matchName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Finish failed";
      setLastEvent(message);
    } finally {
      setIsFinishingMatch(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Score controls
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Browse ongoing and previous matches by football or cricket, then
            open any room to control the score.
          </p>
          <p className="text-sm text-slate-400">
            Active room: {roomId} • Match: {scoreboard.matchName}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span>Connection: {connected ? "Connected" : "Disconnected"}</span>
            <span>Last event: {lastEvent || "None"}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[390px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Admin tools
                </p>
                <h2 className="text-2xl font-semibold">Match browser</h2>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <Field
                label="Create match"
                value={newMatchName}
                onChange={setNewMatchName}
                placeholder="Weekend Final"
              />
              <button
                onClick={() => void handleCreateMatch()}
                disabled={isCreatingMatch || !newMatchName.trim()}
                className="w-full rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingMatch ? "Creating..." : "Create match"}
              </button>
            </div>

            <MatchGroup
              title="Ongoing football"
              matches={ongoingFootball}
              roomId={roomId}
              onSelect={(nextRoomId) =>
                navigateTo(
                  `/admin/dashboard?roomId=${encodeURIComponent(nextRoomId)}`,
                )
              }
            />
            <MatchGroup
              title="Ongoing cricket"
              matches={ongoingCricket}
              roomId={roomId}
              onSelect={(nextRoomId) =>
                navigateTo(
                  `/admin/dashboard?roomId=${encodeURIComponent(nextRoomId)}`,
                )
              }
            />
            <MatchGroup
              title="Previous football"
              matches={previousFootball}
              roomId={roomId}
              onSelect={(nextRoomId) =>
                navigateTo(
                  `/admin/dashboard?roomId=${encodeURIComponent(nextRoomId)}`,
                )
              }
            />
            <MatchGroup
              title="Previous cricket"
              matches={previousCricket}
              roomId={roomId}
              onSelect={(nextRoomId) =>
                navigateTo(
                  `/admin/dashboard?roomId=${encodeURIComponent(nextRoomId)}`,
                )
              }
            />
          </aside>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Score controller
                </p>
                <h2 className="text-2xl font-semibold">
                  {scoreboard.matchName}
                </h2>
                <p className="text-sm text-slate-400">Room: {roomId}</p>
              </div>
              <button
                onClick={() => void handleFinishMatch()}
                disabled={isFinishingMatch}
                className="rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFinishingMatch ? "Finishing..." : "Finish match"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {scoreboard.sport === "football" ? (
                <>
                  <ScoreControl
                    team={scoreboard.homeTeam}
                    onAdd={() =>
                      void handleUpdate({ sport: "football", type: "home+1" })
                    }
                    onMinus={() =>
                      void handleUpdate({ sport: "football", type: "home-1" })
                    }
                  />
                  <ScoreControl
                    team={scoreboard.awayTeam}
                    onAdd={() =>
                      void handleUpdate({ sport: "football", type: "away+1" })
                    }
                    onMinus={() =>
                      void handleUpdate({ sport: "football", type: "away-1" })
                    }
                  />
                </>
              ) : (
                <>
                  <CricketControl
                    team={scoreboard.homeTeam}
                    teamState={scoreboard.cricket.home}
                    onRecordDelivery={(event) =>
                      void handleUpdate({
                        sport: "cricket",
                        type: "recordDelivery",
                        team: "home",
                        event,
                      })
                    }
                  />
                  <CricketControl
                    team={scoreboard.awayTeam}
                    teamState={scoreboard.cricket.away}
                    onRecordDelivery={(event) =>
                      void handleUpdate({
                        sport: "cricket",
                        type: "recordDelivery",
                        team: "away",
                        event,
                      })
                    }
                  />
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => void handleUpdate("reset")}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Reset scoreboard
              </button>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function ScoreControl({
  team,
  onAdd,
  onMinus,
}: {
  team: string;
  onAdd: () => void;
  onMinus: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <p className="text-sm font-medium text-slate-400">{team}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onAdd}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          +1
        </button>
        <button
          onClick={onMinus}
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          -1
        </button>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none ring-cyan-400 focus:ring"
      />
    </label>
  );
}

function MatchGroup({
  title,
  matches,
  roomId,
  onSelect,
}: {
  title: string;
  matches: MatchSummary[];
  roomId: string;
  onSelect: (roomId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <span className="text-xs text-slate-400">{matches.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {matches.length > 0 ? (
          matches.map((match) => (
            <button
              key={match.roomId}
              onClick={() => onSelect(match.roomId)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                match.roomId === roomId
                  ? "border-cyan-400/60 bg-cyan-400/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="block font-semibold text-white">
                {match.matchName}
              </span>
              <span className="block text-xs text-slate-400">
                {new Date(match.updatedAt).toLocaleString()}
              </span>
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-400">No matches in this group.</p>
        )}
      </div>
    </section>
  );
}

function CricketControl({
  team,
  teamState,
  onRecordDelivery,
}: {
  team: string;
  teamState?: CricketTeamState;
  onRecordDelivery: (event: CricketDeliveryEvent) => void;
}) {
  const quickEvents: Array<{ label: string; event: CricketDeliveryEvent }> = [
    { label: "Dot", event: "0" },
    { label: "+1", event: "1" },
    { label: "+2", event: "2" },
    { label: "+3", event: "3" },
    { label: "+4", event: "4" },
    { label: "+6", event: "6" },
    { label: "Wicket", event: "W" },
    { label: "No Ball", event: "NB" },
    { label: "Wide", event: "WD" },
  ];

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <p className="text-sm font-medium text-slate-400">{team}</p>
      {teamState ? (
        <div className="mt-2 text-sm text-slate-400">
          Current: {teamState.runs}/{teamState.wickets} • Overs:{" "}
          {teamState.overs}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {quickEvents.map((item) => (
          <button
            key={item.label}
            onClick={() => onRecordDelivery(item.event)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              item.event === "W"
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : item.event === "NB" || item.event === "WD"
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {teamState ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Current over
          </p>
          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-200">
            {teamState.currentOver.length > 0
              ? teamState.currentOver.join(" - ")
              : "No balls in current over yet"}
          </div>

          <p className="pt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Over history
          </p>
          <div className="max-h-28 space-y-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
            {teamState.overHistory.length > 0 ? (
              [...teamState.overHistory]
                .reverse()
                .map((over, index) => (
                  <p key={`${team}-over-${index}`}>{over}</p>
                ))
            ) : (
              <p>No completed overs yet</p>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
