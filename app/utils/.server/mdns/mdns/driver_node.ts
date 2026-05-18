import { Buffer } from "node:buffer";
import { createSocket, type RemoteInfo, Socket } from "node:dgram";
import { hostname, networkInterfaces } from "node:os";

import { FastFIFO } from "../fast_fifo";
import { MDNS_IPV4, MDNS_IPV6, MDNS_PORT } from "./constants";
import type { MulticastDriver } from "./multicast_interface";

/** A multicast driver using Node's `dgram` module. */
export class DriverNode implements MulticastDriver {
	private socket: Socket;
	private messages = new FastFIFO<[Uint8Array, { hostname: string; port: number }]>(16);

	family: "IPv4" | "IPv6";
	address: string;
	hostname: string = hostname();

	constructor(family: "IPv4" | "IPv6") {
		this.family = family;
		const socket = createSocket(family === "IPv4" ? "udp4" : "udp6");

		this.socket = socket;
		this.address = family === "IPv4" ? "0.0.0.0" : "::";

		socket.bind(MDNS_PORT, undefined, () => {
			socket.addMembership(family === "IPv4" ? MDNS_IPV4 : MDNS_IPV6);
		});

		socket.on("message", (msg: Buffer, rinfo: RemoteInfo) => {
			this.messages.push([msg, { hostname: rinfo.address, port: rinfo.port }]);
		});
	}

	send(message: Uint8Array): Promise<void> {
		return new Promise((res) => {
			this.socket.send(message, MDNS_PORT, this.family === "IPv4" ? MDNS_IPV4 : MDNS_IPV6, () => {
				res();
			});
		});
	}

	setTTL(ttl: number): Promise<void> {
		this.socket.setMulticastTTL(ttl);

		return Promise.resolve();
	}

	setLoopback(loopback: boolean): Promise<void> {
		this.socket.setMulticastLoopback(loopback);

		return Promise.resolve();
	}

	receive(): Promise<[Uint8Array, { hostname: string; port: number }]> {
		const h = Promise.withResolvers<[Uint8Array, { hostname: string; port: number }]>();

		(async () => {
			for await (const msg of this.messages) {
				h.resolve(msg);
				break;
			}
		})();

		return h.promise;
	}

	isOwnAddress(address: string): boolean {
		const interfaces = networkInterfaces();

		for (const key in interfaces) {
			const intf = networkInterfaces()[key];

			// oxlint-disable-next-line typescript/no-for-in-array
			for (const addr in intf) {
				if (addr === address) {
					return true;
				}
			}
		}

		return false;
	}

	close(): void {
		this.socket.close();
	}
}
