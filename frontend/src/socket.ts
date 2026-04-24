/// <reference types="vite/client" />
import { io } from "socket.io-client";

const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
const socketUrl = apiUrl.replace(/\/api\/?$/, "");

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
