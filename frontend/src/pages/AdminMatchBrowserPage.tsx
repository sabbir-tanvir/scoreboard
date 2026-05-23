import { useEffect, useMemo, useState } from "react";
import { clearAdminToken, getAdminToken } from "../lib/adminSession";
import { createMatch, deleteMatch, listMatches } from "../lib/api";
import { navigateTo } from "../lib/navigation";
import { socket } from "../lib/socket";
import type { MatchSummary, Sport } from "../types/scoreboard";

type CreateFormState = {
  matchName: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  liveEnabled: boolean;
};

const initialCreateForm: CreateFormState = {
  matchName: "",
  sport: "football",
  homeTeam: "Home",
  awayTeam: "Away",
  liveEnabled: true,
};

export function AdminMatchBrowserPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [createForm, setCreateForm] =
    useState<CreateFormState>(initialCreateForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      navigateTo("/admin/login");
    }
  }, [token]);

  const refreshMatches = async () => {
    try {
      setIsLoading(true);
      const response = await listMatches();
      setMatches(response.matches);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load matches",
      );
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshMatches();
  }, []);

  useEffect(() => {
    socket.connect();

    const onMatchesUpdated = () => {
      void refreshMatches();
    };

    socket.on("matches:updated", onMatchesUpdated);
    return () => {
      socket.off("matches:updated", onMatchesUpdated);
      socket.disconnect();
    };
  }, []);

  const ongoingMatches = useMemo(
    () => matches.filter((match) => match.status === "live"),
    [matches],
  );
  const previousMatches = useMemo(
    () => matches.filter((match) => match.status === "finished"),
    [matches],
  );

  const grouped = {
    ongoingFootball: ongoingMatches.filter(
      (match) => match.sport === "football",
    ),
    ongoingCricket: ongoingMatches.filter((match) => match.sport === "cricket"),
    previousFootball: previousMatches.filter(
      (match) => match.sport === "football",
    ),
    previousCricket: previousMatches.filter(
      (match) => match.sport === "cricket",
    ),
  };

  const handleCreateMatch = async () => {
    if (!createForm.matchName.trim()) {
      setMessage("Match name is required");
      return;
    }

    try {
      setIsCreating(true);
      const response = await createMatch(
        {
          matchName: createForm.matchName,
          sport: createForm.sport,
          homeTeam: createForm.homeTeam,
          awayTeam: createForm.awayTeam,
          liveEnabled: createForm.liveEnabled,
        },
        token,
      );
      setCreateForm(initialCreateForm);
      setMessage(`Created ${response.match.matchName}`);
      navigateTo(
        `/admin/controller?roomId=${encodeURIComponent(response.match.roomId)}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Create failed");
    } finally {
      setIsCreating(false);
      void refreshMatches();
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    navigateTo("/admin/login");
  };

  const handleDeleteMatch = async (roomId: string, matchName: string) => {
    const confirmed = window.confirm(
      `Delete ${matchName}? This will remove the match from history.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRoomId(roomId);
      await deleteMatch(roomId, token);
      setMessage(`Deleted ${matchName}`);
      await refreshMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingRoomId((current) => (current === roomId ? null : current));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Admin Dashboard
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Match browser
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Browse ongoing matches and previous history by football or cricket.
            Click a match to open its score controller.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span>Matches: {matches.length}</span>
            <span>{isLoading ? "Loading..." : "Ready"}</span>
            <span>{message || ""}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Create match
                </p>
                <h2 className="text-2xl font-semibold">New room</h2>
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
                label="Match name"
                value={createForm.matchName}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, matchName: value }))
                }
                placeholder="Weekend Final"
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Sport
                </span>
                <select
                  value={createForm.sport}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      sport: event.target.value as Sport,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                >
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                </select>
              </label>
              <Field
                label="Home team"
                value={createForm.homeTeam}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, homeTeam: value }))
                }
                placeholder="Home"
              />
              <Field
                label="Away team"
                value={createForm.awayTeam}
                onChange={(value) =>
                  setCreateForm((current) => ({ ...current, awayTeam: value }))
                }
                placeholder="Away"
              />
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    Show live page
                  </span>
                  <span className="block text-sm text-slate-400">
                    Turn off if you want the room hidden from viewers.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCreateForm((current) => ({
                      ...current,
                      liveEnabled: !current.liveEnabled,
                    }))
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    createForm.liveEnabled ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                  aria-pressed={createForm.liveEnabled}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      createForm.liveEnabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </label>
              <button
                onClick={() => void handleCreateMatch()}
                disabled={isCreating}
                className="w-full rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create match"}
              </button>
            </div>
          </aside>

          <section className="space-y-4">
            <PaginatedMatchGroup
              title="Ongoing football"
              matches={grouped.ongoingFootball}
              deletingRoomId={deletingRoomId}
              onSelect={(roomId) =>
                navigateTo(
                  `/admin/controller?roomId=${encodeURIComponent(roomId)}`,
                )
              }
              onDelete={handleDeleteMatch}
            />
            <PaginatedMatchGroup
              title="Ongoing cricket"
              matches={grouped.ongoingCricket}
              deletingRoomId={deletingRoomId}
              onSelect={(roomId) =>
                navigateTo(
                  `/admin/controller?roomId=${encodeURIComponent(roomId)}`,
                )
              }
              onDelete={handleDeleteMatch}
            />
            <PaginatedMatchGroup
              title="Previous football"
              matches={grouped.previousFootball}
              deletingRoomId={deletingRoomId}
              onSelect={(roomId) =>
                navigateTo(
                  `/admin/controller?roomId=${encodeURIComponent(roomId)}`,
                )
              }
              onDelete={handleDeleteMatch}
            />
            <PaginatedMatchGroup
              title="Previous cricket"
              matches={grouped.previousCricket}
              deletingRoomId={deletingRoomId}
              onSelect={(roomId) =>
                navigateTo(
                  `/admin/controller?roomId=${encodeURIComponent(roomId)}`,
                )
              }
              onDelete={handleDeleteMatch}
            />
          </section>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none ring-cyan-400 focus:ring"
      />
    </label>
  );
}

function PaginatedMatchGroup({
  title,
  matches,
  onSelect,
  onDelete,
  deletingRoomId,
}: {
  title: string;
  matches: MatchSummary[];
  onSelect: (roomId: string) => void;
  onDelete: (roomId: string, matchName: string) => void;
  deletingRoomId: string | null;
}) {
  const pageSize = 4;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = matches.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [matches.length]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-xl font-semibold">{matches.length} matches</h3>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={safePage === totalPages}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pageItems.length > 0 ? (
          pageItems.map((match) => (
            <div
              key={match.roomId}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-400/60 hover:bg-white/10"
            >
              <button
                onClick={() => onSelect(match.roomId)}
                className="w-full text-left"
              >
                <span className="block text-sm font-semibold text-white">
                  {match.matchName}
                </span>
                <span className="mt-1 block text-xs uppercase tracking-[0.2em] text-slate-400">
                  {match.sport}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {new Date(match.updatedAt).toLocaleString()}
                </span>
                <span className="mt-2 block text-xs text-slate-500">
                  {match.roomId}
                </span>
              </button>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelect(match.roomId)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Open
                </button>
                <button
                  onClick={() => void onDelete(match.roomId, match.matchName)}
                  disabled={deletingRoomId === match.roomId}
                  className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingRoomId === match.roomId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">No matches in this group.</p>
        )}
      </div>
    </section>
  );
}
