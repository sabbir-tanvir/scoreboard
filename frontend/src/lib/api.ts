const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_SOCKET_URL ??
  "http://localhost:4000";

export async function listMatches() {
  const response = await fetch(`${apiBaseUrl}/matches`);
  if (!response.ok) {
    throw new Error("Failed to load matches");
  }

  return (await response.json()) as {
    matches: import("../types/scoreboard").MatchSummary[];
  };
}

export async function getMatch(roomId: string) {
  const response = await fetch(
    `${apiBaseUrl}/matches/${encodeURIComponent(roomId)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to load match");
  }

  return (await response.json()) as import("../types/scoreboard").MatchRecord;
}

export async function createMatch(
  match: {
    roomId?: string;
    matchName: string;
    homeTeam?: string;
    awayTeam?: string;
    liveEnabled?: boolean;
    sport?: string;
  },
  token: string,
) {
  const response = await fetch(`${apiBaseUrl}/matches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(match),
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(errorBody.error ?? "Request failed");
  }

  return response.json() as Promise<{
    ok: true;
    match: import("../types/scoreboard").MatchRecord;
  }>;
}

export async function finishMatch(roomId: string, token: string) {
  const response = await fetch(
    `${apiBaseUrl}/matches/${encodeURIComponent(roomId)}/finish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(errorBody.error ?? "Request failed");
  }

  return response.json() as Promise<{
    ok: true;
    match: import("../types/scoreboard").MatchRecord;
  }>;
}

export async function deleteMatch(roomId: string, token: string) {
  const response = await fetch(
    `${apiBaseUrl}/matches/${encodeURIComponent(roomId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(errorBody.error ?? "Request failed");
  }

  return response.json() as Promise<{ ok: true; roomId: string }>;
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return (await response.json()) as { token: string };
}

export async function updateScore(action: any, token: string, roomId?: string) {
  const response = await fetch(`${apiBaseUrl}/scoreboard/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, roomId }),
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as {
      error?: string;
    };
    throw new Error(errorBody.error ?? "Request failed");
  }

  return response.json();
}

export async function updateSettings(
  settings: {
    roomId?: string;
    matchName?: string;
    homeTeam?: string;
    awayTeam?: string;
    liveEnabled?: boolean;
    sport?: string;
  },
  token: string,
) {
  const response = await fetch(`${apiBaseUrl}/scoreboard/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ error: "Request failed" }))) as {
      error?: string;
    };
    throw new Error(errorBody.error ?? "Request failed");
  }

  return response.json();
}
