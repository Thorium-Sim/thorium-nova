/* istanbul ignore file */
// This kind of thing is better handled by an E2E test

import geckos, {ClientChannel} from "@geckos.io/client";
import {getClientId} from "./getClientId";

const port =
  process.env.NODE_ENV === "production"
    ? parseInt(window.location.port || "3000", 10)
    : parseInt(window.location.port || "3000", 10) + 1;

let channel: ClientChannel;

export default async function getUDPChannel() {
  if (!channel) {
    const clientId = await getClientId();
    channel = geckos({port});

    channel.onConnect(error => {
      if (error) {
        console.error(error.message);
        return;
      }
      channel.emit("client connect", clientId);
      channel.on("chat message", data => {
        console.info(`You got the message ${data}`);
      });

      channel.emit("chat message", "a short message sent to the server");
    });
  }
  return channel;
}
