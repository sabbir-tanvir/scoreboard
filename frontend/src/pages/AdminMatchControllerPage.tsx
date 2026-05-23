import { useEffect, useState } from "react";
import { useSocketScoreboard } from "../hooks/useSocketScoreboard";
import { clearAdminToken, getAdminToken } from "../lib/adminSession";
import { navigateTo } from "../lib/navigation";
import { finishMatch, updateScore, updateSettings } from "../lib/api";
import { useScoreboardStore } from "../store/useScoreboardStore";
import type {
  CricketDeliveryEvent,
  CricketTeamState,
  ScoreAction,
} from "../types/scoreboard";

export function AdminMatchControllerPage() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("roomId") ?? "default";
  });

  useSocketScoreboard(roomId);

  const connected = useScoreboardStore((state) => state.connected);
  const lastEvent = useScoreboardStore((state) => state.lastEvent);
  const scoreboard = useScoreboardStore((state) => state.scoreboard);
  const setLastEvent = useScoreboardStore((state) => state.setLastEvent);

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isFinishingMatch, setIsFinishingMatch] = useState(false);

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

  const handleUpdate = async (action: ScoreAction) => {
    try {
      await updateScore(action, token, roomId);
      const label =
        typeof action === "string"
          ? action
          : typeof action === "object" && action.type === "recordDelivery"
            ? `recordDelivery: ${action.team} => ${String(action.event)}`
            : JSON.stringify(action);
      setLastEvent(`Admin update accepted: ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      setLastEvent(message);
      if (message.toLowerCase().includes("token")) {
        clearAdminToken();
        navigateTo("/admin/login");
      }
    }
  };

  const goBack = () => {
    navigateTo("/admin/dashboard");
  };

  const handleToggleLiveEnabled = async () => {
    try {
      setIsSavingSettings(true);
      const nextLiveEnabled = !scoreboard.liveEnabled;
      await updateSettings(
        {
          roomId,
          matchName: scoreboard.matchName,
          homeTeam: scoreboard.homeTeam,
          awayTeam: scoreboard.awayTeam,
          liveEnabled: nextLiveEnabled,
          sport: scoreboard.sport,
        },
        token,
      );
      setLastEvent(
        nextLiveEnabled ? "Live page turned on" : "Live page hidden",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Settings update failed";
      setLastEvent(message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleEndMatch = async () => {
    try {
      setIsFinishingMatch(true);
      await finishMatch(roomId, token);
      setLastEvent(`Match finished: ${scoreboard.matchName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Finish failed";
      setLastEvent(message);
      if (message.toLowerCase().includes("token")) {
        clearAdminToken();
        navigateTo("/admin/login");
      }
    } finally {
      setIsFinishingMatch(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
              Score controller
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {scoreboard.matchName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">Room: {roomId}</p>
            <p className="mt-1 text-sm text-slate-400">
              Connection: {connected ? "Connected" : "Disconnected"} • Last
              event: {lastEvent || "None"}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-300">
              {scoreboard.sport === "football"
                ? `Score: ${scoreboard.football.homeScore} - ${scoreboard.football.awayScore}`
                : `Score: ${scoreboard.cricket.home.runs}/${scoreboard.cricket.home.wickets} vs ${scoreboard.cricket.away.runs}/${scoreboard.cricket.away.wickets}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={goBack}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Back to browser
            </button>
            <button
              onClick={() => void handleUpdate("reset")}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Reset
            </button>
            <button
              onClick={() => void handleEndMatch()}
              disabled={isFinishingMatch}
              className="rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFinishingMatch ? "Ending..." : "End match"}
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div>
              <p className="text-sm font-medium text-slate-400">
                Current state
              </p>
              <h2 className="text-2xl font-semibold">
                {scoreboard.homeTeam}{" "}
                {scoreboard.sport === "football"
                  ? `${scoreboard.football.homeScore} - ${scoreboard.football.awayScore}`
                  : `${scoreboard.cricket.home.runs}/${scoreboard.cricket.home.wickets} vs ${scoreboard.cricket.away.runs}/${scoreboard.cricket.away.wickets}`}
              </h2>
              <p className="text-sm text-slate-400">
                Live page: {scoreboard.liveEnabled ? "On" : "Off"}
              </p>
            </div>
            <button
              onClick={() => void handleToggleLiveEnabled()}
              disabled={isSavingSettings}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                scoreboard.liveEnabled
                  ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  : "border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              }`}
            >
              {isSavingSettings
                ? "Saving..."
                : scoreboard.liveEnabled
                  ? "Hide live page"
                  : "Show live page"}
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
        </div>
      ) : null}
    </article>
  );
}
