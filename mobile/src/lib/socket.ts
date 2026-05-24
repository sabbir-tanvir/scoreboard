import { io } from "socket.io-client";
import { SOCKET_URL } from "@/constants/config";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
