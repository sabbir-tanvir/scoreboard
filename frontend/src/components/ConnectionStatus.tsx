export function ConnectionStatus({
  connected,
  lastEvent,
}: {
  connected: boolean;
  lastEvent: string;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <p className="text-sm font-medium text-slate-400">Realtime status</p>
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`}
        />
        <span className="text-lg font-semibold">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        The Socket.IO client connects automatically when the page loads.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Last event
        </p>
        <p className="mt-2 text-sm text-slate-200">
          {lastEvent || "No messages yet"}
        </p>
      </div>
    </aside>
  );
}
