import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity } from "@thorium/utils/ecs";
import { produce } from "immer";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { Writable } from "node:stream";
import path from "node:path";
import { thoriumPath } from "@thorium/utils/.server/appPaths";

class BlobStream extends Writable {
	#chunks: Uint8Array<ArrayBuffer>[] = [];
	#blob: Blob | null = null;
	length = 0;

	_write(
		chunk: any,
		encoding: BufferEncoding,
		callback: (error?: Error | null) => void,
	): void {
		if (!(chunk instanceof Uint8Array)) {
			chunk = new Uint8Array(chunk);
		}

		this.length += chunk.length;
		this.#chunks.push(chunk);
		callback();
	}
	toBlob(type?: string) {
		type = type || "application/octet-stream";
		if (!this.#blob) {
			this.#blob = new Blob(this.#chunks, {
				type: type,
			});

			this.#chunks = []; // free memory
		}

		if (this.#blob.type !== type)
			this.#blob = new Blob([this.#blob], { type: type });

		return this.#blob;
	}
}

export const documents = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isDocument"], (entity) =>
			entity.components.isDocument
				? { shipId: entity.components.isDocument?.shipId }
				: null,
		)
		.request(({ input, ctx }) => {
			const documents: {
				id: number;
				name: string;
				filePath: string;
				annotations: [number, number, number][][][];
			}[] = [];
			for (const document of ctx.ecs.componentCache.get("isDocument") || []) {
				if (document.components.isDocument?.shipId === input.shipId) {
					documents.push({
						id: document.id,
						name: document.components.identity?.name || "Document",
						filePath: document.components.isDocument.filePath,
						annotations: document.components.isDocument.annotations,
					});
				}
			}
			return documents;
		}),
	addDocument: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				name: z.string(),
				file: z.union([z.instanceof(File), z.string()]),
			}),
		)
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight has not started.");
			const document = new Entity();
			document.addComponent("isDocument", {
				shipId: input.shipId,
				filePath:
					typeof input.file === "string"
						? input.file
						: await ctx.uploadFile.call(ctx.flight, input.file),
			});
			document.addComponent("identity", {
				name: input.name,
			});
			ctx.ecs.addEntity(document);

			pubsub.publish.documents.get({ shipId: input.shipId });

			return { id: document.id };
		}),
	removeDocument: t.procedure
		.input(z.object({ documentId: z.number() }))
		.send(({ input, ctx }) => {
			const document = ctx.ecs.getEntityById(input.documentId);
			if (!document) return;
			const shipId = document.components.isDocument?.shipId || -1;
			ctx.ecs.removeEntity(document);
			pubsub.publish.documents.get({ shipId });
		}),
	addAnnotation: t.procedure
		.input(
			z.object({
				documentId: z.number(),
				annotation: z.array(z.tuple([z.number(), z.number(), z.number()])),
				page: z.number(),
			}),
		)
		.send(({ input, ctx }) => {
			const document = ctx.ecs.getEntityById(input.documentId);
			if (!document) return;
			const shipId = document.components.isDocument?.shipId || -1;

			const annotations = produce(
				document.components.isDocument?.annotations || [],
				(draft) => {
					if (!draft[input.page]) draft[input.page] = [];
					const page = draft[input.page];
					page.push(input.annotation);
				},
			);
			document.updateComponent("isDocument", { annotations });

			pubsub.publish.documents.get({ shipId });
		}),
	clearAnnotations: t.procedure
		.input(z.object({ documentId: z.number(), page: z.number() }))
		.send(({ input, ctx }) => {
			const document = ctx.ecs.getEntityById(input.documentId);
			if (!document) return;
			const shipId = document.components.isDocument?.shipId || -1;

			const annotations = produce(
				document.components.isDocument?.annotations || [],
				(draft) => {
					draft[input.page] = [];
				},
			);
			document.updateComponent("isDocument", { annotations });

			pubsub.publish.documents.get({ shipId });
		}),
	renderPdf: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				fontName: z.string().nullable(),
				name: z.string(),
				heading: z.string(),
				message: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			if (!ctx.flight) throw new Error("Flight has not started.");

			const longRangeComm = getShipSystem(ctx.ecs, {
				shipId: input.shipId,
				systemType: "longRangeComm",
			});
			const cypher = longRangeComm.components.isLongRangeComm?.cyphers.find(
				(c) => c.name === input.fontName,
			);
			if (!cypher) return;

			const file = await new Promise<Blob>((resolve) => {
				const doc = new PDFDocument({ size: "LETTER" });

				doc.registerFont(cypher.name, path.join(thoriumPath, cypher.font));
				const stream = doc.pipe(new BlobStream());
				stream.on("finish", () => {
					resolve(stream.toBlob("application/pdf"));
				});
				// and some justified text wrapped into columns
				doc
					.font("Courier", 32)
					.text(input.heading, { align: "center" })
					.moveDown()
					.font(cypher.name, 24)
					.text(input.message.toLowerCase(), {
						lineGap: 32,
						ellipsis: true,
					});

				doc.end();
			});

			const document = new Entity();
			document.addComponent("isDocument", {
				shipId: input.shipId,
				filePath: await ctx.uploadFile.call(
					ctx.flight,
					file,
					`${input.name}.pdf`,
				),
			});
			document.addComponent("identity", {
				name: input.name,
			});
			ctx.ecs.addEntity(document);

			pubsub.publish.documents.get({ shipId: input.shipId });
		}),
});
