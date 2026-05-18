import { concat } from "@thorium/utils/.server/mdns/concat";

import { encodeRdataA, encodeRdataAAAA, encodeRdataTXT } from "../decode/message_encode";
import {
	isResourceRecordA,
	isResourceRecordAAAA,
	isResourceRecordNSEC,
	isResourceRecordPTR,
	isResourceRecordSRV,
	isResourceRecordTXT,
	type ResourceRecord,
	type ResourceRecordNSEC,
	type ResourceRecordSRV,
} from "../decode/types";
import { MulticastInterface } from "./multicast_interface";

export type RespondingRecord = ResourceRecord & {
	/** Records which should be included in the additional section of the DNS message when this record is used in a response. */
	additional?: ResourceRecord[];
};

export type RespondOpts = {
	/** The DNS records a responder wants to be authoritative for */
	proposedRecords: RespondingRecord[];
	multicastInterface: MulticastInterface;
	signal?: AbortSignal;
};

/** Compare two records to determine lexicographical order. */
export function recordSort(a: ResourceRecord, b: ResourceRecord): 1 | 0 | -1 {
	if (a.CLASS < b.CLASS) {
		return -1;
	} else if (a.CLASS > b.CLASS) {
		return 1;
	}

	if (a.TYPE < b.TYPE) {
		return -1;
	} else if (a.TYPE > b.TYPE) {
		return 1;
	}

	// Now we have to compare RDATA. Great. I didn't plan for this,
	// so RDATA is only in its decoded form here. We need to quickly re-encode it.
	// This might actually be better because the RDATA must be decompressed first.
	let rdataA: Uint8Array;
	let rdataB: Uint8Array;

	if (isResourceRecordA(a) && isResourceRecordA(b)) {
		rdataA = encodeRdataA(a);
		rdataB = encodeRdataA(b);
	} else if (isResourceRecordPTR(a) && isResourceRecordPTR(b)) {
		rdataA = encodeRdataPTR(a.RDATA);
		rdataB = encodeRdataPTR(b.RDATA);
	} else if (isResourceRecordTXT(a) && isResourceRecordTXT(b)) {
		rdataA = encodeRdataTXT(a.RDATA);
		rdataB = encodeRdataTXT(b.RDATA);
	} else if (isResourceRecordAAAA(a) && isResourceRecordAAAA(b)) {
		rdataA = encodeRdataAAAA(a.RDATA);
		rdataB = encodeRdataAAAA(b.RDATA);
	} else if (isResourceRecordSRV(a) && isResourceRecordSRV(b)) {
		rdataA = encodeRdataSRV(a);
		rdataB = encodeRdataSRV(b);
	} else if (isResourceRecordNSEC(a) && isResourceRecordNSEC(b)) {
		rdataA = encodeRdataNSEC(a);
		rdataB = encodeRdataNSEC(b);
	} else {
		rdataA = a.RDATA as Uint8Array;
		rdataB = b.RDATA as Uint8Array;
	}

	const aView = new DataView(rdataA.buffer);
	const bView = new DataView(rdataB.buffer);

	for (let i = 0; i < Math.max(rdataA.byteLength, rdataB.byteLength); i++) {
		if (i >= rdataA.byteLength) {
			return -1;
		}

		const aNum = aView.getUint8(i);

		if (i >= rdataB.byteLength) {
			return 1;
		}

		const bNum = bView.getUint8(i);

		if (aNum > bNum) {
			return 1;
		} else if (aNum < bNum) {
			return -1;
		}
	}

	return 0;
}

/** Checks if two records conflict with each other.
 *
 * This is when the have the same name and type, but different RDATA.
 */
export function isConflicting(a: ResourceRecord, b: ResourceRecord) {
	if (a.isUnique === false || b.isUnique === false) {
		return false;
	}

	const isSameType = a.TYPE === b.TYPE;

	if (isSameType === false) {
		return false;
	}

	const isSameName = a.NAME.join(".").toUpperCase() === b.NAME.join(".").toUpperCase();

	if (isSameName === false) {
		return false;
	}

	// Records conflict if they have the same name and type but different RDATA.
	const order = recordSort(a, b);

	if (order === 0) {
		return false;
	}

	return true;
}

// Slightly different encoding methods (which do not support decompression)
// Which are only used to compare RDATA.
// Duplication over over-abstraction, man

function encodeRdataPTR(labelSeq: string[]): Uint8Array {
	return encodeLabelSequence(labelSeq);
}

function encodeRdataSRV(record: ResourceRecordSRV): Uint8Array {
	const srvBytes = new Uint8Array(6);
	const srvView = new DataView(srvBytes.buffer);

	srvView.setUint16(0, record.RDATA.priority);
	srvView.setUint16(2, record.RDATA.weight);
	srvView.setUint16(4, record.RDATA.port);

	const labelBytes = encodeLabelSequence(record.NAME);

	return concat([srvBytes, labelBytes]);
}

function encodeRdataNSEC(record: ResourceRecordNSEC): Uint8Array {
	const labelBytes = encodeLabelSequence(record.NAME);

	const maskLength = record.RDATA.types.length ? Math.ceil(Math.max(...record.RDATA.types) / 8) : 0;

	const masks = Array(maskLength).fill(0);

	for (const type of record.RDATA.types) {
		const index = ~~(type / 8); // which mask this rrtype is on
		const bit = 7 - (type % 8); // convert to network bit order

		masks[index] |= 1 << bit;
	}

	const maskBytes = new Uint8Array(2 + maskLength);
	const maskView = new DataView(maskBytes.buffer);

	maskView.setUint8(0, 0);
	maskView.setUint8(1, maskLength);

	for (let i = 0; i < masks.length; i++) {
		const mask = masks[i];

		maskView.setUint8(i + 2, mask);
	}

	return concat([labelBytes, maskBytes]);
}

function encodeLabelSequence(
	/** The label sequence to be encoded. */
	labelSequence: string[],
): Uint8Array {
	if (labelSequence.length === 0) {
		// TODO: handle 0-length string
	}

	/** How long all of the labels in this sequence will be in bytes */
	const labelsLength = labelSequence.reduce((prev, next) => {
		// Add an extra 1 for the length byte
		return prev + 1 + next.length;
	}, 0);

	/** The length of a pointer in bytes */
	const pointerLength = 0;
	/** The length of the terminator, if present */
	const terminatorLength = 1;

	const bytes = new Uint8Array(labelsLength + pointerLength + terminatorLength);
	const dataView = new DataView(bytes.buffer);

	let position = 0;

	for (let i = 0; i < labelSequence.length; i++) {
		const label = labelSequence[i];

		// First byte is length
		dataView.setUint8(position, label.length);

		position += 1;

		// Followed by label characters
		for (let charIdx = 0; charIdx < label.length; charIdx++) {
			dataView.setUint8(position, label[charIdx].charCodeAt(0));
			position += 1;
		}
	}

	dataView.setUint8(position, 0);

	return bytes;
}
