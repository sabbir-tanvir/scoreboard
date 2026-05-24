import { View, Text, StyleSheet } from "react-native";
import type { ScoreboardState } from "@/types/scoreboard";

type Props = {
  scoreboard: ScoreboardState;
};

export function FootballScoreView({ scoreboard }: Props) {
  return (
    <View style={styles.container}>
      <TeamScoreCard
        team={scoreboard.homeTeam}
        score={scoreboard.football.homeScore}
        label="HOME"
        accent="#22d3ee"
      />

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <TeamScoreCard
        team={scoreboard.awayTeam}
        score={scoreboard.football.awayScore}
        label="AWAY"
        accent="#f472b6"
      />
    </View>
  );
}

function TeamScoreCard({
  team,
  score,
  label,
  accent,
}: {
  team: string;
  score: number;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.label, { color: accent }]}>{label}</Text>
      <Text style={styles.teamName}>{team}</Text>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  teamName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0",
    marginTop: 6,
  },
  score: {
    fontSize: 72,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
    lineHeight: 80,
  },
  vsContainer: {
    alignItems: "center",
    paddingVertical: 4,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 4,
  },
});
