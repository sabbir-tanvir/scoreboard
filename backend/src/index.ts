import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { CLIENT_ORIGIN, PORT } from "./config/env.js";
import { closeMatchStore } from "./matchStore.js";
import { registerSocketHandlers } from "./socket.js";

async function startServer() {
  let io: Server;

  const app = createApp({
    onMatchUpdated: (match, message) => {
      io.to(match.roomId).emit("scoreboard:state", match.state);
      io.to(match.roomId).emit("scoreboard:message", message);
    },
  });
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
    },
  });

  registerSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    await closeMatchStore();
    server.close();
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

void startServer().catch((error) => {
  console.error("Failed to start backend", error);
  process.exitCode = 1;
});
