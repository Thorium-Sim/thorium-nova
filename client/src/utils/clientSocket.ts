import {SnapshotInterpolation, Types} from "@geckos.io/snapshot-interpolation";
import {decode} from "@msgpack/msgpack";
import EventEmitter from "eventemitter3";
import ReconnectingWebSocket from "reconnecting-websocket";

const serverFPS = 3;
export let SI = new SnapshotInterpolation(serverFPS);
export class ClientSocket extends EventEmitter {
  constructor(private socket: ReconnectingWebSocket) {
    super();
    socket.addEventListener("message", event => {
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          if (reader.result instanceof ArrayBuffer) {
            const data = decode(reader.result) as
              | {type: string; data: any}
              | Types.Snapshot;
            if ("type" in data) {
              this.emit(data.type, data.data);
            } else {
              SI.snapshot.add(data);
            }
          }
        });
        reader.readAsArrayBuffer(event.data);
      }
    });
  }
  send(type: string, data: object) {
    this.socket.send(JSON.stringify({type, data}));
  }
}
