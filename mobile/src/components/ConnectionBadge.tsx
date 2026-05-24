import { View, Text, StyleSheet } from "react-native";

type Props = {
  connected: boolean;
};

export function ConnectionBadge({ connected }: Props) {
  return (
    <View
      style={[
        styles.badge,
        connected ? styles.connectedBg : styles.disconnectedBg,
      ]}
    >
      <View
        style={[
          styles.dot,
          connected ? styles.connectedDot : styles.disconnectedDot,
        ]}
      />
      <Text
        style={[
          styles.text,
          connected ? styles.connectedText : styles.disconnectedText,
        ]}
      >
        {connected ? "LIVE" : "OFFLINE"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedBg: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  disconnectedBg: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: "#10b981",
  },
  disconnectedDot: {
    backgroundColor: "#ef4444",
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  connectedText: {
    color: "#10b981",
  },
  disconnectedText: {
    color: "#ef4444",
  },
});
