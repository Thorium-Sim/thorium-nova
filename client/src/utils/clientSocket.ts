import EventEmitter from "eventemitter3";
import ReconnectingWebSocket from "reconnecting-websocket";

export class ClientSocket extends EventEmitter {
  constructor(private socket: ReconnectingWebSocket) {
    super();
    socket.addEventListener("message", event => {
      if (typeof event.data === "string") {
        const messageData = JSON.parse(event.data);
        this.emit(messageData.type, messageData.data);
      }
    });
  }
  send(type: string, data: object) {
    this.socket.send(JSON.stringify({type, data}));
  }
}
