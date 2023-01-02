import ReconnectingWebSocket from "reconnecting-websocket";

const hostname = window.location.hostname;
const protocol = window.location.protocol;

export async function loadWebSocket() {
  try {
    const port =
      process.env.NODE_ENV === "production"
        ? parseInt(window.location.port) || 4444
        : 3001;

    const socketUrl = `${
      protocol === "https:" ? "wss" : "ws"
    }://${hostname}:${port}/ws`;

    const socket = new ReconnectingWebSocket(socketUrl, [], {
      minReconnectionDelay: 500,
    });

    await new Promise<ReconnectingWebSocket>((res, rej) => {
      socket.onopen = () => res(socket);
    });
    return socket;
  } catch (err) {
    return Promise.reject(err);
  }
}
