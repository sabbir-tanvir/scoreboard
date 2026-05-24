import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listMatches } from "@/lib/api";
import { socket } from "@/lib/socket";
import { MatchCard } from "@/components/MatchCard";
import type { MatchSummary } from "@/types/scoreboard";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchMatches = useCallback(async () => {
    try {
      setError("");
      const response = await listMatches();
      setMatches(response.matches);
    } catch {
      setError("Could not load matches. Is the server running?");
      setMatches([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  // Listen for real-time match list updates
  useEffect(() => {
    socket.auth = {};
    socket.connect();

    const onMatchesUpdated = () => {
      void fetchMatches();
    };

    socket.on("matches:updated", onMatchesUpdated);
    return () => {
      socket.off("matches:updated", onMatchesUpdated);
      socket.disconnect();
    };
  }, [fetchMatches]);

  const liveMatches = matches.filter((m) => m.status === "live");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>LIVE SCOREBOARD</Text>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.headerSubtitle}>
          {liveMatches.length} live · {finishedMatches.length} finished
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.roomId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22d3ee"
            colors={["#22d3ee"]}
          />
        }
        ListHeaderComponent={
          liveMatches.length > 0 ? (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>
                {liveMatches.length} Live Now
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          // Insert "Previous" section header before first finished match
          const isFirstFinished =
            item.status === "finished" &&
            (index === 0 || matches[index - 1].status === "live");

          return (
            <>
              {isFirstFinished && finishedMatches.length > 0 ? (
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                  <Text style={styles.sectionTitleMuted}>Previous Matches</Text>
                </View>
              ) : null}
              <MatchCard
                match={item}
                isActive={false}
                onPress={() =>
                  router.push({
                    pathname: "/live/[roomId]",
                    params: { roomId: item.roomId },
                  })
                }
              />
            </>
          );
        }}
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏟️</Text>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyText}>
                Pull down to refresh, or wait for an admin to create a match.
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#22d3ee",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#f1f5f9",
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  sectionTitleMuted: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  separator: {
    height: 10,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    padding: 24,
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fca5a5",
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#f87171",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
