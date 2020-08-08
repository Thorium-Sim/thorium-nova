/* istanbul ignore file */
// This kind of thing is better handled by an E2E test

import geckos, {ServerChannel, Data} from "@geckos.io/server";
import http from "http";
import App from "../app";

export interface GeckoChannel {}
export default function setupUDP(server: http.Server) {
  const io = geckos();
  io.addServer(server);
  io.onConnection((channel: ServerChannel) => {
    channel.onDisconnect(() => {
      console.warn(`${channel.id} got disconnected`);
    });
    channel.on("client connect", (clientId: Data) => {
      channel.userData.clientId = clientId;
      const client = App.storage.clients.find(c => c.id === clientId);
      if (client) {
        client.channel = channel;
      }
    });
    channel.on("chat message", (data: Data) => {
      // emit the "chat message" data to all channels in the same room
      io.room(channel.roomId).emit(
        "chat message",
        `${channel.userData.clientId}:${data}`
      );
    });
  });
}
