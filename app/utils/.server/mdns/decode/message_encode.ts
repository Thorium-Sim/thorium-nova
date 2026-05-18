import { concat } from "@thorium/utils/.server/mdns/concat";

import {
	type DnsMessage,
	type DnsMessageHeader,
	type DnsQuestionSection,
	isResourceRecordA,
	isResourceRecordAAAA,
	isResourceRecordNSEC,
	isResourceRecordPTR,
	isResourceRecordSRV,
	isResourceRecordTXT,
	type LabelSeqOffsets,
	type LabelSequence,
	type ManyLabelSeqOffsets,
	type ResourceRecord,
	type ResourceRecordA,
	type ResourceRecordNSEC,
	type ResourceRecordSRV,
} from "./types";

/** Encode a DNS message as Uint8Array.
 *
 * Compresses domain names, so re-encoded messages may come out smaller.
 *
 * Will never use the `TC` flag in the header.
 */
export function encodeMessage(msg: DnsMessage): Uint8Array {
	// Encode header
	const header = encodeHeader(msg.header);

	// Extract all labels for compression.

	const questionLabels = msg.question.map((q) => q.QNAME);
	const answerLabels = msg.answer.flatMap(extractResourceDataLabels);
	const authorityLabels = msg.authority.flatMap(extractResourceDataLabels);
	const additionalLabels = msg.additional.flatMap(extractResourceDataLabels);

	const allLabels = [...questionLabels, ...answerLabels, ...authorityLabels, ...additionalLabels];

	const compressedLabels = compressLabels(allLabels);

	const messageBytes: Uint8Array[] = [];

	/*

  Here's where things start to get squirrely.
  We know which labels in the message can be compressed,
  but we don't know their offsets in the final message yet
  because the message has not yet been written!

  So every time we encode some labels, we get back their written offsets
  within the message, which are used by subsequent encodings of messages.
  */

	let manyLabelOffsets: ManyLabelSeqOffsets = {};
	let offset = header.byteLength;

	// Encode question section
	for (let i = 0; i < msg.question.length; i++) {
		const question = msg.question[i];

		const { bytes, encodedLabelOffsets } = encodeQuestion(
			question,
			compressedLabels[i],
			manyLabelOffsets,
			offset,
		);

		offset += bytes.byteLength;
		messageBytes.push(bytes);
		// Take the offsets of encoded labels and put them in our offsets record
		// The index used is the position of the label sequence within the DNS message.
		manyLabelOffsets = {
			...manyLabelOffsets,
			[i]: encodedLabelOffsets,
		};
	}

	const allResourceRecords = [...msg.answer, ...msg.authority, ...msg.additional];

	/*

  Another fiddly thing. Each Resource record has a label sequence in its NAME
  but depending on the type of resource record, its RDATA may also have a label sequence too!
  So we need to manually maintain this index to make a meaningful map of label offsets.

  We will also use this index to access the compressed labels we generated at the start
  of this function call.

  */

	let labelSeqIdx = msg.question.length;

	for (let i = 0; i < allResourceRecords.length; i++) {
		const rr = allResourceRecords[i];

		// Encode all of the resource record except for the RDATA.
		// This is because the RDATA may have compressed labels in it...
		// ... which may point to labels written in the record's name!
		// So we need to have encoded that first and saved position.
		const { bytes: mostRRBytes, encodedLabelOffsets } = encodeResourceRecord(
			rr,
			compressedLabels[labelSeqIdx],
			manyLabelOffsets,
			offset,
		);

		offset += mostRRBytes.byteLength;
		messageBytes.push(mostRRBytes);
		// Put the offsets of freshly encoded labels in the label offset map...
		manyLabelOffsets = {
			...manyLabelOffsets,
			[labelSeqIdx]: encodedLabelOffsets,
		};

		labelSeqIdx += 1;

		let rdataBytes: Uint8Array;

		if (isResourceRecordA(rr)) {
			rdataBytes = encodeRdataA(rr);
		} else if (isResourceRecordPTR(rr)) {
			// PTR can have compressed labels in it!
			// Get the (possibly compressed) label sequence for this RDATA
			const labelSeq = compressedLabels[labelSeqIdx];

			const { bytes, encodedLabelOffsets } = encodeRdataPTR(labelSeq, manyLabelOffsets, offset);

			rdataBytes = bytes;

			// Put offsets of encoded labels into the label offset map...
			manyLabelOffsets = {
				...manyLabelOffsets,
				[labelSeqIdx]: encodedLabelOffsets,
			};
			labelSeqIdx += 1;
		} else if (isResourceRecordTXT(rr)) {
			rdataBytes = encodeRdataTXT(rr.RDATA);
		} else if (isResourceRecordAAAA(rr)) {
			rdataBytes = encodeRdataAAAA(rr.RDATA);
		} else if (isResourceRecordSRV(rr)) {
			// SRV can have compressed labels in it!
			// Get the (possibly compressed ) label sequence for this RDATA
			const labelSeq = compressedLabels[labelSeqIdx];

			const { bytes, encodedLabelOffsets } = encodeRdataSRV(rr, labelSeq, manyLabelOffsets, offset);

			rdataBytes = bytes;
			// Put offsets of encoded labels into the label offset map...
			manyLabelOffsets = {
				...manyLabelOffsets,
				[labelSeqIdx]: encodedLabelOffsets,
			};
			labelSeqIdx += 1;
		} else if (isResourceRecordNSEC(rr)) {
			// NSEC can have compressed labels in it!
			// Get the (possibly compressed ) label sequence for this RDATA
			const labelSeq = compressedLabels[labelSeqIdx];

			const { bytes, encodedLabelOffsets } = encodeRdataNSEC(
				rr,
				labelSeq,
				manyLabelOffsets,
				offset,
			);

			rdataBytes = bytes;
			// Put offsets of encoded labels into the label offset map...
			manyLabelOffsets = {
				...manyLabelOffsets,
				[labelSeqIdx]: encodedLabelOffsets,
			};
			labelSeqIdx += 1;
		} else {
			// The data is already Uint8Array, just shove it in there.
			rdataBytes = rr.RDATA;
		}

		// One last thing! We might have changed the RDLENGTH of the given message with our compression.
		// So we need to update that to reflect the RDATA's new length;
		if (rr.RDLENGTH !== rdataBytes.byteLength) {
			updateRdataLength(mostRRBytes, rdataBytes.byteLength);
		}

		offset += rdataBytes.byteLength;
		messageBytes.push(rdataBytes);
	}

	return concat([header, ...messageBytes]);
}

function encodeHeader(header: DnsMessageHeader): Uint8Array {
	const ui8 = new Uint8Array(12);
	const view = new DataView(ui8.buffer);

	// Set the ID

	view.setUint16(0, header.ID);

	// Set the flags

	let flags = 0;

	flags += (header.QR << 15) & 0x8000;
	flags += (header.OPCODE << 11) & 0x7800;
	flags += (header.AA << 10) & 0x400;
	flags += (header.TC << 9) & 0x200;
	flags += (header.RD << 8) & 0x100;
	flags += (header.RA << 7) & 0x80;
	flags += (header.Z << 6) & 0x40;
	flags += (header.AD << 5) & 0x20;
	flags += (header.CD << 4) & 0x10;
	flags += header.RCODE & 0xf;

	view.setUint16(2, flags);

	// Set the counts

	view.setUint16(4, header.QDCOUNT);
	view.setUint16(6, header.ANCOUNT);
	view.setUint16(8, header.NSCOUNT);
	view.setUint16(10, header.ARCOUNT);

	return ui8;
}

/** Takes a series of a label sequences and iterates through them, determining whether the suffix of the current label sequence has appeared before, and pointing to a previous label sequence if so.
 * ```
 * [i, like, cheese]
 * [you, love, cheese]
 * [we, love, cheese]
 * ```
 *
 * becomes
 *
 * ```
 * (labels: [i, like, cheese], pointer: null)
 * (labels: [you, love], pointer: [0, 2])
 * (labels: [we], pointer: [1, 1])
 * ```
 */
function compressLabels(labels: string[][]): LabelSequence[] {
	const compressedLabels: LabelSequence[] = [];

	// This is a very naive algorithm which could doubtlessly be made more efficient.

	// For each name to be added to the message
	for (let i = 0; i < labels.length; i++) {
		// For each suffix of the name...

		// For each suffix already in the message...
		const prevLabels = labels.slice(0, i);

		const current = labels[i];

		if (prevLabels.length === 0) {
			compressedLabels.push({
				labels: current,
				pointer: null,
			});
			continue;
		}

		let didCompress = false;

		// Work backwards through all previous label sequences before this one
		for (let i = prevLabels.length - 1; i >= 0; i--) {
			const prev = prevLabels[i];

			//	If the suffixes match
			const currentReversed = [...current].reverse();
			const prevReversed = [...prev].reverse();

			/** This is the offset of the label we'll point to within its own label sequence */
			let compressionOffset = null;
			/** This is how many labels we managed to compress out of this label sequence */
			let compressedLength = 0;

			// Work backwards through the two label sequences,
			// comparing each label to see if they have a matching suffix.
			for (let seqIdx = 0; seqIdx <= prevReversed.length - 1; seqIdx++) {
				const currLabel = currentReversed[seqIdx];
				const prevLabel = prevReversed[seqIdx];

				if (currLabel !== prevLabel) {
					// The suffix doesn't match from here on out, bail.
					break;
				}

				compressionOffset = prev.length - seqIdx - 1;
				compressedLength = seqIdx + 1;
			}

			if (compressionOffset && compressedLabels[i].labels[compressionOffset] === undefined) {
				// This can happen if the label sequence we're pointing to
				// has been compressed itself, so this offset points to nothing!
				// So what we'll do is go to the next one, and eventually find
				// the canonical label.
				continue;
			}

			if (compressionOffset !== null && compressedLabels[i].labels[compressionOffset]) {
				compressedLabels.push({
					// Only put in the labels we couldn't compress
					labels: current.slice(0, current.length - compressedLength),
					// Point at the label we'll actually use
					pointer: [i, compressionOffset],
				});
				didCompress = true;
				break;
			}
		}

		// Couldn't find any compressable labels, just add our ordinary labels with no pointer.
		if (didCompress === false) {
			compressedLabels.push({
				labels: current,
				pointer: null,
			});
		}
	}

	return compressedLabels;
}

function encodeQuestion(
	/** The question to encode. */
	question: DnsQuestionSection,
	/** The label sequence of this question, with optional pointer. */
	labelSequence: LabelSequence,
	/** The offsets of previously encoded labels. */
	manyLabelOffsets: ManyLabelSeqOffsets,
	questionOffset: number,
): {
	/** The encoded question */
	bytes: Uint8Array;
	/** The **absolute** offsets of label sequences in the encoded message. */
	encodedLabelOffsets: LabelSeqOffsets;
} {
	// get label bytes
	const { bytes: labelBytes, newLabelOffsets } = encodeLabelSequence(
		labelSequence,
		manyLabelOffsets,
	);

	const typeClassBytes = new Uint8Array(4);
	const typeClassDataView = new DataView(typeClassBytes.buffer);

	typeClassDataView.setUint16(0, question.QTYPE);
	typeClassDataView.setUint16(2, question.QCLASS);

	return {
		bytes: concat([labelBytes, typeClassBytes]),
		encodedLabelOffsets: offsetPositions(newLabelOffsets, questionOffset),
	};
}

/** Encodes *most* of a Resource record, just not the RDATA. */
function encodeResourceRecord(
	/** The resource record to be encoded. */
	resourceRecord: ResourceRecord,
	/** The label sequence (with optional pointer) of the record's NAME */
	nameLabelSeq: LabelSequence,
	/** The offsets of previously encoded labels. */
	manyLabelSeqOffsets: ManyLabelSeqOffsets,
	offset: number,
): {
	/** The encoded resource record (excluding RDATA) */
	bytes: Uint8Array;
	/** The **absolute** position of the encoded label in the bytes*/
	encodedLabelOffsets: LabelSeqOffsets;
} {
	// get label bytes

	const { bytes: labelBytes, newLabelOffsets } = encodeLabelSequence(
		nameLabelSeq,
		manyLabelSeqOffsets,
	);

	const otherBytes = new Uint8Array(10);
	const otherDataView = new DataView(otherBytes.buffer);

	const classWithCacheFlushBit = resourceRecord.isUnique
		? resourceRecord.CLASS | 0x8000
		: resourceRecord.CLASS;

	otherDataView.setUint16(0, resourceRecord.TYPE);
	otherDataView.setUint16(2, classWithCacheFlushBit);
	otherDataView.setUint32(4, resourceRecord.TTL);
	otherDataView.setUint16(8, resourceRecord.RDLENGTH);

	return {
		bytes: concat([labelBytes, otherBytes]),
		encodedLabelOffsets: offsetPositions(newLabelOffsets, offset),
	};
}

export function encodeRdataA(resourceRecord: ResourceRecordA): Uint8Array {
	const aRecordBytes = new Uint8Array(4);

	// e.g. 192.168.0.0

	for (let i = 0; i < 4; i++) {
		aRecordBytes[i] = resourceRecord.RDATA[i];
	}

	return aRecordBytes;
}

function encodeRdataPTR(
	labelSeq: LabelSequence,
	manyLabelSeqOffsets: ManyLabelSeqOffsets,
	offset: number,
): {
	bytes: Uint8Array;
	encodedLabelOffsets: LabelSeqOffsets;
} {
	const { bytes, newLabelOffsets } = encodeLabelSequence(labelSeq, manyLabelSeqOffsets);

	return {
		bytes,
		encodedLabelOffsets: offsetPositions(newLabelOffsets, offset),
	};
}

export function encodeRdataTXT(attributes: Record<string, Uint8Array | true | null>): Uint8Array {
	if (Object.keys(attributes).length === 0) {
		// Empty TXT record. Technically invalid, but we don't validate here.
		return new Uint8Array(1);
	}

	const attributesBytes: Uint8Array[] = [];

	for (const key in attributes) {
		const value = attributes[key];

		const keyChars = Array.from(key);

		const keyCharsByteLength = new TextEncoder().encode(keyChars.join("")).length;

		/** The length of this whole attribute segment (including value) */
		const attrLength =
			value === true
				? // Then it's only as long as the key
					keyCharsByteLength
				: value === null
					? // Then it's as long as the key with an =
						keyCharsByteLength + 1
					: // Then it's as long as the key with an = and the value
						keyCharsByteLength + 1 + value.byteLength;

		/** The length of the Uint8 preceding the value bytes. */
		const ui8Length =
			value === true
				? // Then it's only as long as the key
					keyCharsByteLength
				: keyCharsByteLength + 1;

		const attrBytes = new Uint8Array(1 + ui8Length);
		const attrView = new DataView(attrBytes.buffer);

		attrView.setUint8(0, attrLength);

		let position = 1;

		// Set attribute name characters.
		for (const char of keyChars) {
			attrView.setUint8(position, char.charCodeAt(0));
			position += 1;
		}

		if (value === null) {
			attrView.setUint8(position, "=".charCodeAt(0));

			attributesBytes.push(attrBytes);
		} else if (value instanceof Uint8Array) {
			attrView.setUint8(position, "=".charCodeAt(0));

			attributesBytes.push(concat([attrBytes, value]));
			continue;
		} else {
			attributesBytes.push(attrBytes);
		}
	}

	return concat(attributesBytes);
}

export function encodeRdataAAAA(ipv6Addr: string): Uint8Array {
	const addr = "0" + ipv6Addr;
	const parts = addr.split(":");

	for (let i = 0; i < parts.length; i++) {
		const sedectet = parts[i];

		if (!sedectet) {
			parts[i] = "0";
			while (parts.length < 8) {
				parts.splice(i + 1, 0, "0");
			}
		}
	}

	const bytes = new Uint8Array(16);
	const dataView = new DataView(bytes.buffer);

	for (let i = 0; i < parts.length; i++) {
		dataView.setUint16(i * 2, parseInt(parts[i], 16));
	}

	return bytes;
}

function encodeRdataSRV(
	record: ResourceRecordSRV,
	labelSeq: LabelSequence,
	manyLabelSeqOffsets: ManyLabelSeqOffsets,
	offset: number,
): {
	bytes: Uint8Array;
	encodedLabelOffsets: LabelSeqOffsets;
} {
	const srvBytes = new Uint8Array(6);
	const srvView = new DataView(srvBytes.buffer);

	srvView.setUint16(0, record.RDATA.priority);
	srvView.setUint16(2, record.RDATA.weight);
	srvView.setUint16(4, record.RDATA.port);

	const { bytes: labelBytes, newLabelOffsets } = encodeLabelSequence(labelSeq, manyLabelSeqOffsets);

	return {
		bytes: concat([srvBytes, labelBytes]),
		encodedLabelOffsets: offsetPositions(newLabelOffsets, 6 + offset),
	};
}

function encodeRdataNSEC(
	record: ResourceRecordNSEC,
	labelSeq: LabelSequence,
	manyLabelSeqOffsets: ManyLabelSeqOffsets,
	offset: number,
): {
	bytes: Uint8Array;
	encodedLabelOffsets: LabelSeqOffsets;
} {
	const { bytes: labelBytes, newLabelOffsets } = encodeLabelSequence(labelSeq, manyLabelSeqOffsets);

	const rrTypes = [...new Set(record.RDATA.types)].filter((x) => x <= 255);

	const maskLength = rrTypes ? Math.ceil(Math.max(...rrTypes) / 8) : 0;

	const masks = Array(maskLength).fill(0);

	for (const type of rrTypes) {
		const index = ~~(type / 8); // which mask this rrtype is on
		const bit = 7 - (type % 8); // convert to network bit order

		masks[index] |= 1 << bit;
	}

	const maskBytes = new Uint8Array(2 + masks.length);
	const maskView = new DataView(maskBytes.buffer);

	maskView.setUint8(0, 0);
	maskView.setUint8(1, maskLength);

	for (let i = 0; i < masks.length; i++) {
		const mask = masks[i];

		maskView.setUint8(i + 2, mask);
	}

	return {
		bytes: concat([labelBytes, maskBytes]),
		encodedLabelOffsets: offsetPositions(newLabelOffsets, offset),
	};
}

/** Encodes a sequence of labels, adding compression pointers if necessary. */
function encodeLabelSequence(
	/** The label sequence to be encoded. */
	labelSequence: LabelSequence,
	/** A multi-dimensional record of the positions of previously encoded label sequences.*/
	manyLabelOffsets: ManyLabelSeqOffsets,
): {
	/** The encoded label sequence. */
	bytes: Uint8Array;
	/** The byte offsets of encoded labels, relative to the returned encoded label sequence. */
	newLabelOffsets: LabelSeqOffsets;
} {
	if (labelSequence.labels.length === 0) {
		// TODO: handle 0-length string
	}

	/** How long all of the labels in this sequence will be in bytes */
	const labelsLength = labelSequence.labels.reduce((prev, next) => {
		// Add an extra 1 for the length byte
		return prev + 1 + next.length;
	}, 0);

	/** The length of a pointer in bytes */
	const pointerLength = labelSequence.pointer ? 2 : 0;
	/** The length of the terminator, if present */
	const terminatorLength = labelSequence.pointer ? 0 : 1;

	const bytes = new Uint8Array(labelsLength + pointerLength + terminatorLength);
	const dataView = new DataView(bytes.buffer);

	let position = 0;

	const newLabelPositions: LabelSeqOffsets = {};

	for (let i = 0; i < labelSequence.labels.length; i++) {
		newLabelPositions[i] = position;

		const label = labelSequence.labels[i];

		// First byte is length
		dataView.setUint8(position, label.length);

		position += 1;

		// Followed by label characters
		for (let charIdx = 0; charIdx < label.length; charIdx++) {
			dataView.setUint8(position, label[charIdx].charCodeAt(0));
			position += 1;
		}
	}

	if (labelSequence.pointer) {
		const [i1, i2] = labelSequence.pointer;

		const offset = manyLabelOffsets[i1][i2];

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

		dataView.setUint16(position, 0xc000 + offset);

		position += 2;
	} else {
		dataView.setUint8(position, 0);
	}

	return {
		bytes,
		newLabelOffsets: newLabelPositions,
	};
}

function extractResourceDataLabels(rr: ResourceRecord): string[][] {
	// if ptr
	if (isResourceRecordPTR(rr)) {
		return [rr.NAME, rr.RDATA];
	}

	if (isResourceRecordSRV(rr)) {
		return [rr.NAME, rr.RDATA.target];
	}

	if (isResourceRecordNSEC(rr)) {
		return [rr.NAME, rr.RDATA.nextDomainName];
	}

	return [rr.NAME];
}

/** Offset all the ...offsets... by a given number*/
function offsetPositions(labelPositions: LabelSeqOffsets, offset: number) {
	const newPositions: LabelSeqOffsets = {};

	for (const key in labelPositions) {
		newPositions[key] = labelPositions[key] + offset;
	}

	return newPositions;
}

function updateRdataLength(bytes: Uint8Array, newLength: number) {
	const view = new DataView(bytes.buffer);

	let offset = null;
	let pos = 0;

	// Find the end of the variable-length label sequence
	while (offset === null) {
		const length = view.getUint8(pos);

		// End of the label sequence
		if (length === 0) {
			offset = pos + 1;
		}

		// Compression marker
		if (length >= 192) {
			offset = pos + 2;
		}

		// Another length thing
		pos += length + 1;
	}

	view.setUint16(offset + 8, newLength);

	return bytes;
}
