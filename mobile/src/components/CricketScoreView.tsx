import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { ScoreboardState, CricketTeamState } from "@/types/scoreboard";

type Props = {
  scoreboard: ScoreboardState;
};

export function CricketScoreView({ scoreboard }: Props) {
  return (
    <View style={styles.container}>
      <CricketTeamCard
        team={scoreboard.homeTeam}
        teamState={scoreboard.cricket.home}
        label="HOME"
        accent="#22d3ee"
      />
      <CricketTeamCard
        team={scoreboard.awayTeam}
        teamState={scoreboard.cricket.away}
        label="AWAY"
        accent="#f472b6"
      />

      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>OVER HISTORY</Text>

        <OverHistoryBlock
          team={scoreboard.homeTeam}
          currentOver={scoreboard.cricket.home.currentOver}
          overHistory={scoreboard.cricket.home.overHistory}
        />
        <OverHistoryBlock
          team={scoreboard.awayTeam}
          currentOver={scoreboard.cricket.away.currentOver}
          overHistory={scoreboard.cricket.away.overHistory}
        />
      </View>
    </View>
  );
}

function CricketTeamCard({
  team,
  teamState,
  label,
  accent,
}: {
  team: string;
  teamState: CricketTeamState;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.label, { color: accent }]}>{label}</Text>
      <Text style={styles.teamName}>{team}</Text>

      <View style={styles.scoreRow}>
        <Text style={styles.runsWickets}>
          {teamState.runs}/{teamState.wickets}
        </Text>
        <View style={styles.oversBadge}>
          <Text style={styles.oversText}>{teamState.overs} ov</Text>
        </View>
      </View>

      <View style={styles.currentOverContainer}>
        <Text style={styles.currentOverLabel}>CURRENT OVER</Text>
        <View style={styles.ballRow}>
          {teamState.currentOver.length > 0 ? (
            teamState.currentOver.map((ball, index) => (
              <View
                key={`${team}-ball-${index}`}
                style={[
                  styles.ballBadge,
                  ball === "W"
                    ? styles.ballWicket
                    : ball === "4" || ball === "6"
                      ? styles.ballBoundary
                      : ball === "NB" || ball === "WD"
                        ? styles.ballExtra
                        : styles.ballNormal,
                ]}
              >
                <Text
                  style={[
                    styles.ballText,
                    ball === "W" || ball === "4" || ball === "6"
                      ? styles.ballTextLight
                      : undefined,
                  ]}
                >
                  {ball}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noBalls}>No balls yet</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function OverHistoryBlock({
  team,
  currentOver,
  overHistory,
}: {
  team: string;
  currentOver: string[];
  overHistory: string[];
}) {
  return (
    <View style={styles.historyBlock}>
      <Text style={styles.historyTeam}>{team}</Text>
      <Text style={styles.historyCurrent}>
        Current: {currentOver.length > 0 ? currentOver.join(" · ") : "—"}
      </Text>
      <ScrollView
        style={styles.historyScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {overHistory.length > 0 ? (
          [...overHistory].reverse().map((over, idx) => (
            <Text key={`${team}-over-${idx}`} style={styles.historyOver}>
              Over {overHistory.length - idx}: {over}
            </Text>
          ))
        ) : (
          <Text style={styles.historyEmpty}>No completed overs</Text>
        )}
      </ScrollView>
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
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginTop: 8,
  },
  runsWickets: {
    fontSize: 52,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 60,
  },
  oversBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  oversText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  currentOverContainer: {
    width: "100%",
    marginTop: 16,
  },
  currentOverLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#64748b",
    marginBottom: 8,
  },
  ballRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  ballBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ballNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  ballWicket: {
    backgroundColor: "#ef4444",
  },
  ballBoundary: {
    backgroundColor: "#22d3ee",
  },
  ballExtra: {
    backgroundColor: "#f59e0b",
  },
  ballText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  ballTextLight: {
    color: "#ffffff",
  },
  noBalls: {
    fontSize: 13,
    color: "#475569",
  },
  historyCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    color: "#64748b",
    marginBottom: 16,
  },
  historyBlock: {
    marginBottom: 16,
  },
  historyTeam: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e2e8f0",
  },
  historyCurrent: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 8,
  },
  historyScroll: {
    maxHeight: 80,
    backgroundColor: "rgba(2, 6, 23, 0.6)",
    borderRadius: 12,
    padding: 10,
  },
  historyOver: {
    fontSize: 13,
    color: "#94a3b8",
    paddingVertical: 2,
  },
  historyEmpty: {
    fontSize: 13,
    color: "#475569",
  },
});
