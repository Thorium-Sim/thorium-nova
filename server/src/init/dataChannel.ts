import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";
import buildHTTPServer from "./httpServer";
import {ServerClient} from "../classes/Client";
import websocketPlugin from "fastify-websocket";
import {RawData} from "ws";
import {AuthData} from "@thorium/types";

const hostSecret = process.env.HOST_SECRET || "";

export async function applyDataChannel(
  app: ReturnType<typeof buildHTTPServer>,
  database: Pick<DataContext, "server" | "flight">
) {
  // Set up WebSockets too, but only for NetSend, NetRequest
  app.register(websocketPlugin);

  app.get("/ws", {websocket: true}, async (connection, req) => {
    try {
      const authData = (await Promise.race([
        new Promise(res => {
          const handleConnection = (data: RawData) => {
            const message = JSON.parse(data.toString()) as AuthData;
            if (message.type === "clientConnect") {
              res(message);
            }
          };
          connection.socket.on("message", handleConnection);
        }),
        new Promise((res, rej) =>
          setTimeout(() => rej(`Client Connect Timeout`), 5000)
        ),
      ])) as AuthData;

      const clientId = authData.clientId;
      let client = database.server.clients[clientId];

      if (!client) {
        client = new ServerClient({id: clientId});
        database.server.clients[clientId] = client;
      }
      if (authData.hostSecret === hostSecret) {
        client.isHost = true;
      }
      client.connected = true;
      await client.initWebSocket(connection, database);
      pubsub.publish("clients");
    } catch (err) {
      connection.socket.close();
      console.error(err);
    }
  });
}
