import { View, Text, Pressable, StyleSheet } from "react-native";
import type { MatchSummary } from "@/types/scoreboard";

type Props = {
  match: MatchSummary;
  isActive: boolean;
  onPress: () => void;
};

export function MatchCard({ match, isActive, onPress }: Props) {
  const sportColor = match.sport === "football" ? "#22d3ee" : "#a78bfa";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.sportBadge, { backgroundColor: sportColor + "20" }]}>
          <Text style={[styles.sportText, { color: sportColor }]}>
            {match.sport === "football" ? "⚽" : "🏏"} {match.sport.toUpperCase()}
          </Text>
        </View>
        {match.status === "live" ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.finishedBadge}>
            <Text style={styles.finishedText}>FINISHED</Text>
          </View>
        )}
      </View>

      <Text style={styles.matchName} numberOfLines={1}>
        {match.matchName}
      </Text>

      <Text style={styles.timestamp}>
        {new Date(match.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 16,
    gap: 10,
  },
  cardActive: {
    borderColor: "rgba(34, 211, 238, 0.4)",
    backgroundColor: "rgba(34, 211, 238, 0.06)",
  },
  cardPressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sportBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sportText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#10b981",
  },
  finishedBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  finishedText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#64748b",
  },
  matchName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  timestamp: {
    fontSize: 12,
    color: "#64748b",
  },
});
