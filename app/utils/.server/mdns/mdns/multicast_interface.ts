import { DriverNode } from "@thorium/utils/.server/mdns/mdns/driver_node";

import { decodeMessage } from "../decode/message_decode";
import { encodeMessage } from "../decode/message_encode";
import type { DnsMessage } from "../decode/types";
import { FastFIFO } from "../fast_fifo";

/** A driver which supplies the underlying methods a `MulticastInterface` uses to send and receive multicast messages. */
export interface MulticastDriver {
	family: "IPv4" | "IPv6";

	hostname: string;

	send(message: Uint8Array): Promise<void>;

	setTTL(ttl: number): Promise<void>;

	receive(): Promise<[Uint8Array, { hostname: string; port: number }]>;

	setLoopback(loopback: boolean): Promise<void>;

	/** Check if a given address belongs to this interface. */
	isOwnAddress(address: string): boolean;

	close(): void;
}

/** An interface used to send and receive multicast messages, as well as other actions such as toggling multicast loopback.
 *
 * If no driver is specified, selects a `MulticastDriver` appropriate to the current runtime.
 */
export class MulticastInterface {
	private driver: MulticastDriver;
	private subscribers: FastFIFO<[DnsMessage, { hostname: string; port: number }]>[] = [];

	constructor(driver: MulticastDriver = new DriverNode("IPv4")) {
		this.driver = driver;
		const subscribers = this.subscribers;

		(async () => {
			while (true) {
				const [received, origin] = await driver.receive();

				try {
					const event = [decodeMessage(received), origin] as [
						DnsMessage,
						{ hostname: string; port: number },
					];

					for (const subscriber of subscribers) {
						subscriber.push(event);
					}
				} catch {
					console.warn("Could not decode a message from", origin.hostname);
				}
			}
		})();
	}

	/** Send a DNS message. */
	send(message: DnsMessage): Promise<void> {
		const encoded = encodeMessage(message);

		return this.driver.send(encoded);
	}

	/** Set the time-to-live (TTL). */
	setTTL(ttl: number): void {
		if (this.driver.family === "IPv4") {
			this.driver.setTTL(ttl);
		}
	}

	/** Set the loopback (whether messages sent from this machine are received by itself). */
	setLoopback(loopback: boolean): void {
		this.driver.setLoopback(loopback);
	}

	/** Iterator of received messages. */
	messages(): AsyncIterable<[DnsMessage, { hostname: string; port: number }]> {
		const subscriber = new FastFIFO<[DnsMessage, { hostname: string; port: number }]>(16);

		this.subscribers.push(subscriber);

		return subscriber;
	}

	/** Return if a host address is our own address. */
	isOwnAddress(address: string): boolean {
		return this.driver.isOwnAddress(address);
	}

	get hostname(): string {
		return this.driver.hostname;
	}

	/** Whether this interface uses IPv4 or IPv6 */
	get family(): "IPv4" | "IPv6" {
		return this.driver.family;
	}
}
