import {
	type DnsMessage,
	type DnsMessageHeader,
	type DnsQuestionSection,
	type ResourceRecord,
	type ResourceRecordTXT,
	ResourceType,
} from "./types";

/** Decode a DNS message from `Uint8Array`.
 *
 * Resource Records of the following types will have their RDATA decoded: `A`, `PTR`, `TXT`, `AAAA`, `SRV`, `NSEC`. Other types of resource records will have their RDATA left as `Uint8Array`.
 */
export function decodeMessage(message: Uint8Array): DnsMessage {
	const header = decodeHeader(message);

	let position = 12;

	const question: DnsQuestionSection[] = [];
	const answer: ResourceRecord[] = [];
	const authority: ResourceRecord[] = [];
	const additional: ResourceRecord[] = [];

	if (header.QDCOUNT > 0) {
		let questionPosition = position;

		for (let currentQuestion = 0; currentQuestion < header.QDCOUNT; currentQuestion++) {
			const { result, nextPosition } = decodeQuestion(message, questionPosition);

			question.push(result);

			questionPosition = nextPosition;
		}

		position = questionPosition;
	}

	if (header.ANCOUNT > 0) {
		let answerPosition = position;

		for (let currentAnswer = 0; currentAnswer < header.ANCOUNT; currentAnswer++) {
			const { result, nextPosition } = decodeResourceRecord(message, answerPosition);

			answer.push(result);

			answerPosition = nextPosition;
		}

		position = answerPosition;
	}

	if (header.NSCOUNT > 0) {
		let authorityPosition = position;

		for (let currentAuthority = 0; currentAuthority < header.NSCOUNT; currentAuthority++) {
			const { result, nextPosition } = decodeResourceRecord(message, authorityPosition);

			authority.push(result);

			authorityPosition = nextPosition;
		}

		position = authorityPosition;
	}

	if (header.ARCOUNT > 0) {
		let additionalPosition = position;

		for (let currentAdditional = 0; currentAdditional < header.ARCOUNT; currentAdditional++) {
			const { result, nextPosition } = decodeResourceRecord(message, additionalPosition);

			additional.push(result);

			additionalPosition = nextPosition;
		}

		position = additionalPosition;
	}

	return {
		header,
		question,
		answer,
		authority,
		additional,
	};
}

export function decodeHeader(message: Uint8Array): DnsMessageHeader {
	const dataView = new DataView(message.buffer);
	const id = dataView.getUint16(0, false);
	const flags = dataView.getUint16(2, false);
	const qdCount = dataView.getUint16(4, false);
	const anCount = dataView.getUint16(6, false);
	const nsCount = dataView.getUint16(8, false);
	const arCount = dataView.getUint16(10, false);

	return {
		ID: id,
		QR: (flags & 0x8000) >> 15,
		OPCODE: (flags & 0x7800) >> 11,
		AA: (flags & 0x400) >> 10,
		TC: (flags & 0x200) >> 9,
		RD: (flags & 0x100) >> 8,
		RA: (flags & 0x80) >> 7,
		Z: (flags & 0x40) >> 6,
		AD: (flags & 0x20) >> 5,
		CD: (flags & 0x10) >> 4,
		RCODE: flags & 0xf,
		QDCOUNT: qdCount,
		ANCOUNT: anCount,
		NSCOUNT: nsCount,
		ARCOUNT: arCount,
	};
}

export function decodeQuestion(
	message: Uint8Array,
	/** The position of this question within its DNS message's bytes */
	startPosition: number,
): {
	result: DnsQuestionSection;
	/**  The position immediately following this question  */
	nextPosition: number;
} {
	const dataView = new DataView(message.buffer);

	const { labels, nextPosition } = decodeLabels(message, startPosition);

	const qType = dataView.getUint16(nextPosition);
	const qClass = dataView.getUint16(nextPosition + 2);

	return {
		result: {
			QNAME: labels,
			QTYPE: qType,
			QCLASS: qClass,
		},
		nextPosition: nextPosition + 4,
	};
}

export function decodeResourceRecord(
	message: Uint8Array,
	/** The position of this question within its DNS message's bytes */
	startPosition: number,
): {
	result: ResourceRecord;
	/** The position immediately following this resource record */
	nextPosition: number;
} {
	const dataView = new DataView(message.buffer);

	const { labels, nextPosition } = decodeLabels(message, startPosition);

	const resourceType = dataView.getUint16(nextPosition);
	const resourceClass = dataView.getUint16(nextPosition + 2);

	const resourceTTL = dataView.getUint32(nextPosition + 4);
	const rdataLength = dataView.getUint16(nextPosition + 8);

	const decodedData = decodeRdata(resourceType, message, nextPosition + 10, rdataLength);

	return {
		result: {
			NAME: labels,
			TYPE: resourceType,
			CLASS: resourceClass & ~0x8000,
			TTL: resourceTTL,
			RDLENGTH: rdataLength,
			RDATA: decodedData,
			isUnique: !!(resourceClass & 0x8000),
		} as ResourceRecord,
		nextPosition: nextPosition + 10 + rdataLength,
	};
}

export function decodeRdata(
	type: ResourceType,
	message: Uint8Array,
	rdataPosition: number,
	rdataLength: number,
): ResourceRecord["RDATA"] {
	switch (type) {
		case ResourceType.A: {
			return [
				message[rdataPosition],
				message[rdataPosition + 1],
				message[rdataPosition + 2],
				message[rdataPosition + 3],
			];
		}

		case ResourceType.PTR: {
			return decodeLabels(message, rdataPosition).labels;
		}

		case ResourceType.TXT: {
			const view = new DataView(message.buffer);

			if (rdataLength === 1) {
				return {};
			}

			const attributes: ResourceRecordTXT["RDATA"] = {};

			let attrPosition = rdataPosition;

			while (attrPosition < rdataPosition + rdataLength) {
				/** The length of this attribute, including value (if present) */
				const txtLength = view.getUint8(attrPosition);

				/** To build the attribute name with. */
				let currentAttribute = "";
				/** Whether we've passed the = symbol in this attribute yet. */
				let passedEqual = false;
				let value: Uint8Array | true | null = true;

				for (let i = 1; i <= txtLength; i++) {
					if (passedEqual) {
						// Pull the remaining bytes of this attribute out.

						value = message.subarray(attrPosition + i, attrPosition + txtLength + 1);

						break;
					}

					const char = String.fromCharCode(message[attrPosition + i]);

					if (char === "=") {
						// Stop building the attribute name here.
						passedEqual = true;
						// If there won't be a next iteration of this loop
						// (and thus no assignment of a value to this attribute)
						// then this attribute is something=, indicating a null value
						// for this attribute.
						value = null;
						continue;
					}

					if (!passedEqual) {
						currentAttribute = currentAttribute + char;
					}
				}

				attributes[currentAttribute] = value;

				attrPosition = attrPosition + txtLength + 1;
			}

			return attributes;
		}

		case ResourceType.AAAA: {
			const rawView = new DataView(message.buffer);

			const parts: string[] = [];

			for (let i = rdataPosition; i < rdataPosition + rdataLength; i += 2) {
				const part = rawView.getUint16(i, false);

				parts.push(part.toString(16));
			}

			return parts
				.join(":")
				.replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3")
				.replace(/:{3,4}/, "::");
		}

		case ResourceType.SRV: {
			const view = new DataView(message.buffer);

			return {
				priority: view.getUint16(rdataPosition, false),
				weight: view.getUint16(rdataPosition + 2, false),
				port: view.getUint16(rdataPosition + 4, false),
				target: decodeLabels(message, rdataPosition + 6).labels,
			};
		}

		case ResourceType.NSEC: {
			const view = new DataView(message.buffer);

			const { labels, nextPosition } = decodeLabels(message, rdataPosition);

			const windowBlock = view.getUint8(nextPosition); //
			const windowBlockLength = view.getUint8(nextPosition + 1);

			// Ignore rrtypes over 255 (only implementing the restricted form)
			// Bitfield length must always be < 32, otherwise skip parsing
			if (windowBlock !== 0 || windowBlockLength > 32) {
				return message.subarray(rdataPosition, rdataPosition + rdataLength);
			}

			const typesList = [];

			for (let i = 0; i < windowBlockLength; i++) {
				const mask = view.getUint8(nextPosition + 2 + i);

				if (mask === 0) {
					continue;
				}

				for (let bit = 0; bit < 8; bit++) {
					if (mask & (1 << bit)) {
						const rrtype = 8 * i + (7 - bit);
						typesList.push(rrtype);
					}
				}
			}

			return {
				nextDomainName: labels,
				types: typesList,
			};
		}

		default:
			return message.subarray(rdataPosition, rdataPosition + rdataLength);
	}
}

function decodeLabels(
	message: Uint8Array,
	startPosition: number,
): {
	labels: string[];
	nextPosition: number;
} {
	const labels: string[] = [];

	let position = startPosition;

	const view = new DataView(message.buffer);

	while (view.getUint8(position) !== 0) {
		const labelLength = view.getUint8(position);

		if (labelLength >= 0xc0 /** 192 */) {
			/*

      The pointer takes the form of a two octet sequence:

          +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
          | 1  1|                OFFSET                   |
          +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

      The first two bits are ones.  This allows a pointer to be distinguished
      from a label, since the label must begin with two zero bits because
      labels are restricted to 63 octets or less.  (The 10 and 01 combinations
      are reserved for future use.)  The OFFSET field specifies an offset from
      the start of the message (i.e., the first octet of the ID field in the
      domain header).  A zero offset specifies the first byte of the ID field,
      etc.

      */

			const compressionPointer = (labelLength << 8) + view.getUint8(position + 1) - 0xc000;

			const { labels: compressedLabels } = decodeLabels(message, compressionPointer);

			labels.push(...compressedLabels);

			position += 2;

			return { labels, nextPosition: position };
		}

		if (position + labelLength > message.byteLength) {
			throw new Error(
				`Expected a string of ${labelLength} bytes length, but there are only ${
					message.byteLength - position
				} bytes left.`,
			);
		}

		const label: string[] = [];

		for (let i = position + 1; i <= position + labelLength; i++) {
			label.push(String.fromCharCode(message[i]));
		}

		labels.push(label.join(""));

		position += 1 + labelLength;

		continue;
	}

	return { labels, nextPosition: position + 1 };
}
