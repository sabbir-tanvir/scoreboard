import type { Server } from "socket.io";
import { getOrCreateMatch } from "./matchStore.js";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    const roomId = String(socket.handshake.auth?.roomId ?? "default");
    void socket.join(roomId);

    void (async () => {
      const match = await getOrCreateMatch(roomId);
      socket.emit("scoreboard:state", match.state);
      socket.emit("scoreboard:message", `Connected to ${match.matchName}`);
    })();

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
