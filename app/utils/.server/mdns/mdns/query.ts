import { DnsClass, type DnsMessage, type ResourceRecord, ResourceType } from "../decode/types";
import { FastFIFO } from "../fast_fifo";
import { MulticastInterface } from "./multicast_interface";
import { isConflicting, recordSort } from "./responder";

const ONE_SECOND_MS = 1000;

/** The number of milliseconds in an hour. */
const ONE_HOUR_MS = ONE_SECOND_MS * 60 * 60;

export type MdnsQuestion = {
	name: string;
	recordType: ResourceType;
};

/** A continuous multicast DNS query.
 *
 * Reports additions, flushes, and expirations of resource records answering the given query via an asynchronous iterator:
 *
 * ```ts
 * const query = new Query(
 *   [{ name: '_http._tcp.local', recordType: 255 }],
 *   multicastInterface: new MulticastInterface()
 * );
 *
 * for await (const event of query) {
 * }
 * ```
 */
export class Query {
	private questions: MdnsQuestion[];
	private minterface: MulticastInterface;
	private recordCache = new RecordCache({
		// Teach the cache how to query for expiring records
		onRequery: (record: ResourceRecord) => {
			this.sendQuery([
				{
					name: record.NAME.join("."),
					recordType: record.TYPE,
				},
			]);
		},
	});
	private scheduled: ReturnType<typeof setTimeout>[] = [];
	private ended = false;
	private suppressedQuestions = new Set<MdnsQuestion>();
	private additionalRecords = new SimpleRecordStore();

	constructor(questions: MdnsQuestion[], multicastInterface: MulticastInterface) {
		this.questions = questions;
		this.minterface = multicastInterface;

		// Send the initial query.
		this.scheduleInitialQuery();

		// Long running query for some records.
		(async () => {
			for await (const [message, host] of multicastInterface.messages()) {
				if (this.ended) {
					break;
				}

				if (multicastInterface.isOwnAddress(host.hostname)) {
					continue;
				}

				if (message.header.QR === 0) {
					this.handleQuery(message, host);
				} else {
					this.handleResponse(message);
				}
			}
		})();
	}

	private scheduleInitialQuery() {
		// Delay the initial query by random amount between 20 - 120ms.
		const fromNow = Math.random() * (120 - 20) + 20;

		this.scheduleQuery(fromNow, () => {
			this.scheduleFurtherQueries(ONE_SECOND_MS);
		});
	}

	private scheduleFurtherQueries(inMs: number) {
		// Send the query, send again after one second, and then by a factor of two each time. Cap it at 60 mins.
		this.scheduleQuery(inMs, () => {
			this.scheduleFurtherQueries(Math.min(inMs * 2, ONE_HOUR_MS));
		});
	}

	/** Gets all questions given to this Query which we do not already know the answer to, and which we have not recently seen asked by anyone else via multicast. */
	private getQuestions() {
		const validQuestions: MdnsQuestion[] = [];

		for (const question of this.questions) {
			// If it's a suppressed question, don't send it.
			if (this.suppressedQuestions.has(question)) {
				// We only want to suppress it once.

				this.suppressedQuestions.delete(question);
				continue;
			}

			// If it's a question we already know the answer to, don't send it.
			// But ONLY if it's a non-shared record.
			if (
				question.recordType !== ResourceType.PTR &&
				this.recordCache.knownAnswers([question]).length > 0
			) {
				continue;
			}

			validQuestions.push(question);
		}

		// Clear the suppressed questions.

		return validQuestions;
	}

	private scheduleQuery(inMs: number, onTimeout?: () => void) {
		const timer = setTimeout(() => {
			this.sendQuery();

			if (onTimeout) {
				onTimeout();
			}
		}, inMs);

		this.scheduled.push(timer);
	}

	private handleQuery(query: DnsMessage, host: { hostname: string; port: number }) {
		// It's a query.

		// Is this something we sent ourselves?
		if (this.minterface.isOwnAddress(host.hostname)) {
			return;
		}

		// can only suppress if the known answer section is empty
		if (query.answer.length > 0) {
			return;
		}

		// (7.3) If another
		// responder has asked the same question as one this query is about to send,
		// this query can suppress that question since someone already asked for it. So we reschedule the question.
		for (const question of query.question) {
			for (const ourQuestion of this.questions) {
				if (
					question.QTYPE === ourQuestion.recordType &&
					question.QNAME.join(".") === ourQuestion.name
				) {
					// SUPPRESS THAT CHATTY CATTY RIGHT NOW...
					this.suppressedQuestions.add(ourQuestion);
				}
			}
		}
	}

	private askedQuestionFor(record: ResourceRecord) {
		for (const question of this.questions) {
			const isRightType =
				record.TYPE === question.recordType || question.recordType === ResourceType.ANY;
			const isRightName = record.NAME.join(".").toUpperCase() === question.name.toUpperCase();

			if (isRightType && isRightName) {
				return true;
			}
		}

		return false;
	}

	private handleResponse(response: DnsMessage) {
		// Check if any of the records matches our query...
		let additionalAdded = false;

		for (const record of response.answer) {
			const answersAnyQuestion = this.askedQuestionFor(record);

			if (!answersAnyQuestion) {
				// Not a matching record
				continue;
			} else if (additionalAdded === false) {
				// Add all additional records to the cache if there were any answers in this response.
				for (const additionalRecord of response.additional) {
					this.additionalRecords.addRecord(additionalRecord);
				}

				additionalAdded = true;
			}

			// It IS a matching record, so add it to our cache.

			this.recordCache.addRecord(record);
		}
	}

	/** Sends a DNS query with given questions.
	 *
	 * If no questions are provided, uses the ones given to the `Query` at construction.
	 */
	private async sendQuery(questions?: MdnsQuestion[]) {
		const questionsToUse = questions || this.getQuestions();

		if (questionsToUse.length === 0) {
			return;
		}

		// Known answer suppression, RFC 6762 section 7.1.
		// Include answers we already know
		// These should only be shared, non-unique records.
		const knownAnswers = this.recordCache.knownAnswers(questionsToUse);

		const message: DnsMessage = {
			header: {
				ID: 0,
				QR: 0,
				OPCODE: 0,
				AA: 0,
				TC: 0,
				RD: 0,
				RA: 0,
				Z: 0,
				AD: 0,
				CD: 0,
				RCODE: 0,
				QDCOUNT: questionsToUse.length,
				ANCOUNT: knownAnswers.length,
				NSCOUNT: 0,
				ARCOUNT: 0,
			},
			question: questionsToUse.map((q) => ({
				QNAME: q.name.split("."),
				QTYPE: q.recordType,
				QCLASS: DnsClass.IN,
			})),
			answer: knownAnswers,
			authority: [],
			additional: [],
		};

		// Send it!
		await this.minterface.send(message);
	}

	/** All answers obtained over the life of this query. */
	answers(): ResourceRecord[] {
		return this.recordCache.getRecords();
	}

	/** All additional records obtained from responses which had valid answers in them. */
	additional(): ResourceRecord[] {
		return this.additionalRecords.getRecords();
	}

	/** Stop this query from running. */
	end() {
		this.ended = true;
		this.recordCache.close();
		// Clear all the timers.
		for (const timer of this.scheduled) {
			clearTimeout(timer);
		}
	}

	async *[Symbol.asyncIterator](): AsyncIterator<QueryCacheEvent> {
		for await (const event of this.recordCache.events) {
			yield event;
		}
	}
}

export type QueryCacheEvent = {
	kind: "ADDED" | "EXPIRED" | "FLUSHED";
	record: ResourceRecord;
};

class RecordCache {
	private records = new Map<ResourceRecord, ReturnType<typeof setTimeout>[]>();
	private onRequery: (record: ResourceRecord) => void;

	events = new FastFIFO<QueryCacheEvent>(16);

	constructor(opts: { onRequery: (record: ResourceRecord) => void }) {
		this.onRequery = opts.onRequery;
	}

	close() {
		for (const [record] of this.records) {
			this.removeRecord(record);
		}

		this.events.close();
	}

	getRecords(): ResourceRecord[] {
		return Array.from(this.records.keys());
	}

	addRecord(record: ResourceRecord) {
		const expire = () => {
			this.expireRecord(record);
		};

		const requery = () => {
			this.onRequery(record);
		};

		// Handle goodbye packets with a TTL of 0.
		if (record.TTL === 0) {
			// Set to expire in 1 second (section 10.1 of RFC 6762)
			this.records.set(record, [setTimeout(() => this.expireRecord(record), 1000)]);

			this.events.push({
				kind: "ADDED",
				record,
			});

			return;
		}

		// If it's unique, flush all records with same name, rrtype, and rrclass.
		if (record.isUnique) {
			for (const [prevRecord] of this.records) {
				if (
					isEqualRecordName(record.NAME, prevRecord.NAME) &&
					record.TYPE === prevRecord.TYPE &&
					record.CLASS === prevRecord.CLASS
				) {
					if (recordSort(record, prevRecord) === 0) {
						// RDATA is the same. Don't flush it.
						return;
					}

					this.removeRecord(prevRecord);

					this.events.push({
						kind: "FLUSHED",
						record: prevRecord,
					});
				}
			}
		}

		// schedule re-query at 80%-82% of record lifetime
		// 85%-87%
		// 90%-92%
		// and 95%-97%

		const timers = [
			setTimeout(expire, record.TTL * 1000),
			setTimeout(requery, wigglyPercentOf(80, record.TTL * 1000)),
			setTimeout(requery, wigglyPercentOf(85, record.TTL * 1000)),
			setTimeout(requery, wigglyPercentOf(90, record.TTL * 1000)),
			setTimeout(requery, wigglyPercentOf(95, record.TTL * 1000)),
		];

		this.records.set(record, timers);

		// Emit an addition
		this.events.push({
			kind: "ADDED",
			record,
		});
	}

	expireRecord(record: ResourceRecord) {
		this.removeRecord(record);

		// Requery for it one last time.
		this.onRequery(record);

		// Emit expiration
		this.events.push({
			kind: "EXPIRED",
			record,
		});
	}

	removeRecord(record: ResourceRecord) {
		const timers = this.records.get(record);

		if (timers) {
			for (const timer of timers) {
				clearTimeout(timer);
			}
		}

		this.records.delete(record);
	}

	/** Return all records in the cache matching a set of questions. Used for known-answer suppression.*/
	knownAnswers(questions: MdnsQuestion[]) {
		const knownAnswers = new Set<ResourceRecord>();

		for (const [record] of this.records) {
			let answersAnyQuestion = false;

			for (const question of questions) {
				if (
					record.TYPE === question.recordType &&
					record.NAME.join(".").toUpperCase() === question.name.toUpperCase()
				) {
					answersAnyQuestion = true;
				}
			}

			if (answersAnyQuestion) {
				knownAnswers.add(record);
			}
		}

		return Array.from(knownAnswers);
	}
}

/** A simple record store which replaces conflicting records. */
class SimpleRecordStore {
	private records = new Set<ResourceRecord>();

	addRecord(record: ResourceRecord) {
		for (const existingRecord of this.records) {
			if (isConflicting(record, existingRecord)) {
				this.records.delete(existingRecord);
			}
		}

		this.records.add(record);
	}

	getRecords() {
		return Array.from(this.records);
	}
}

/** Calculate the given percentage (with +2 wiggle) of a number  */
function wigglyPercentOf(percent: number, total: number) {
	const wiggle = Math.random() * (percent + 2 - percent) + percent;

	return (wiggle / 100) * total;
}

function isEqualRecordName(a: ResourceRecord["NAME"], b: ResourceRecord["NAME"]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}
