import {ClientChannel, geckos} from "@geckos.io/client";
import {getTabId} from "@thorium/tab-id";
import {AuthData} from "@thorium/types";
import ReconnectingWebSocket from "reconnecting-websocket";

const hostname = window.location.hostname;
const protocol = window.location.protocol;

const geckosUrl = `${protocol}//${hostname}`;
let channel!: ClientChannel;

export async function loadDataChannel() {
  try {
    const port =
      process.env.NODE_ENV === "production"
        ? parseInt(window.location.port) || 4444
        : 3001;

    const authData: AuthData = {clientId: await getTabId()};
    channel = geckos({
      url: geckosUrl,
      port,
      authorization: JSON.stringify(authData),
    });

    return new Promise<ClientChannel>((res, rej) => {
      channel.onConnect(error => {
        if (error) {
          console.error("Error with connection", error);
          return rej(error);
        } else {
          return res(channel);
        }
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function loadWebSocket() {
  try {
    const port =
      process.env.NODE_ENV === "production"
        ? parseInt(window.location.port) || 4444
        : 3001;

    const socketUrl = `${
      protocol === "https" ? "wss" : "ws"
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
export default channel;
