// @ts-nocheck
/**
 * ink.validator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Monaco Editor diagnostics (markers) provider for the ink scripting language.
 *
 * Usage
 * ─────
 *   import { InkValidator, registerInkValidator } from './ink.validator.js';
 *
 *   // One-shot:
 *   const validator = new InkValidator(monaco);
 *   validator.validate(model);
 *
 *   // Live (re-validates on every edit, debounced):
 *   validator.attach(model);
 *   validator.detach();   // stop
 *
 *   // Auto-attach to every ink model created in Monaco:
 *   registerInkValidator(monaco);
 *
 * What is validated
 * ─────────────────
 *   Errors
 *     - Knot/stitch names with spaces or invalid characters
 *     - Duplicate knot declarations (within the same model)
 *     - VAR / CONST / LIST with missing name or initial value
 *     - Malformed divert targets  (-> something_bad)
 *     - Bare ->  with no target on non-choice lines
 *     - Unclosed block comments  (slash-star without closing star-slash)
 *     - Unmatched }  on any line
 *     - INCLUDE with no filename
 *     - Choices with mismatched [ ]
 *     - ~  lines with no expression
 *     - Choices or stitches inside a function knot
 *
 *   Warnings
 *     - TODO: markers
 *     - CONST assigned to an identifier rather than a literal
 *     - VAR shadowing a CONST name
 *     - Knot name colliding with a VAR name
 *     - ~ return  outside of a function body
 *     - Thread  <-  with no target knot
 *     - INCLUDE file that does not end in .ink
 */

// Severity values match monaco.MarkerSeverity exactly
const SEV = { Error: 8, Warning: 4, Info: 2, Hint: 1 };

// ─── Regex constants ──────────────────────────────────────────────────────────

// Knot:  === name  or  === name ===  or  === function name(params) ===
// Groups: 1=leading===, 2="function ", 3=name, 4=params, 5=trailing===
const RE_KNOT =
	/^\s*(={2,})\s*(function\s+)?([a-zA-Z_\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0370-\u03FF\u0590-\u05FF\u0530-\u058F][a-zA-Z0-9_\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0370-\u03FF\u0590-\u05FF\u0530-\u058F]*)(\s*\([^)]*\))?\s*(={2,})?\s*(?:\/\/.*)?$/;

// Stitch:  = name  or  = name(params)
const RE_STITCH =
	/^\s*(=(?!=))\s*([a-zA-Z_\u00C0-\u024F\u0400-\u04FF][a-zA-Z0-9_\u00C0-\u024F\u0400-\u04FF]*)(\s*\([^)]*\))?\s*(?:\/\/.*)?$/;

// VAR / CONST / LIST with a proper name
const RE_DECL = /^\s*(VAR|CONST|LIST)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=(.*))?$/;

// VAR / CONST / LIST with nothing after the keyword
const RE_DECL_NO_NAME = /^\s*(VAR|CONST|LIST)\s*$/;

// Known terminal divert keywords
const RE_DIVERT_KW = /^(END|DONE)$/;

// Valid dotted identifier for divert targets (knot or knot.stitch)
const RE_IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Strip trailing // line comment, respecting double-quoted strings. */
function stripLineComment(line) {
	let inStr = false;
	for (let i = 0; i < line.length - 1; i++) {
		if (line[i] === '"' && (i === 0 || line[i - 1] !== "\\")) inStr = !inStr;
		if (!inStr && line[i] === "/" && line[i + 1] === "/") return line.slice(0, i);
	}
	return line;
}

/** Replace inline /* ... * / on the same line with spaces (preserves column offsets). */
function stripInlineBlockComment(line) {
	return line.replace(/\/\*([^*]|\*(?!\/))*\*\//g, (m) => " ".repeat(m.length));
}

function mkMarker(sev, msg, sl, sc, el, ec) {
	return {
		severity: sev,
		message: msg,
		startLineNumber: sl,
		startColumn: sc,
		endLineNumber: el,
		endColumn: ec,
		source: "ink",
	};
}

function lineMarker(sev, msg, lineNum, raw) {
	const col = Math.max(1, raw.search(/\S/) + 1);
	return mkMarker(sev, msg, lineNum, col, lineNum, raw.length + 1);
}

// ─── Brace-depth helpers ──────────────────────────────────────────────────────

/** Walk a stripped line and update a running brace depth, flagging extra closes. */
function processBraces(line, lineNum, rawLine, markers, startDepth) {
	let d = startDepth,
		inStr = false,
		esc = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (esc) {
			esc = false;
			continue;
		}
		if (ch === "\\") {
			esc = true;
			continue;
		}
		if (ch === '"') {
			inStr = !inStr;
			continue;
		}
		if (inStr) continue;
		if (ch === "{") {
			d++;
		} else if (ch === "}") {
			if (d === 0) {
				markers.push(
					mkMarker(SEV.Error, 'Unexpected "}". No matching "{".', lineNum, i + 1, lineNum, i + 2),
				);
				// don't decrement — we already reported
			} else {
				d--;
			}
		}
	}
	return d;
}

/** Count [ and ] in a string WITHOUT skipping string literals.
 *  Ink's choice brackets are not string-aware: ["text"] is valid syntax
 *  where the " characters are literal content inside the bracket. */
function countSquareBrackets(str) {
	let opens = 0,
		closes = 0;
	for (let i = 0; i < str.length; i++) {
		if (str[i] === "[") opens++;
		else if (str[i] === "]") closes++;
	}
	return { opens, closes };
}

// ─── Divert validation helpers ────────────────────────────────────────────────

function validateTarget(bare, lineNum, rawLine, markers) {
	if (!bare || RE_DIVERT_KW.test(bare)) return;
	if (!RE_IDENT.test(bare)) {
		markers.push(
			lineMarker(
				SEV.Error,
				`Invalid divert target '${bare}'. Must be a knot name, knot.stitch, END, or DONE.`,
				lineNum,
				rawLine,
			),
		);
	}
}

/** Find and validate all ->target occurrences embedded in a line of content. */
function checkDivertsInLine(line, lineNum, rawLine, markers) {
	// Match -> not followed by another > (avoid ->->), capture optional identifier
	const re = /->(?!>)\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?(?:\s*\([^)]*\))?)?/g;
	let m;
	while ((m = re.exec(line)) !== null) {
		const raw_target = (m[1] || "").trim();
		if (!raw_target) continue;
		const bare = raw_target.replace(/\s*\(.*/, "").trim();
		validateTarget(bare, lineNum, rawLine, markers);
	}
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class InkValidator {
	constructor(monaco) {
		this._monaco = monaco;
		this._disposables = [];
	}

	// Public API ────────────────────────────────────────────────────────────────

	validate(model) {
		const markers = this._analyzeLines(model.getLinesContent());
		this._monaco.editor.setModelMarkers(model, "ink", markers);
		return markers;
	}

	attach(model, debounceMs = 400) {
		this.detach();
		this.validate(model);
		let timer = null;
		const d1 = model.onDidChangeContent(() => {
			clearTimeout(timer);
			timer = setTimeout(() => this.validate(model), debounceMs);
		});
		const d2 = model.onWillDispose(() => this.detach());
		this._disposables = [d1, d2, { dispose: () => clearTimeout(timer) }];
	}

	detach() {
		this._disposables.forEach((d) => d.dispose());
		this._disposables = [];
	}

	// Core analysis (no Monaco dependency — fully testable) ────────────────────

	_analyzeLines(lines) {
		const markers = [];

		// ── Pre-pass: block-comment ranges + global declarations ──────────────────
		const commentedIdx = new Set(); // 0-based line indices that are commented out
		const knotNames = new Map(); // name -> first-declared lineNum (1-based)
		const functionKnotSet = new Set(); // knot names that are functions
		const constNames = new Set();
		const varNames = new Set();

		let blockOpen = false;
		let blockOpenLine = -1;

		for (let i = 0; i < lines.length; i++) {
			const raw = lines[i];
			const lineNum = i + 1;

			if (blockOpen) {
				commentedIdx.add(i);
				if (raw.includes("*/")) blockOpen = false;
				continue;
			}

			// Full line comment
			if (/^\s*\/\//.test(raw)) {
				commentedIdx.add(i);
				continue;
			}

			// Block comment start — check if it also closes on this line
			if (raw.includes("/*")) {
				const cleaned = stripInlineBlockComment(raw);
				if (cleaned.includes("/*")) {
					// Still open — extends past this line
					blockOpen = true;
					blockOpenLine = lineNum;
					commentedIdx.add(i);
					continue;
				}
				// Closed on this line: fall through with the cleaned version
			}

			// Collect knot names
			if (/^\s*={2,}/.test(raw)) {
				const rawForKnot = stripLineComment(stripInlineBlockComment(raw));
				const m = RE_KNOT.exec(rawForKnot);
				if (m) {
					const isFunc = !!m[2];
					const name = m[3];
					if (knotNames.has(name)) {
						markers.push(
							lineMarker(
								SEV.Error,
								`Duplicate knot name '${name}'. Previously declared on line ${knotNames.get(name)}.`,
								lineNum,
								raw,
							),
						);
					} else {
						knotNames.set(name, lineNum);
					}
					if (isFunc) functionKnotSet.add(name);
				}
				continue;
			}

			// Collect VAR/CONST names
			const dm = RE_DECL.exec(raw);
			if (dm) {
				if (dm[1] === "CONST") constNames.add(dm[2]);
				if (dm[1] === "VAR") varNames.add(dm[2]);
			}
		}

		if (blockOpen) {
			const lastLen = (lines[lines.length - 1] || "").length;
			markers.push(
				mkMarker(
					SEV.Error,
					"Unclosed block comment /* ... */. Add */ to close it.",
					blockOpenLine,
					1,
					lines.length,
					lastLen + 1,
				),
			);
		}

		// ── Main pass ─────────────────────────────────────────────────────────────
		let inFunctionKnot = false;
		let braceDepth = 0;

		for (let i = 0; i < lines.length; i++) {
			if (commentedIdx.has(i)) continue;

			const raw = lines[i];
			const lineNum = i + 1;

			if (/^\s*$/.test(raw)) continue;

			// Produce a stripped version for analysis (no inline block comments, no trailing //)
			const stripped = stripLineComment(stripInlineBlockComment(raw));

			// ── TODO ────────────────────────────────────────────────────────────────
			if (/^\s*TODO:/i.test(stripped)) {
				const msg = stripped
					.replace(/^\s*TODO:\s*/i, "")
					.trim()
					.slice(0, 70);
				markers.push(lineMarker(SEV.Warning, `TODO: ${msg}`, lineNum, raw));
				continue;
			}

			// ── Knot declarations  === name === ────────────────────────────────────
			if (/^\s*={2,}/.test(raw)) {
				const knotMatch = RE_KNOT.exec(stripped);
				if (!knotMatch) {
					// Extract what's between the === markers for the error message
					const inner = stripped
						.replace(/^\s*={2,}\s*/, "")
						.replace(/\s*={2,}\s*$/, "")
						.trim();
					markers.push(
						lineMarker(
							SEV.Error,
							inner
								? `Invalid knot name '${inner}'. Knot names must be a single word (no spaces).`
								: "Malformed knot declaration. Use: === knot_name ===",
							lineNum,
							raw,
						),
					);
				} else {
					const isFunc = !!knotMatch[2];
					const name = knotMatch[3];
					inFunctionKnot = isFunc;
					braceDepth = 0; // fresh block

					if (varNames.has(name)) {
						markers.push(
							lineMarker(
								SEV.Warning,
								`Knot '${name}' shares its name with a VAR declaration. This may cause unexpected behaviour.`,
								lineNum,
								raw,
							),
						);
					}
				}
				continue;
			}

			// ── Stitch declarations  = name ────────────────────────────────────────
			if (/^\s*=(?!=)/.test(raw)) {
				if (!RE_STITCH.exec(raw)) {
					const inner = raw.replace(/^\s*=\s*/, "").trim();
					markers.push(
						lineMarker(
							SEV.Error,
							`Invalid stitch name '${inner}'. Stitch names must be a single word (no spaces).`,
							lineNum,
							raw,
						),
					);
				}
				if (inFunctionKnot) {
					markers.push(lineMarker(SEV.Error, "Functions cannot contain stitches.", lineNum, raw));
				}
				continue;
			}

			// ── VAR / CONST / LIST ─────────────────────────────────────────────────
			if (RE_DECL_NO_NAME.test(stripped)) {
				const kw = RE_DECL_NO_NAME.exec(stripped)[1];
				markers.push(
					lineMarker(SEV.Error, `${kw} declaration is missing a variable name.`, lineNum, raw),
				);
				continue;
			}

			const dm = RE_DECL.exec(stripped);
			if (dm) {
				const [, kw, name, rhs] = dm;

				if ((kw === "VAR" || kw === "CONST") && (!rhs || rhs.trim() === "")) {
					markers.push(
						lineMarker(
							SEV.Error,
							`${kw} '${name}' has no initial value. Provide a value after '='.`,
							lineNum,
							raw,
						),
					);
				}

				if (kw === "CONST" && rhs && rhs.trim()) {
					const r = rhs.trim();
					if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(r)) {
						markers.push(
							lineMarker(
								SEV.Warning,
								`CONST '${name}' is assigned to identifier '${r}'. CONSTants should be literal values.`,
								lineNum,
								raw,
							),
						);
					}
				}

				if (kw === "VAR" && constNames.has(name)) {
					markers.push(
						lineMarker(
							SEV.Warning,
							`VAR '${name}' shadows a CONST with the same name.`,
							lineNum,
							raw,
						),
					);
				}

				if (kw === "LIST" && rhs !== undefined && rhs.trim() === "") {
					markers.push(
						lineMarker(SEV.Error, `LIST '${name}' has no values defined.`, lineNum, raw),
					);
				}

				braceDepth = processBraces(stripped, lineNum, raw, markers, braceDepth);
				continue;
			}

			// ── INCLUDE ─────────────────────────────────────────────────────────────
			if (/^\s*INCLUDE\b/.test(stripped)) {
				const filename = stripped.replace(/^\s*INCLUDE\s*/, "").trim();
				if (!filename) {
					markers.push(
						lineMarker(SEV.Error, "INCLUDE statement is missing a filename.", lineNum, raw),
					);
				} else if (!/\.ink$/i.test(filename)) {
					markers.push(
						lineMarker(
							SEV.Warning,
							`INCLUDE file '${filename}' does not end in .ink. This may cause a compile error.`,
							lineNum,
							raw,
						),
					);
				}
				continue;
			}

			// ── Tilde logic  ~ expr ────────────────────────────────────────────────
			if (/^\s*~/.test(stripped)) {
				const expr = stripped.replace(/^\s*~\s*/, "").trim();

				if (!expr) {
					markers.push(
						lineMarker(
							SEV.Error,
							"~ with no expression. Provide a statement after ~.",
							lineNum,
							raw,
						),
					);
					continue;
				}

				if (/^[+\-*/]/.test(expr)) {
					markers.push(
						lineMarker(
							SEV.Error,
							`Expression '${expr.slice(0, 20)}' starts with an operator. Did you mean '~ x ${expr.slice(0, 10)}'?`,
							lineNum,
							raw,
						),
					);
				}

				if (/^\s*return\b/.test(expr) && !inFunctionKnot) {
					markers.push(
						lineMarker(
							SEV.Warning,
							'"~ return" outside of a function has no effect.',
							lineNum,
							raw,
						),
					);
				}

				if (inFunctionKnot && /^\s*->\s*(END|DONE)\s*$/.test(expr)) {
					markers.push(
						lineMarker(
							SEV.Warning,
							'Functions should use "~ return" rather than -> END or -> DONE.',
							lineNum,
							raw,
						),
					);
				}

				checkDivertsInLine(expr, lineNum, raw, markers);
				braceDepth = processBraces(stripped, lineNum, raw, markers, braceDepth);
				continue;
			}

			// ── Tunnel return  ->-> ─────────────────────────────────────────────────
			if (/^\s*->\s*->\s*$/.test(stripped)) continue;

			// ── Divert-only lines  -> target ────────────────────────────────────────
			if (/^\s*->/.test(stripped)) {
				const afterArrow = stripped.replace(/^\s*->\s*/, "").trim();

				if (!afterArrow) {
					markers.push(
						lineMarker(
							SEV.Error,
							'Divert "->" has no target. Provide a knot name, END, or DONE.',
							lineNum,
							raw,
						),
					);
					continue;
				}

				// Chained tunnels:  -> knotA -> knotB  or  -> knotA ->
				if (afterArrow.includes("->")) {
					const segments = afterArrow
						.split("->")
						.map((s) => s.replace(/\s*\(.*/, "").trim())
						.filter(Boolean);
					for (const seg of segments) validateTarget(seg, lineNum, raw, markers);
					continue;
				}

				const bare = afterArrow.replace(/\s*\(.*/, "").trim();
				validateTarget(bare, lineNum, raw, markers);
				continue;
			}

			// ── Thread  <- ──────────────────────────────────────────────────────────
			if (/^\s*<-/.test(stripped)) {
				const target = stripped.replace(/^\s*<-\s*/, "").trim();
				if (!target) {
					markers.push(lineMarker(SEV.Warning, 'Thread "<-" has no target knot.', lineNum, raw));
				}
				continue;
			}

			// ── Choices  * / + ─────────────────────────────────────────────────────
			if (/^\s*[*+]/.test(stripped)) {
				if (inFunctionKnot) {
					markers.push(
						lineMarker(SEV.Error, "Functions cannot contain choices (* or +).", lineNum, raw),
					);
				}

				const { opens, closes } = countSquareBrackets(stripped);

				if (opens !== closes) {
					markers.push(
						lineMarker(
							SEV.Error,
							`Choice has ${opens} '[' but ${closes} ']'. Square brackets in choices must be balanced.`,
							lineNum,
							raw,
						),
					);
				}

				checkDivertsInLine(stripped, lineNum, raw, markers);
				braceDepth = processBraces(stripped, lineNum, raw, markers, braceDepth);
				continue;
			}

			// ── Gathers  - ─────────────────────────────────────────────────────────
			if (/^\s*-(?!\s*>)/.test(stripped)) {
				checkDivertsInLine(stripped, lineNum, raw, markers);
				braceDepth = processBraces(stripped, lineNum, raw, markers, braceDepth);
				continue;
			}

			// ── General content line ────────────────────────────────────────────────
			braceDepth = processBraces(stripped, lineNum, raw, markers, braceDepth);
			checkDivertsInLine(stripped, lineNum, raw, markers);
		}

		markers.sort((a, b) => a.startLineNumber - b.startLineNumber);
		return markers;
	}
}

// ─── Monaco auto-registration ─────────────────────────────────────────────────

/**
 * Register the ink validator so that every ink model is validated automatically.
 * Call once after Monaco is loaded and the 'ink' language is registered.
 *
 * @param {any} monaco
 * @param {number} [debounceMs=400]
 */
export function registerInkValidator(monaco, debounceMs = 400) {
	const validator = new InkValidator(monaco);
	const attached = new WeakMap();

	function attachIfInk(model) {
		if (model.getLanguageId() !== "ink") return;
		if (attached.has(model)) return;
		validator.attach(model, debounceMs);
		attached.set(model, true);
	}

	monaco.editor.getModels().forEach(attachIfInk);
	monaco.editor.onDidCreateModel(attachIfInk);
}
