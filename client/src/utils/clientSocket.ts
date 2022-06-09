import {SnapshotInterpolation, Types} from "@geckos.io/snapshot-interpolation";
import {InterpolatedSnapshot} from "@geckos.io/snapshot-interpolation/lib/types";
import {decode} from "@msgpack/msgpack";
import EventEmitter from "eventemitter3";
import ReconnectingWebSocket from "reconnecting-websocket";
import {SERVER_FPS} from "server/src/utils/constants";

export let SI = new SnapshotInterpolation(SERVER_FPS);

let dataSize = 0;
let time = Date.now();
export class ClientSocket extends EventEmitter {
  constructor(private socket: ReconnectingWebSocket) {
    super();
    socket.addEventListener("message", event => {
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          if (reader.result instanceof ArrayBuffer) {
            if (Date.now() - time > 1000) {
              // log in kilobits per second
              console.log(`${(dataSize / 1024) * 8} kbps`);
              time = Date.now();
              dataSize = 0;
            }
            dataSize += reader.result.byteLength;
            const data = decode(reader.result) as
              | {type: string; data: any}
              | Types.Snapshot;
            if ("type" in data) {
              this.emit(data.type, data.data);
            } else {
              console.log(data.state.length);
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
