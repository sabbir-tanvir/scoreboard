import { API_URL } from "@/constants/config";
import type { MatchSummary } from "@/types/scoreboard";

export async function listMatches(): Promise<{ matches: MatchSummary[] }> {
  const response = await fetch(`${API_URL}/matches`);
  if (!response.ok) {
    throw new Error("Failed to load matches");
  }
  return response.json() as Promise<{ matches: MatchSummary[] }>;
}
