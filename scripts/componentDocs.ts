import { glob, readFile } from "node:fs/promises";

import { parseSync } from "oxc-parser";

const virtualModuleId = "virtual:ecs-component-docs";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

export interface PropertyDoc {
	name: string;
	comment: string;
	/** Present when the property's value is itself a `z.object(...)` call. */
	properties?: PropertyDoc[];
}

export interface ComponentDoc {
	component: string;
	comment: string;
	properties: PropertyDoc[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a lookup helper that finds the JSDoc block comment immediately
 * preceding a given source position.
 *
 * "Immediately preceding" means the text between the comment's closing `* /`
 * and the node's start is pure whitespace — no other tokens in between.
 * This is robust regardless of indentation depth or blank lines.
 */
function makeCommentFinder(source: string, comments: ReturnType<typeof parseSync>["comments"]) {
	// Only block comments starting with `*` are JSDoc (/** ... */)
	const jsdoc = comments
		.filter((c) => c.type === "Block" && c.value.startsWith("*"))
		.sort((a, b) => a.start - b.start);

	return function getPrecedingComment(nodeStart: number): string {
		// Walk backwards through sorted comments; stop at the first one whose
		// end is before nodeStart and whose trailing gap is only whitespace.
		for (let i = jsdoc.length - 1; i >= 0; i--) {
			const c = jsdoc[i];
			if (c.end > nodeStart) continue;

			const gap = source.slice(c.end, nodeStart);
			if (/^\s*$/.test(gap)) {
				// Strip the leading `*` / `* ` that JSDoc block comments start with,
				// then trim surrounding whitespace from each line.
				return c.value
					.split("\n")
					.map((line) => line.replace(/^\s*\*?\s?/, "").trimEnd())
					.join("\n")
					.trim();
			}

			// Comments are sorted ascending, so no earlier comment can be adjacent
			// to nodeStart either — we can bail out early.
			break;
		}
		return "";
	};
}

/**
 * Walk a call-expression chain (e.g. `z.object({…}).array().default([])`)
 * and return the `ObjectExpression` passed to the innermost `z.object(…)` call,
 * or `null` if there is none.
 *
 * We walk `.callee` / `.object` recursively to handle arbitrary chaining.
 */
function findZObjectArg(node: unknown): object | null {
	if (!node || typeof node !== "object") return null;

	const n = node as Record<string, unknown>;

	if (n["type"] === "CallExpression") {
		const callee = n["callee"] as Record<string, unknown> | undefined;

		// Is this `<expr>.object(…)`?
		if (
			callee?.["type"] === "MemberExpression" &&
			(callee?.["property"] as Record<string, unknown>)?.["name"] === "object"
		) {
			const args = n["arguments"] as unknown[] | undefined;
			const firstArg = args?.[0] as Record<string, unknown> | undefined;
			if (firstArg?.["type"] === "ObjectExpression") {
				return firstArg as object;
			}
		}

		// Recurse into the callee to handle chained calls
		return findZObjectArg(callee);
	}

	if (n["type"] === "MemberExpression") {
		return findZObjectArg(n["object"]);
	}

	return null;
}

/**
 * Recursively extract property docs from an `ObjectExpression` node that was
 * passed to `z.object(…)`.
 */
function extractProperties(
	objectExpr: object,
	getPrecedingComment: (pos: number) => string,
): PropertyDoc[] {
	const obj = objectExpr as Record<string, unknown>;
	const rawProps = (obj["properties"] as unknown[]) ?? [];

	const results: PropertyDoc[] = [];

	for (const raw of rawProps) {
		const prop = raw as Record<string, unknown>;
		if (prop["type"] !== "Property") continue;

		const key = prop["key"] as Record<string, unknown>;
		const name =
			// oxlint-disable-next-line typescript/no-base-to-string
			key["type"] === "Identifier" ? (key["name"] as string) : String(key["value"] ?? "");

		const comment = getPrecedingComment(prop["start"] as number);
		const nested = findZObjectArg(prop["value"]);

		results.push({
			name,
			comment,
			...(nested ? { properties: extractProperties(nested, getPrecedingComment) } : {}),
		});
	}

	return results;
}

export function componentDocs() {
	return {
		name: "component-docs",
		resolveId(id: string) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) {
				const docs: Record<string, ComponentDoc> = {};

				for await (const filepath of glob("./app/ecs-components/**/*.ts")) {
					const src = await readFile(filepath, "utf-8");

					const parsed = parseSync(filepath, src, { lang: "ts" });

					const getPrecedingComment = makeCommentFinder(src, parsed.comments);

					for (const stmt of parsed.program.body) {
						if (stmt.type !== "ExportNamedDeclaration") continue;

						// @ts-expect-error
						const decl = (stmt as Record<string, unknown>)["declaration"] as
							| Record<string, unknown>
							| undefined;
						if (decl?.["type"] !== "VariableDeclaration") continue;

						for (const rawDeclarator of (decl["declarations"] as unknown[]) ?? []) {
							const declarator = rawDeclarator as Record<string, unknown>;
							const id = declarator["id"] as Record<string, unknown> | undefined;
							const name = id?.["type"] === "Identifier" ? (id["name"] as string) : "";
							if (!name) continue;

							const comment = getPrecedingComment(stmt.start as number);
							const nested = findZObjectArg(declarator["init"]);
							docs[name] = {
								component: name,
								comment,
								properties: nested ? extractProperties(nested, getPrecedingComment) : [],
							};
						}
					}
				}
				return `export const docs = ${JSON.stringify(docs)}`;
			}
		},
	};
}
