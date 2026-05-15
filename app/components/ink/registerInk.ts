import type { Monaco } from "@monaco-editor/react";

export const inkLanguage = {
	defaultToken: "",
	tokenPostfix: ".ink",

	// Keywords used in logic expressions
	keywords: ["return", "temp", "not", "or", "true", "false", "mod"],

	// Built-in math functions
	builtins: ["POW", "RANDOM", "INT", "FLOOR", "FLOAT"],

	// Declaration keywords
	storageTypes: ["VAR", "CONST", "LIST"],

	// Control keywords
	controlKeywords: ["INCLUDE", "END", "DONE"],

	// Multiline block sequence types
	sequenceTypes: ["stopping", "cycle", "once"],

	brackets: [
		["{", "}", "delimiter.curly"],
		["[", "]", "delimiter.square"],
		["(", ")", "delimiter.parenthesis"],
	],

	tokenizer: {
		// ─── Root state ─────────────────────────────────────────────────────────
		root: [
			// Block comments
			[/\/\*/, "comment.block", "@blockComment"],

			// Line comments
			[/\/\/.*$/, "comment.line.double-slash"],

			// Tags  # tag content
			[/#/, "punctuation.definition.tag", "@tag"],

			// TODO markers
			[/\bTODO:.*$/, "keyword.other.todo"],

			// INCLUDE statements
			[/^(\s*)(INCLUDE)\b/, ["", { token: "keyword.control.include", next: "@include" }]],

			// VAR / CONST / LIST declarations
			[/^(\s*)(VAR|CONST|LIST)\b/, ["", { token: "storage.type", next: "@declaration" }]],

			// Knot / stitch declarations  (=== knot_name ===)
			[/^(\s*)(=+)/, ["", { token: "keyword.other.knot", next: "@knotDeclaration" }]],

			// Tilde logic lines  (~ expression)
			[/~/, { token: "keyword.other.tilde", next: "@tildeLogic" }],

			// Labelled gathers/choices  - (label)  or  * (label)
			[/^(\s*)([-*+])(\s*[-*+])*\s*(?=\()/, "keyword.other.gather", "@labelledItem"],

			// Choices  * or + (possibly nested)
			[/^(\s*)([*+]\s*)+/, "keyword.other.choice"],

			// Gathers  - (not ->)
			[/^(\s*)-(?!\s*>)(\s*-)*/, "keyword.other.gather"],

			// Conditional / multiline blocks: opening {
			[/\{/, { token: "keyword.other.brackets.conditional", next: "@openBrace" }],

			// Glue
			[/<>/, "keyword.other.glue"],

			// Brackets inside choices  [ ]
			[/[[\]]/, "keyword.other.brackets.choice"],

			// Diverts  ->  and threads  <-
			[/->/, { token: "keyword.other.divert", next: "@afterDivert" }],
			[/<-/, { token: "keyword.other.thread", next: "@afterThread" }],

			// Alternatives (pipe, not escaped)
			[/(?<!\\)\|/, "keyword.other.alternative"],

			// Plain text — anything else passes through
			[/./, ""],
		],

		// ─── After -> ───────────────────────────────────────────────────────────
		afterDivert: [
			[/\s+/, ""],
			[/\b(END|DONE)\b/, { token: "keyword.control.return", next: "@pop" }],
			[/[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)?/, { token: "entity.name.function.divert", next: "@pop" }],
			[/$/, "", "@pop"],
		],

		// ─── After <- ───────────────────────────────────────────────────────────
		afterThread: [
			[/\s+/, ""],
			[/[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)?/, { token: "entity.name.function.thread", next: "@pop" }],
			[/$/, "", "@pop"],
		],

		// ─── Knot / stitch declaration header ───────────────────────────────────
		knotDeclaration: [
			[/\s*(function)\s+/, { token: "keyword.other.function" }],
			[/[a-zA-Z0-9_]+/, "entity.name.function"],
			[/\(/, { token: "delimiter.parenthesis", next: "@paramList" }],
			// Trailing ===
			[/=+\s*$/, { token: "keyword.other.knot", next: "@pop" }],
			// End of line or comment
			[/\/\/.*$/, { token: "comment.line.double-slash", next: "@pop" }],
			[/$/, "", "@pop"],
		],

		// ─── Parameter list (knot/function args) ────────────────────────────────
		paramList: [[/\)/, { token: "delimiter.parenthesis", next: "@pop" }], { include: "@logic" }],

		// ─── Labelled gather / choice  (label) ──────────────────────────────────
		labelledItem: [
			[/\(/, { token: "entity.name.function", next: "@label" }],
			[/\s|$/, "", "@pop"],
		],

		label: [
			[/\)/, { token: "entity.name.function", next: "@pop" }],
			[/[^()]+/, "entity.name.function"],
		],

		// ─── INCLUDE path ────────────────────────────────────────────────────────
		include: [
			[/\s+/, ""],
			[/[a-zA-Z0-9_./-]+(?:\.ink)?/, "string.unquoted.filename"],
			[/$/, "", "@pop"],
		],

		// ─── VAR / CONST / LIST declaration RHS ─────────────────────────────────
		declaration: [
			// Match the variable name immediately after the keyword
			[/\s+/, ""],
			[/(?<=VAR\s+)[a-zA-Z_][a-zA-Z0-9_]*/, "variable.other.global"],
			[/(?<=CONST\s+)[a-zA-Z_][a-zA-Z0-9_]*/, "variable.other.constant"],
			[/(?<=LIST\s+)[a-zA-Z_][a-zA-Z0-9_]*/, "variable.other.list"],
			// Monarch lookbehinds aren't supported; use a simpler identifier match
			// (the storage.type keyword token already signals context)
			[/[a-zA-Z_][a-zA-Z0-9_]*/, "variable.other.global"],
			[/=/, "keyword.operator.assignment"],
			{ include: "@logic" },
			[/$/, "", "@pop"],
		],

		// ─── Tilde logic  ~ expression ───────────────────────────────────────────
		tildeLogic: [{ include: "@logic" }, [/$/, "", "@pop"]],

		// ─── Tag content  # … ────────────────────────────────────────────────────
		tag: [
			[/$/, "", "@pop"],
			[/\{/, { token: "keyword.other.brackets.conditional", next: "@openBrace" }],
			[/./, "punctuation.definition.tag"],
		],

		// ─── Block comment ───────────────────────────────────────────────────────
		blockComment: [
			[/\*\//, "comment.block", "@pop"],
			[/.|\n/, "comment.block"],
		],

		// ─── Opening brace dispatcher ─────────────────────────────────────────────
		// TextMate uses lookahead to decide between variableText ({…|…}),
		// conditionalText ({cond:…}), conditionalBlock ({…\n}), and multiline
		// sequence blocks ({stopping:…}).  Monarch is line-based and can't look
		// ahead across lines, so we approximate:
		//  • If the very next token is a sequence keyword → multilineBlock
		//  • Otherwise enter a generic brace body that handles | and :
		openBrace: [
			// Sequence / multiline blocks: { stopping: … }  { cycle: … }  etc.
			[
				/(stopping|shuffle(?:\s+(?:once|stopping))?|cycle|once)\s*:/,
				{ token: "keyword.other.multiline-type", next: "@multilineBraceBody" },
			],
			// Sequence modifier at the start:  {& …}  {~ …}  {! …}
			[/[&!~]/, "keyword.other"],
			// Delegate to brace body
			[/(?=.)/, { token: "", next: "@braceBody" }],
		],

		// ─── Generic brace body  ─────────────────────────────────────────────────
		braceBody: [
			[/\}/, { token: "keyword.other.brackets.conditional", next: "@pop" }],
			// Nested brace
			[/\{/, { token: "keyword.other.brackets.conditional", next: "@openBrace" }],
			// Pipe (alternative separator)
			[/(?<!\\)\|/, "keyword.other.alternative"],
			// Colon (condition separator in conditional text  { cond: text })
			[/:/, "keyword.other.conditional"],
			// Glue
			[/<>/, "keyword.other.glue"],
			// Diverts
			[/->/, { token: "keyword.other.divert", next: "@afterDivert" }],
			[/<-/, { token: "keyword.other.thread", next: "@afterThread" }],
			// Logic tokens (numbers, strings, operators, identifiers)
			{ include: "@logic" },
			// Plain text inside braces
			[/./, ""],
		],

		// ─── Multiline brace body  { stopping: - line \n - line \n } ─────────────
		multilineBraceBody: [
			[/\}/, { token: "keyword.other.brackets.conditional", next: "@pop" }],
			// Each option line starts with -
			[/^\s*-\s*/, "keyword.other.multiline-line"],
			[/\/\/.*$/, "comment.line.double-slash"],
			[/\/\*/, "comment.block", "@blockComment"],
			[/#/, "punctuation.definition.tag", "@tag"],
			[/<>/, "keyword.other.glue"],
			[/->/, { token: "keyword.other.divert", next: "@afterDivert" }],
			[/<-/, { token: "keyword.other.thread", next: "@afterThread" }],
			[/\{/, { token: "keyword.other.brackets.conditional", next: "@openBrace" }],
			[/./, ""],
		],

		// ─── Shared logic tokens (used inside {}, ~, declarations, params) ────────
		logic: [
			// Comments
			[/\/\/.*$/, "comment.line.double-slash"],
			[/\/\*/, "comment.block", "@blockComment"],

			// Diverts
			[/->/, { token: "keyword.other.divert", next: "@afterDivert" }],
			[/<-/, { token: "keyword.other.thread", next: "@afterThread" }],

			// return keyword
			[/\breturn\b/, "keyword.control.return"],

			// temp keyword and its variable
			[/\btemp\b/, "storage.type.temp"],

			// Arithmetic operators
			[/\+|-|\*|\/|%|\bmod\b/, "keyword.operator.arithmetic"],

			// Comparison operators
			[/==|!=|<=|>=|<|>|\?/, "keyword.operator.comparison"],

			// Boolean keywords
			[/\b(not|or|true|false)\b/, "constant.language.boolean"],

			// Math builtins
			[/\b(POW|RANDOM|INT|FLOOR|FLOAT)\b/, "support.function.math"],

			// Number literals  (integer or float)
			[/\b\d+(?:\.\d+)?\b/, "constant.numeric"],

			// String literals
			[/"/, { token: "string.quoted.double", next: "@string" }],

			// Assignment
			[/=(?!=)/, "keyword.operator.assignment"],

			// Function call  identifier(
			[/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/, "entity.name.function"],

			// General identifier / variable
			[/[a-zA-Z_][a-zA-Z0-9_]*/, "variable.other.global"],

			// Punctuation
			[/[(),]/, "delimiter"],
		],

		// ─── String literal body ──────────────────────────────────────────────────
		string: [
			[/"/, { token: "string.quoted.double", next: "@pop" }],
			[/\\./, "constant.character.escape"],
			// Embedded { } inside strings
			[/\{/, { token: "keyword.other.brackets.conditional", next: "@openBrace" }],
			[/[^"\\{]+/, "string.quoted.double"],
		],
	},
};

export function registerInk(monaco: Monaco) {
	monaco.languages.register({ id: "ink" });
	monaco.languages.setMonarchTokensProvider("ink", inkLanguage as any);

	// Basic language configuration (brackets, comments, auto-closing pairs)
	monaco.languages.setLanguageConfiguration("ink", {
		comments: {
			lineComment: "//",
			blockComment: ["/*", "*/"],
		},
		brackets: [
			["{", "}"],
			["[", "]"],
			["(", ")"],
		],
		autoClosingPairs: [
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" },
			{ open: '"', close: '"' },
		],
		surroundingPairs: [
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" },
			{ open: '"', close: '"' },
		],
	});
}
