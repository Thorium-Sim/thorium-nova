import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";
import buildHTTPServer from "./httpServer";
import {ServerClient} from "../classes/Client";
import websocketPlugin from "fastify-websocket";

export async function applyDataChannel(
  app: ReturnType<typeof buildHTTPServer>,
  database: Pick<DataContext, "server" | "flight">
) {
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
        pubsub.publish("clients");
      }
    } catch (err) {
      console.error(err);
    }
  });
}
