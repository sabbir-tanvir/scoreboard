import { useState } from "react";
import { useEffect } from "react";
import { loginAdmin } from "../lib/api";
import { getAdminToken, setAdminToken } from "../lib/adminSession";
import { navigateTo } from "../lib/navigation";

export function AdminLoginPage() {
  const [email, setEmail] = useState("rumon@mail.com");
  const [password, setPassword] = useState("00000000");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (getAdminToken()) {
      navigateTo("/admin/dashboard");
    }
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage("");
      const response = await loginAdmin(email, password);
      setAdminToken(response.token);
      navigateTo("/admin/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setErrorMessage(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            Admin Login
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Sign in to continue
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Use your admin email and password to open the dashboard.
          </p>

          <label className="mt-6 block text-sm text-slate-300" htmlFor="email">
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

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </p>
          ) : null}

          <button
            disabled={isLoggingIn || !email || !password}
            onClick={() => void handleLogin()}
            className="mt-6 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in..." : "Login"}
          </button>
        </div>
      </section>
    </main>
  );
}
