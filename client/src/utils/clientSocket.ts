import {SnapshotInterpolation, Types} from "@geckos.io/snapshot-interpolation";
import {decode} from "@msgpack/msgpack";
import EventEmitter from "eventemitter3";
import ReconnectingWebSocket from "reconnecting-websocket";

const serverFPS = 3;
export const SI = new SnapshotInterpolation(serverFPS);
export class ClientSocket extends EventEmitter {
  constructor(private socket: ReconnectingWebSocket) {
    super();
    socket.addEventListener("message", event => {
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          if (reader.result instanceof ArrayBuffer) {
            const data = decode(reader.result) as Types.Snapshot;
            SI.snapshot.add(data);
          }
        });
        reader.readAsArrayBuffer(event.data);
      }

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
