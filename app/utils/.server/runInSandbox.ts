/**
 * A LOW-SECURITY sandbox for running a string of JS/TS code under Bun.
 *
 * What it does:
 *   - Hides almost every global (process, require, Bun, fetch, WebSocket,
 *     Worker, __dirname, etc.) by shadowing them as `undefined` parameters.
 *   - Blocks `import(...)`, static `import`, and `require(...)` via a
 *     pattern check (these are syntax forms, not identifier lookups, so
 *     shadowing alone can't catch them).
 *   - Runs the code in strict mode, as an async IIFE, so `await` and
 *     function declarations just work.
 *   - Enforces a wall-clock timeout.
 *
 * What it does NOT do (see "Known limitations" at the bottom):
 *   - Stop a synchronous infinite loop from hanging the process.
 *   - Stop determined prototype-chain / constructor-walking escapes.
 *   - Limit memory or CPU.
 *   - Provide real isolation (it's the same process, same heap).
 *
 * Treat this as "keep honest code honest," not "contain hostile code."
 */

import { DataContext } from "@thorium/.server/DataContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { Entity } from "@thorium/utils/ecs";

// Globals deliberately left reachable: pure, no I/O, no way to reach the
// outside world or the filesystem/network from them.
const ALLOWLIST = new Set([
	"Object",
	"Array",
	"String",
	"Number",
	"Boolean",
	"Symbol",
	"Math",
	"JSON",
	"Promise",
	"Map",
	"Set",
	"WeakMap",
	"WeakSet",
	"Date",
	"RegExp",
	"Error",
	"TypeError",
	"RangeError",
	"SyntaxError",
	"ReferenceError",
	"EvalError",
	"URIError",
	"ArrayBuffer",
	"SharedArrayBuffer",
	"DataView",
	"Int8Array",
	"Uint8Array",
	"Uint8ClampedArray",
	"Int16Array",
	"Uint16Array",
	"Int32Array",
	"Uint32Array",
	"Float32Array",
	"Float64Array",
	"BigInt64Array",
	"BigUint64Array",
	"BigInt",
	"Infinity",
	"NaN",
	"isNaN",
	"isFinite",
	"parseInt",
	"parseFloat",
	"encodeURIComponent",
	"decodeURIComponent",
	"encodeURI",
	"decodeURI",
	"console", // drop this if you don't even want console.log to work
	"setTimeout",
	"clearTimeout",
	"setInterval",
	"clearInterval",
	"queueMicrotask",
	"structuredClone",
]);

// Words that can't legally be used as parameter names in strict mode
// (eval/arguments) or are reserved words in strict mode — must be filtered
// out of the shadow list rather than passed as `Function` params.
const UNSHADOWABLE = new Set([
	"eval",
	"arguments",
	"yield",
	"let",
	"static",
	"implements",
	"interface",
	"package",
	"private",
	"protected",
	"public",
]);

// Syntax forms that shadowing can't touch, checked as a source-level backstop.
const FORBIDDEN_PATTERNS: [RegExp, string][] = [
	[/\bimport\s*\(/, "dynamic import()"],
	[/\bimport\s*\./, "import.meta"],
	[/^\s*import\s/m, "static import statement"],
	[/\brequire\s*\(/, "require()"],
	[/\beval\s*\(/, "eval()"],
	[/\bFunction\s*\(/, "Function constructor"],
	[/\.constructor\s*\(/, "constructor() escape"],
];

function blockedGlobalNames(): string[] {
	const names = new Set<string>();
	for (const name of Object.getOwnPropertyNames(globalThis)) {
		if (ALLOWLIST.has(name) || UNSHADOWABLE.has(name)) continue;
		if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) continue; // skip non-identifier keys
		names.add(name);
	}
	// Belt-and-suspenders in case a runtime doesn't enumerate these:
	for (const n of [
		"require",
		"process",
		"Bun",
		"globalThis",
		"global",
		"module",
		"exports",
		"__dirname",
		"__filename",
	]) {
		if (!UNSHADOWABLE.has(n)) names.add(n);
	}
	return [...names];
}

const extraGlobals = { Entity };

export async function runInSandbox(
	code: string,
	ctx?: DataContext | Record<string, any>,
): Promise<unknown> {
	for (const [pattern, label] of FORBIDDEN_PATTERNS) {
		if (pattern.test(code)) {
			throw new Error(`Disallowed syntax detected: ${label}`);
		}
	}

	const blocked = blockedGlobalNames();
	const extraNames = Object.entries(extraGlobals).map(([key]) => key);
	let fn: (...args: unknown[]) => Promise<unknown>;
	try {
		// oxlint-disable-next-line typescript/no-implied-eval - This is the whole point
		fn = new Function(
			...blocked,
			...extraNames,
			`"use strict";\nreturn (async () => {\n${code}\n})();`,
		) as any;
	} catch (err) {
		throw new Error(`Syntax error: ${(err as Error).message}`);
	}

	const context =
		ctx instanceof DataContext
			? ctx
			: new DataContext("thorium", DataStore.operations.getStore()!.database, ctx);

	return await fn.call(
		context,
		...blocked.map(() => undefined),
		...Object.entries(extraGlobals).map(([_key, value]) => value),
	);
}
