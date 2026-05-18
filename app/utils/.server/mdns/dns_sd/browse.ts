import {
	isResourceRecordA,
	isResourceRecordAAAA,
	isResourceRecordPTR,
	isResourceRecordSRV,
	isResourceRecordTXT,
	type ResourceRecord,
	type ResourceRecordA,
	type ResourceRecordAAAA,
	type ResourceRecordPTR,
	type ResourceRecordSRV,
	type ResourceRecordTXT,
	ResourceType,
} from "../decode/types";
import { FastFIFO } from "../fast_fifo";
import { MulticastInterface } from "../mdns/multicast_interface";
import { type MdnsQuestion, Query } from "../mdns/query";

export type BrowseOpts = {
	/** The kind of service you wish to browse. */
	service: {
		type: string;
		protocol: "tcp" | "udp";
		subtypes?: string[];
	};
	multicastInterface: MulticastInterface;
	signal?: AbortSignal;
};

/** A service discovered via multicast DNS-SD. */
export type Service = {
	name: string;
	type: string;
	subtypes: string[];
	protocol: "tcp" | "udp";
	host: string;
	hostname: string;
	port: number;
	txt: Record<string, true | Uint8Array | null>;
	/** Whether the service is active or not. Will be `false` when a service responder has indicated it is going offline. */
	isActive: boolean;
};

/** Searches for DNS-SD services on the local network.
 *
 * ```
 * for await (
 *   const service of browse({
 *     multicastInterface: new MulticastInterface(),
 *     service: {
 *       protocol: "tcp",
 *       type: "http",
 *     },
 *   })
 * ) {
 *   if (service.isActive) {
 *   }
 * }
 * ```
 */
export function browse(opts: BrowseOpts): AsyncIterable<Service> {
	const subName = `${
		opts.service.subtypes && opts.service.subtypes.length > 0
			? `${opts.service.subtypes.map((sub) => `_${sub}`).join(".")}._sub.`
			: ""
	}`;

	const serviceName = `${subName}_${opts.service.type}._${opts.service.protocol}.local`;

	const questions: MdnsQuestion[] = [
		{
			name: serviceName,
			recordType: ResourceType.PTR,
		},
	];

	const ptrQuery = new Query(questions, opts.multicastInterface);

	if (opts.signal) {
		opts.signal.addEventListener("abort", () => {
			ptrQuery.end();
		});
	}

	const fifo = new FastFIFO<Service>(16);

	const services = new Map<string, ServiceResolver>();

	(async () => {
		for await (const event of ptrQuery) {
			switch (event.kind) {
				case "ADDED":
					// We need to add only one
					if (isResourceRecordPTR(event.record)) {
						// iterate over a service thing and relay its events.
						const key = event.record.RDATA.join(".");

						if (services.has(key)) {
							continue;
						}

						const service = new ServiceResolver(
							event.record,
							ptrQuery.additional(),
							opts.multicastInterface,
						);

						for await (const event of service) {
							fifo.push(event);
						}

						services.set(key, service);
					}
					break;
				case "EXPIRED":
					if (isResourceRecordPTR(event.record)) {
						const key = event.record.RDATA.join(".");

						const service = services.get(key);

						if (!service) {
							continue;
						}

						service.close();
						services.delete(key);
					}
			}
		}
	})();

	return fifo;
}

class ServiceResolver {
	private srvRecord: ResourceRecordSRV | null = null;
	private txtRecord: ResourceRecordTXT | null = null;
	private multicastInterface: MulticastInterface;
	private hostnameQuery: Query | null = null;
	private hostnameRecord: ResourceRecordA | ResourceRecordAAAA | null = null;
	private fifo = new FastFIFO<Service>(16);
	private serviceName: string;

	constructor(
		ptrRecord: ResourceRecordPTR,
		additionalRecords: ResourceRecord[],
		multicastInterface: MulticastInterface,
	) {
		this.multicastInterface = multicastInterface;

		// Get SRV and text records.

		this.serviceName = ptrRecord.RDATA.join(".");

		const srvRecord = additionalRecords.find((record) => {
			return (
				record.NAME.join(".").toUpperCase() === ptrRecord.RDATA.join(".").toUpperCase() &&
				record.TYPE === ResourceType.SRV
			);
		});

		const txtRecord = additionalRecords.find((record) => {
			return (
				record.NAME.join(".").toUpperCase() === ptrRecord.RDATA.join(".").toUpperCase() &&
				record.TYPE === ResourceType.TXT
			);
		});

		const hostNameResourceType =
			this.multicastInterface.family === "IPv4" ? ResourceType.A : ResourceType.AAAA;

		const aRecord = additionalRecords.find((record) => {
			return (
				record.NAME.join(".").toUpperCase() ===
					(srvRecord as ResourceRecordSRV)?.RDATA.target.join(".").toUpperCase() &&
				record.TYPE === hostNameResourceType
			);
		});

		if (txtRecord) {
			this.resolveTxt(txtRecord as ResourceRecordTXT);
		}

		// Ask for srv, txt if we don't have it
		if (!srvRecord || !txtRecord) {
			this.resolvePtr();
		} else if (srvRecord && !aRecord) {
			this.resolveSrv(srvRecord as ResourceRecordSRV);
		} else if (srvRecord && aRecord) {
			this.srvRecord = srvRecord as ResourceRecordSRV;
			this.hostnameRecord = aRecord as ResourceRecordA | ResourceRecordAAAA;

			this.update();
		}
	}

	resolvePtr() {
		const query = new Query(
			[
				{
					name: this.serviceName,
					recordType: ResourceType.SRV,
				},

				{
					name: this.serviceName,
					recordType: ResourceType.TXT,
				},
			],
			this.multicastInterface,
		);

		(async () => {
			for await (const event of query) {
				switch (event.kind) {
					case "ADDED": {
						if (isResourceRecordTXT(event.record)) {
							this.resolveTxt(event.record);
						} else if (isResourceRecordSRV(event.record)) {
							this.resolveSrv(event.record);
						}
					}
				}
				// TODO: flushed, expired.
			}
		})();
	}

	resolveTxt(record: ResourceRecordTXT) {
		this.txtRecord = record;

		// see if we can resolve a pending promise to be yielded.
		this.update();
	}

	async resolveSrv(record: ResourceRecordSRV) {
		// make a new query for A / AAAA record for this (use multicast interface family to determine which to ask for)
		const recordTypeToRequest =
			this.multicastInterface.family === "IPv4" ? ResourceType.A : ResourceType.AAAA;

		this.srvRecord = record;

		const existingQuery = this.hostnameQuery;

		if (existingQuery) {
			existingQuery.end();
		}

		const hostnameQuery = new Query(
			[
				{
					name: record.RDATA.target.join("."),
					recordType: recordTypeToRequest,
				},
			],
			this.multicastInterface,
		);

		this.hostnameQuery = hostnameQuery;

		for await (const event of hostnameQuery) {
			switch (event.kind) {
				case "ADDED": {
					if (isResourceRecordA(event.record) || isResourceRecordAAAA(event.record)) {
						this.hostnameRecord = event.record;

						this.update();
					}
					break;
				}
				case "EXPIRED":
				case "FLUSHED":
					if (isResourceRecordA(event.record) || isResourceRecordAAAA(event.record)) {
						this.hostnameRecord = event.record;
						this.update(true);
					}
					break;
			}
		}
	}

	update(wentInactive?: boolean) {
		if (!this.hostnameRecord) {
			return;
		}

		if (!this.srvRecord) {
			return;
		}

		if (!this.txtRecord) {
			return;
		}

		const hostName = isResourceRecordA(this.hostnameRecord)
			? this.hostnameRecord.RDATA.join(".")
			: this.hostnameRecord.RDATA;

		const { instanceName, type, subTypes, protocol } = parseServiceName(this.serviceName);

		this.fifo.push({
			name: instanceName,
			type: type,
			subtypes: subTypes,
			protocol: protocol,
			host: hostName,
			hostname: this.hostnameRecord.NAME.join("."),
			port: this.srvRecord.RDATA.port,
			txt: this.txtRecord.RDATA,
			isActive: !wentInactive,
		});
	}

	close() {
		this.update(true);
		this.fifo.close();
	}

	// Return an async iterator with events of being resolved, updated, going down.
	async *[Symbol.asyncIterator]() {
		for await (const res of this.fifo) {
			yield res;
		}
	}
}

function parseServiceName(name: string): {
	instanceName: string;
	subTypes: string[];
	type: string;
	protocol: "udp" | "tcp";
	domain: string;
} {
	const parts = name.split(".");

	const domain = parts[parts.length - 1];
	const protocol = parts[parts.length - 2].replace("_", "");
	const type = parts[parts.length - 3].replace("_", "");
	const instanceName = parts[0];

	const subTypes = [];

	if (parts.length > 4) {
		// Then there are sub types.
		const subTypesLength = parts.length - 4 - 1;

		for (let i = 0; i < subTypesLength; i++) {
			subTypes.push(parts[i + 1].replace("_", ""));
		}
	}

	return {
		instanceName,
		subTypes,
		type,
		protocol: protocol as "udp" | "tcp",
		domain,
	};
}
