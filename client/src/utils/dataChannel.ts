import {getTabId} from "@thorium/tab-id";
import {AuthData} from "@thorium/types";
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

    const authData: AuthData = {clientId: await getTabId()};
    document.cookie = `x-websocket-auth=${JSON.stringify(authData)}`;
    const socket = new ReconnectingWebSocket(socketUrl, [], {
      minReconnectionDelay: 500,
    });

    return new Promise<ReconnectingWebSocket>((res, rej) => {
      socket.onopen = () => res(socket);
    });
  } catch (err) {
    return Promise.reject(err);
  }
}
