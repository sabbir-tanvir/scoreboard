import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#020617",
          },
          headerTintColor: "#e2e8f0",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#020617",
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Scoreboard",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="live/[roomId]"
          options={{
            title: "Live Match",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
});
