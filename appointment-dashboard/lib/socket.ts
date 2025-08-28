import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: false,
  reconnectionAttempts: 0,
  reconnectionDelay: 0,
  timeout: 0,
  withCredentials: false,
});
