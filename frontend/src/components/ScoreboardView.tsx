import type { ScoreboardState } from "../types/scoreboard";

export function ScoreboardView({
  scoreboard,
}: {
  scoreboard: ScoreboardState;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-400">Live scoreboard</p>
        <h2 className="text-2xl font-semibold">{scoreboard.matchName}</h2>
        <p className="mt-1 text-sm text-slate-400">Room: {scoreboard.roomId}</p>
      </div>

      {scoreboard.sport === "football" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreCard
            team={scoreboard.homeTeam}
            score={scoreboard.football.homeScore}
          />
          <ScoreCard
            team={scoreboard.awayTeam}
            score={scoreboard.football.awayScore}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <CricketCard
              team={scoreboard.homeTeam}
              teamState={scoreboard.cricket.home}
            />
            <CricketCard
              team={scoreboard.awayTeam}
              teamState={scoreboard.cricket.away}
            />
          </div>

          <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Over history
            </p>

            <div className="mt-4 space-y-4 text-sm">
              <CricketHistoryBlock
                team={scoreboard.homeTeam}
                currentOver={scoreboard.cricket.home.currentOver}
                overHistory={scoreboard.cricket.home.overHistory}
              />
              <CricketHistoryBlock
                team={scoreboard.awayTeam}
                currentOver={scoreboard.cricket.away.currentOver}
                overHistory={scoreboard.cricket.away.overHistory}
              />
            </div>
          </aside>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Updated: {new Date(scoreboard.updatedAt).toLocaleString()}
      </p>
    </section>
  );
}

function ScoreCard({ team, score }: { team: string; score: number }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <p className="text-sm font-medium text-slate-400">{team}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-6xl font-bold text-white">{score}</span>
      </div>
    </article>
  );
}

function CricketCard({
  team,
  teamState,
}: {
  team: string;
  teamState: {
    runs: number;
    wickets: number;
    overs: string;
    currentOver: string[];
    overHistory: string[];
  };
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <p className="text-sm font-medium text-slate-400">{team}</p>
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-6xl font-bold text-white">
            {teamState.runs}/{teamState.wickets}
          </span>
        </div>
        <div className="mt-2 text-lg text-slate-300">
          {teamState.overs} overs
        </div>
        <div className="mt-3 text-sm text-slate-400">
          Current over:{" "}
          {teamState.currentOver.length > 0
            ? teamState.currentOver.join(" - ")
            : "-"}
        </div>
      </div>
    </article>
  );
}

function CricketHistoryBlock({
  team,
  currentOver,
  overHistory,
}: {
  team: string;
  currentOver: string[];
  overHistory: string[];
}) {
  return (
    <section>
      <p className="font-semibold text-slate-200">{team}</p>
      <p className="mt-1 text-slate-400">
        Current: {currentOver.length ? currentOver.join(" - ") : "No balls yet"}
      </p>
      <div className="mt-2 max-h-28 overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-2 text-slate-300">
        {overHistory.length > 0 ? (
          [...overHistory]
            .reverse()
            .map((over, idx) => <p key={`${team}-${idx}`}>{over}</p>)
        ) : (
          <p>No completed overs</p>
        )}
      </div>
    </section>
  );
}
