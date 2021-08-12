import type {GeckosServer} from "@geckos.io/server";
import {AuthData} from "@thorium/types";
import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";
import buildHTTPServer from "./httpServer";
import {ServerClient} from "../classes/Client";
import websocketPlugin from "fastify-websocket";

let io: GeckosServer | null = null;
export default io;

export async function applyDataChannel(
  app: ReturnType<typeof buildHTTPServer>,
  database: Pick<DataContext, "server" | "flight">,
  min: number,
  max: number
) {
  const {geckos, iceServers} = await import("@geckos.io/server");
  io = geckos({
    // autoManageBuffering: false,
    portRange: {min, max},
    // These ICE Servers assist with brokering connections over
    // the internet
    iceServers:
      process.env.NODE_ENV === "production"
        ? [{urls: "stun.stunprotocol.org:3478"}, ...iceServers]
        : [],
    // This authorization function is what associates the browser
    // clientId with the server channel.
    authorization: async auth => {
      try {
        if (!auth) return {};
        const data: AuthData = JSON.parse(auth);
        return {clientId: data.clientId};
      } catch (err) {
        let message = err;
        if (err instanceof Error) {
          message = err.message;
        }
        console.error("Error parsing client authorization:", message);
      }
    },
  });

  // This function is called every time a new client connects
  io.onConnection(async channel => {
    // Add or update this client in the database
    let client = database.server.clients[channel.userData.clientId];
    if (!client) {
      client = new ServerClient({id: channel.userData.clientId});
      database.server.clients[channel.userData.clientId] = client;
    }
    client.connected = true;
    await client.initDataChannel(channel, database);
    pubsub.publish("clientList");
  });

  // Connect the Geckos WebRTC handlers to the HTTP server.
  io.addServer(app.server);

  // Set up WebSockets too, but only for NetSend, NetRequest
  app.register(websocketPlugin);

  app.get("/ws", {websocket: true}, async (connection, req) => {
    const authData = req.cookies["x-websocket-auth"];
    try {
      if (typeof authData === "string") {
        const {clientId} = JSON.parse(authData);
        let client = database.server.clients[clientId];
        if (!client) {
          client = new ServerClient({id: clientId});
          database.server.clients[clientId] = client;
        }
        client.connected = true;
        await client.initWebSocket(connection, database);
        pubsub.publish("clientList");
      }
    } catch (err) {
      console.error(err);
    }
  });
}
