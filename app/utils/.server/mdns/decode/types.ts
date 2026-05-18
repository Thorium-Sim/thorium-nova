export enum Flag {
	Disabled = 0,
	Enabled,
}

export enum DnsClass {
	/** The Internet */
	IN = 1,
	/** The CSNET class (obsolete) */
	CS,
	/** The CHAOS class*/
	CH,
	/** Hesiod [Dyer 87] */
	HS,
	/** Any*/
	ANY = 255,
}

/* HEADER - see RFC 1035 section 4.1.1

																1  1  1  1  1  1
	0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      ID                       |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    QDCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ANCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    NSCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                    ARCOUNT                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

*/

enum OpcodeFlag {
	/** A standard query. */
	Query = 0,
	/** An inverse query. */
	IQuery,
	/** A server status request. */
	Status,
	/** Reserved for future use. */
	Reserved,
}

export enum RcodeFlag {
	/** No error condition. */
	NoError = 0,
	/** The name server was unable to interpret the query. */
	FormatError,
	/** The name server was unable to process the query due to a problem with the name server. */
	ServerFailure,
	/** Meaningful only for responses from an authoritative name server, this code signifies that the domain name referenced in the query does not exist. */
	NameError,
	/** The name server does not support the requested kind of query. */
	NotImplemented,
	/** The name server refuses to perform the specified operation for policy reasons. */
	Refused,
	/** Reserved for future use. */
	Reserved,
}

export type DnsMessageHeader = {
	/** A 16 bit identifier assigned by the program. Copied to corresponding replies.*/
	ID: number;
	/** Is this message a query or a response? 0 is Query, 1 is Response. */
	QR: Flag;
	/** The kind of query in this message. */
	OPCODE: OpcodeFlag;
	/** Whether the responding name server is an authority for the domain in question. */
	AA: Flag;
	/** Whether this message was truncated or not. */
	TC: Flag;
	/** Whether query recursion is desired. */
	RD: Flag;
	/** Whether recursion is available or not. */
	RA: Flag;
	/** Reserved for future use. */
	Z: Flag;
	/** Whether the data included has been verified by the server providing it. */
	AD: Flag;
	/** Whether non-verified data is acceptable to the resolver sending the query. */
	CD: Flag;
	/** Response code. */
	RCODE: RcodeFlag;
	/** The number of entries in the question section */
	QDCOUNT: number;
	/** The number of entries in the answer section */
	ANCOUNT: number;
	/** The number of name server resource records in the the authority records section. */
	NSCOUNT: number;
	/** The number of resource records in the additional records section. */
	ARCOUNT: number;
};

/* QUESTION SECTION see RFC 1035 section 4.1.2

																 1  1  1  1  1  1
	0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                                               |
/                     QNAME                     /
/                                               /
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     QTYPE                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     QCLASS                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

*/

/** A DNS Resource Record type. Only record types relevant to multicast DNS are described here. */
export enum ResourceType {
	/** a host address */
	A = 1,
	/** a domain name pointer */
	PTR = 12,
	/** text strings */
	TXT = 16,
	/** A IPv6 host address*/
	AAAA = 28,
	/** A service */
	SRV = 33,
	/** Authenticated proof of the non-existence of DNS owner names and types */
	NSEC = 47,
	/** A request for any records */
	ANY = 255,
}

export type DnsQuestionSection = {
	/** A domain name represented as a sequence of labels */
	QNAME: string[];
	/** The type of the query. */
	QTYPE: ResourceType;
	/** The class of the query */
	QCLASS: DnsClass;
};

/* Resource record format - see RFC 1035 section 4.1.3

																1  1  1  1  1  1
	0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                                               |
/                                               /
/                      NAME                     /
|                                               |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      TYPE                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                     CLASS                     |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                      TTL                      |
|                                               |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
|                   RDLENGTH                    |
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--|
/                     RDATA                     /
/                                               /
+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
*/

export interface ResourceRecordUnknown {
	/** A domain name represented as a sequence of labels */
	NAME: string[];
	/** The type of the answer. */
	TYPE: ResourceType;
	/** The class of the answer */
	CLASS: DnsClass;
	/** Length of time **in seconds** this record should be considered valid for. */
	TTL: number;
	/** Length of resource data */
	RDLENGTH: number;
	/** Resource data */
	RDATA: unknown;
	/** Whether the cache-flush bit was set on this record */
	isUnique: boolean;
}

export interface ResourceRecordA extends ResourceRecordUnknown {
	TYPE: ResourceType.A;
	/** IP address */
	RDATA: number[];
}

export interface ResourceRecordPTR extends ResourceRecordUnknown {
	TYPE: ResourceType.PTR;
	/** A label sequence, e.g. [my, blog, com]*/
	RDATA: string[];
}

export interface ResourceRecordTXT extends ResourceRecordUnknown {
	TYPE: ResourceType.TXT;
	RDATA: Record<
		string,
		/** Uint8Array is a defined value. `true` indicates presence of attribute with no value. `null` indicates presence of attribute with empty value. */
		Uint8Array | true | null
	>;
}

export interface ResourceRecordAAAA extends ResourceRecordUnknown {
	TYPE: ResourceType.AAAA;
	/** IPv6 address */
	RDATA: string;
}

export interface ResourceRecordSRV extends ResourceRecordUnknown {
	TYPE: ResourceType.SRV;
	RDATA: {
		priority: number;
		weight: number;
		port: number;
		/** A label sequence, e.g. [my, blog, com]*/
		target: string[];
	};
}

export interface ResourceRecordNSEC extends ResourceRecordUnknown {
	TYPE: ResourceType.NSEC;
	RDATA: {
		/** A label sequence, e.g. [my, blog, com]*/
		nextDomainName: string[];
		types: number[];
	};
}

export interface ResourceRecordAny extends ResourceRecordUnknown {
	RDATA: Uint8Array;
}

export type ResourceRecord =
	| ResourceRecordA
	| ResourceRecordPTR
	| ResourceRecordTXT
	| ResourceRecordAAAA
	| ResourceRecordSRV
	| ResourceRecordNSEC
	| ResourceRecordAny;

/*

	+---------------------+
	|        Header       |
	+---------------------+
	|       Question      | the question for the name server
	+---------------------+
	|        Answer       | RRs answering the question
	+---------------------+
	|      Authority      | RRs pointing toward an authority
	+---------------------+
	|      Additional     | RRs holding additional information
	+---------------------+

*/

/** A parsed DNS message. */
export type DnsMessage = {
	header: DnsMessageHeader;
	/** Question(s) for DNS responders */
	question: DnsQuestionSection[];
	/** Resource records answering queries */
	answer: ResourceRecord[];
	/** Resource records pointing towards an authority. */
	authority: ResourceRecord[];
	/** Resource records related to this message. */
	additional: ResourceRecord[];
};

// Some compression related types

/** A series of labels which may or may not end with a pointer. */
export type LabelSequence = {
	labels: string[];
	pointer: null | [number, number];
};

/** A record of byte offsets of a label indexed by its position within a label sequence.*/
export type LabelSeqOffsets = Record<number, number>;

/** Nested records, first depth represents the index of a set of labels, second depth represents the position within that sequence.  */
export type ManyLabelSeqOffsets = Record<number, LabelSeqOffsets>;

// The area of js-has-no-pattern-matching shame

export function isResourceRecordA(rr: ResourceRecord): rr is ResourceRecordA {
	return rr.TYPE === ResourceType.A;
}

export function isResourceRecordPTR(rr: ResourceRecord): rr is ResourceRecordPTR {
	return rr.TYPE === ResourceType.PTR;
}

export function isResourceRecordTXT(rr: ResourceRecord): rr is ResourceRecordTXT {
	return rr.TYPE === ResourceType.TXT;
}

export function isResourceRecordAAAA(rr: ResourceRecord): rr is ResourceRecordAAAA {
	return rr.TYPE === ResourceType.AAAA;
}

export function isResourceRecordSRV(rr: ResourceRecord): rr is ResourceRecordSRV {
	return rr.TYPE === ResourceType.SRV;
}

export function isResourceRecordNSEC(rr: ResourceRecord): rr is ResourceRecordNSEC {
	return rr.TYPE === ResourceType.NSEC;
}
