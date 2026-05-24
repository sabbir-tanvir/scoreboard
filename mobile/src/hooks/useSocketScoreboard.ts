import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import type { ScoreboardState } from "@/types/scoreboard";

export function useSocketScoreboard(roomId?: string) {
  const setConnected = useScoreboardStore((state) => state.setConnected);
  const setLastEvent = useScoreboardStore((state) => state.setLastEvent);
  const setScoreboard = useScoreboardStore((state) => state.setScoreboard);

  useEffect(() => {
    socket.auth = { roomId: roomId ?? "default" };
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = (message: string) => setLastEvent(message);
    const onState = (state: ScoreboardState) => setScoreboard(state);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("scoreboard:message", onMessage);
    socket.on("scoreboard:state", onState);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("scoreboard:message", onMessage);
      socket.off("scoreboard:state", onState);
      socket.disconnect();
    };
  }, [roomId, setConnected, setLastEvent, setScoreboard]);
}
