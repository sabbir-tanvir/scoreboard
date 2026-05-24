import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { useSocketScoreboard } from "@/hooks/useSocketScoreboard";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { FootballScoreView } from "@/components/FootballScoreView";
import { CricketScoreView } from "@/components/CricketScoreView";

export default function LiveMatchScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const navigation = useNavigation();

  useSocketScoreboard(roomId);

  const connected = useScoreboardStore((state) => state.connected);
  const lastEvent = useScoreboardStore((state) => state.lastEvent);
  const scoreboard = useScoreboardStore((state) => state.scoreboard);

  // Set the header title to match name once loaded
  useEffect(() => {
    if (scoreboard.matchName && scoreboard.matchName !== "Default Match") {
      navigation.setOptions({ title: scoreboard.matchName });
    }
  }, [scoreboard.matchName, navigation]);

  if (!scoreboard.liveEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.hiddenCard}>
          <Text style={styles.hiddenEmoji}>🔒</Text>
          <Text style={styles.hiddenTitle}>Scoreboard Hidden</Text>
          <Text style={styles.hiddenText}>
            The admin has turned off the live view for this match. Check back
            later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Match header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.matchName}>{scoreboard.matchName}</Text>
            <Text style={styles.roomLabel}>Room: {roomId}</Text>
          </View>
          <ConnectionBadge connected={connected} />
        </View>

        {/* Sport badge */}
        <View style={styles.sportRow}>
          <View style={styles.sportBadge}>
            <Text style={styles.sportText}>
              {scoreboard.sport === "football" ? "⚽ FOOTBALL" : "🏏 CRICKET"}
            </Text>
          </View>
          {lastEvent ? (
            <Text style={styles.lastEvent} numberOfLines={1}>
              {lastEvent}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Score display */}
      {scoreboard.sport === "football" ? (
        <FootballScoreView scoreboard={scoreboard} />
      ) : (
        <CricketScoreView scoreboard={scoreboard} />
      )}

      {/* Updated timestamp */}
      <View style={styles.footer}>
        <Text style={styles.updatedAt}>
          Last updated:{" "}
          {new Date(scoreboard.updatedAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  header: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  matchName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f1f5f9",
  },
  roomLabel: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  sportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  sportBadge: {
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sportText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#22d3ee",
  },
  lastEvent: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  updatedAt: {
    fontSize: 12,
    color: "#475569",
  },
  hiddenCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  hiddenEmoji: {
    fontSize: 48,
  },
  hiddenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e2e8f0",
    marginTop: 16,
  },
  hiddenText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
