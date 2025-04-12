import { decode } from "@msgpack/msgpack";
import {
	SnapshotInterpolation,
	type Types,
} from "@thorium/utils/snapshot-interpolation/src";
import EventEmitter from "eventemitter3";
import type ReconnectingWebSocket from "reconnecting-websocket";

export class ClientSocket extends EventEmitter {
	SI: SnapshotInterpolation;
	constructor(
		private socket: ReconnectingWebSocket,
		fps: number,
	) {
		super();
		this.SI = new SnapshotInterpolation(fps);
		socket.addEventListener("message", (event) => {
			if (event.data instanceof Blob) {
				event.data.arrayBuffer().then((result) => {
					const data = decode(result) as
						| { type: string; data: any }
						| Types.Snapshot;
					if ("type" in data) {
						this.emit(data.type, data.data);
					} else {
						this.SI.snapshot.add(data);
					}
				});
			} else if (typeof event.data === "string") {
				try {
					const data = JSON.parse(event.data);
					this.emit(data.type, data.data);
				} catch {
					// Do nothing
				}
			}
		});
	}
	send(type: string, data: object) {
		this.socket.send(JSON.stringify({ type, ...data }));
	}
	close() {
		this.socket.close();
	}
}
