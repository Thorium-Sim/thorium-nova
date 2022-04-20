import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";
import buildHTTPServer from "./httpServer";
import {ServerClient} from "../classes/Client";
import websocketPlugin from "fastify-websocket";
import {RawData} from "ws";

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
            const message = JSON.parse(data.toString()) as {
              clientId: string;
              type: string;
            };
            if (message.type === "clientConnect") {
              res(message);
            }
          };
          connection.socket.on("message", handleConnection);
        }),
        new Promise((res, rej) =>
          setTimeout(() => rej(`Client Connect Timeout`), 5000)
        ),
      ])) as {clientId: string; type: string};

      const clientId = authData.clientId;
      let client = database.server.clients[clientId];
      if (!client) {
        client = new ServerClient({id: clientId});
        database.server.clients[clientId] = client;
      }
      client.connected = true;

      // If there is another client that is host, make this one not host
      if (
        Object.values(database.server.clients).some(
          c => c.id !== clientId && c.isHost && c.connected
        )
      ) {
        client.isHost = false;
      }
      // Assign the client as host if there aren't any other clients connected
      if (
        Object.values(database.server.clients).filter(
          c => c.connected && c.id !== clientId
        ).length === 0
      ) {
        client.isHost = true;
      }
      await client.initWebSocket(connection, database);
      pubsub.publish("thorium");
      pubsub.publish("clients");
      pubsub.publish("client", {clientId: client.id});
    } catch (err) {
      connection.socket.close();
      console.error(err);
    }
  });
}
