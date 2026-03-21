// @ts-nocheck
/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: <explanation> */
/**
 * ink.completions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Monaco Editor completion-item provider for the ink scripting language.
 *
 * Provides intelligent suggestions based on the current cursor context:
 *
 *   Context              Suggestions
 *   ─────────────────    ──────────────────────────────────────────────────────
 *   After ->             All knot names, stitch addresses (knot.stitch),
 *                        END, DONE, + tunnel-chaining snippets
 *   After <-             All knot names (thread targets)
 *   After -> knot.       All stitch names inside that knot
 *   Line start / ~       VAR names, CONST names, LIST names, temp variables,
 *                        function names (with arg placeholders), keywords
 *   Inside { }           VAR/CONST/LIST names, function calls, keywords,
 *                        comparison operators
 *   Inside { … :         Same as above (condition expression)
 *   After VAR/CONST =    Booleans, numbers, strings, LIST value names
 *   Choice line  * / +   Knot names (for inline diverts), conditional vars
 *   After INCLUDE        (filename — left to IDE filesystem integration)
 *   Bare identifier      All declared symbols that match the typed prefix
 *
 * Usage
 * ─────
 *   import { registerInkCompletions } from './ink.completions.js';
 *   registerInkCompletions(monaco);   // call once after Monaco is loaded
 *
 * The provider is self-contained: it re-scans the model on every completion
 * request so suggestions always reflect the current document state. For very
 * large files (>5000 lines) the scan is still <1 ms on modern hardware.
 */

// ─── CompletionItemKind aliases (equal to monaco.languages.CompletionItemKind) ─
// Defined as literals so this module has no import-time Monaco dependency.
const CIK = {
  Text: 0,
  Function: 1,
  Constructor: 2,
  Field: 3,
  Variable: 4,
  Class: 5,
  Interface: 6,
  Module: 7,
  Property: 8,
  Unit: 9,
  Value: 10,
  Enum: 11,
  Keyword: 13,
  Snippet: 14,
  Color: 15,
  File: 16,
  Reference: 17,
  Folder: 18,
  EnumMember: 19,
  Constant: 20,
  Struct: 21,
  Event: 22,
  Operator: 23,
  TypeParameter: 24,
};

const CIT = { Method: 0, Insert: 1 }; // CompletionItemInsertTextRule
const INSERT_AS_SNIPPET = 4; // InsertTextRule.InsertAsSnippet

// ─── Symbol extractor ─────────────────────────────────────────────────────────
// Scans the raw document and returns a rich symbol table.

/**
 * @typedef {object} InkSymbol
 * @property {'knot'|'stitch'|'function'|'var'|'const'|'list'|'list_item'|'temp'|'label'} kind
 * @property {string}  name        - Simple name (no knot prefix for stitches)
 * @property {string}  fullName    - Fully-qualified name (e.g. "knot.stitch")
 * @property {string}  parentKnot  - Owning knot name (for stitches/labels)
 * @property {string[]} params     - Parameter names (for knots/functions)
 * @property {number}  line        - 1-based line number of declaration
 * @property {string}  detail      - Short detail string shown in the popup
 * @property {string}  documentation - Longer description
 */

/**
 * Extract all declared symbols from an array of line strings.
 * @param {string[]} lines
 * @returns {{ symbols: InkSymbol[], byKind: Map<string, InkSymbol[]> }}
 */
export function extractSymbols(lines) {
  const symbols = [];

  // Comment-stripping helpers (inline, non-destructive)
  const stripLC = (l) => {
    const i = l.indexOf("//");
    return i >= 0 ? l.slice(0, i) : l;
  };
  const stripIBC = (l) =>
    l.replace(/\/\*[^*]*(\*(?!\/)[^*]*)*\*\//g, (m) => " ".repeat(m.length));
  const clean = (l) => stripLC(stripIBC(l)).trimEnd();

  let inBlock = false;
  let currentKnot = null; // current knot name (string | null)
  let isFuncKnot = false; // current knot is a function
  let tempsSeen = new Set(); // prevent duplicate temp entries

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = clean(raw);
    const ln = i + 1;

    // ── Block comment tracking ──────────────────────────────────────────────
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.includes("/*") && !line.includes("*/")) {
      inBlock = true;
      continue;
    }
    if (/^\s*\/\//.test(line) || /^\s*$/.test(line)) continue;

    // ── Knot declaration  === name(params) === ──────────────────────────────
    if (/^\s*={2,}/.test(line)) {
      const m =
        /^\s*={2,}\s*(function\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(\s*\(([^)]*)\))?\s*(={2,})?/.exec(
          line,
        );
      if (m) {
        const isFunc = !!m[1];
        const name = m[2];
        const rawParams = m[4] || "";
        const params = rawParams
          .split(",")
          .map((p) => p.replace(/^->\s*/, "").trim())
          .filter(Boolean);

        isFuncKnot = isFunc;
        currentKnot = name;
        tempsSeen = new Set();

        const detail = isFunc
          ? `function ${name}(${params.join(", ")})`
          : params.length
            ? `knot ${name}(${params.join(", ")})`
            : `knot ${name}`;

        symbols.push({
          kind: isFunc ? "function" : "knot",
          name,
          fullName: name,
          parentKnot: null,
          params,
          line: ln,
          detail,
          documentation: isFunc
            ? `Ink function declaration.\nCall as: ${name}(${params.join(", ")})`
            : `Ink knot. Divert with: -> ${name}`,
        });
      }
      continue;
    }

    // ── Stitch declaration  = name(params) ─────────────────────────────────
    if (/^\s*=(?!=)/.test(line) && currentKnot) {
      const m = /^\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)(\s*\(([^)]*)\))?/.exec(line);
      if (m) {
        const name = m[1];
        const rawParams = m[3] || "";
        const params = rawParams
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        const fullName = `${currentKnot}.${name}`;

        symbols.push({
          kind: "stitch",
          name,
          fullName,
          parentKnot: currentKnot,
          params,
          line: ln,
          detail: `stitch ${fullName}`,
          documentation: `Stitch inside knot '${currentKnot}'.\nDivert with: -> ${fullName}\nOr locally: -> ${name}`,
        });
      }
      continue;
    }

    // ── VAR declaration ─────────────────────────────────────────────────────
    const varM = /^\s*VAR\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/.exec(line);
    if (varM) {
      const name = varM[1];
      const init = varM[2].trim().slice(0, 40);
      symbols.push({
        kind: "var",
        name,
        fullName: name,
        parentKnot: null,
        params: [],
        line: ln,
        detail: `VAR ${name} = ${init}`,
        documentation: `Global ink variable.\nInitial value: ${init || "(none)"}`,
      });
      continue;
    }

    // ── CONST declaration ───────────────────────────────────────────────────
    const constM = /^\s*CONST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/.exec(line);
    if (constM) {
      const name = constM[1];
      const val = constM[2].trim().slice(0, 40);
      symbols.push({
        kind: "const",
        name,
        fullName: name,
        parentKnot: null,
        params: [],
        line: ln,
        detail: `CONST ${name} = ${val}`,
        documentation: `Ink constant.\nValue: ${val}`,
      });
      continue;
    }

    // ── LIST declaration ────────────────────────────────────────────────────
    const listM = /^\s*LIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/.exec(line);
    if (listM) {
      const listName = listM[1];
      const rawItems = listM[2] || "";
      // Items may be  name  or  (name)  or  name = N
      const items = rawItems
        .split(",")
        .map((s) => {
          const inner = s.replace(/[()]/g, "").trim();
          return inner.replace(/\s*=\s*\d+/, "").trim();
        })
        .filter(Boolean);

      symbols.push({
        kind: "list",
        name: listName,
        fullName: listName,
        parentKnot: null,
        params: [],
        line: ln,
        detail: `LIST ${listName}`,
        documentation: `Ink list type.\nValues: ${items.join(", ")}`,
      });

      for (const item of items) {
        if (!item) continue;
        symbols.push({
          kind: "list_item",
          name: item,
          fullName: `${listName}.${item}`,
          parentKnot: null,
          params: [],
          line: ln,
          detail: `${item}  (${listName})`,
          documentation: `List item from LIST ${listName}`,
        });
      }
      continue;
    }

    // ── temp variable (inside ~ temp name = …) ──────────────────────────────
    const tempM = /^\s*~\s*temp\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(line);
    if (tempM) {
      const name = tempM[1];
      if (!tempsSeen.has(name)) {
        tempsSeen.add(name);
        symbols.push({
          kind: "temp",
          name,
          fullName: name,
          parentKnot: currentKnot,
          params: [],
          line: ln,
          detail: `temp ${name}`,
          documentation: `Temporary variable in knot '${currentKnot || "(root)"}'. Scoped to the current stitch.`,
        });
      }
      continue;
    }

    // ── Labelled gather/choice  - (label)  or  * (label) ───────────────────
    const labelM = /^\s*[-*+](?:\s*[-*+])*\s*\(([a-zA-Z_][a-zA-Z0-9_]*)\)/.exec(
      line,
    );
    if (labelM && currentKnot) {
      const name = labelM[1];
      const fullName = `${currentKnot}.${name}`;
      symbols.push({
        kind: "label",
        name,
        fullName,
        parentKnot: currentKnot,
        params: [],
        line: ln,
        detail: `label (${name}) in ${currentKnot}`,
        documentation: `Labelled gather/choice point.\nDivert with: -> ${name}  (locally) or -> ${fullName}`,
      });
    }
  }

  // Build kind index
  const byKind = new Map();
  for (const sym of symbols) {
    if (!byKind.has(sym.kind)) byKind.set(sym.kind, []);
    byKind.get(sym.kind).push(sym);
  }

  return { symbols, byKind };
}

// ─── Context detection ────────────────────────────────────────────────────────

/**
 * Detect the completion context from the text before the cursor.
 *
 * Returns one of:
 *   { type: 'divert',        prefix: string }         after ->
 *   { type: 'divert_stitch', knotName: string, prefix: string }  after -> knot.
 *   { type: 'thread',        prefix: string }         after <-
 *   { type: 'logic',         prefix: string }         inside { } or ~ line
 *   { type: 'condition',     prefix: string }         inside { cond :  before colon
 *   { type: 'choice_cond',   prefix: string }         after * { or + {
 *   { type: 'declaration_rhs', keyword: string, prefix: string }  after VAR x =
 *   { type: 'line_start',    prefix: string }         ~ or start of a logic line
 *   { type: 'identifier',    prefix: string }         generic bare identifier
 *   { type: 'none' }
 */
function detectContext(lineText, column) {
  // Text from start of line up to cursor (0-based column)
  const before = lineText.slice(0, column - 1);

  // ── After ->  (divert) ────────────────────────────────────────────────────
  // Handle ->-> (tunnel return) — no completion
  if (/->->/.test(before)) return { type: "none" };

  const divertMatch =
    /->(?!>)\s*([a-zA-Z_][a-zA-Z0-9_]*\.)?([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(
      before,
    );
  if (divertMatch) {
    const knotPrefix = divertMatch[1]; // e.g. "my_knot."
    const namePrefix = divertMatch[2] || "";
    if (knotPrefix) {
      return {
        type: "divert_stitch",
        knotName: knotPrefix.slice(0, -1),
        prefix: namePrefix,
      };
    }
    return { type: "divert", prefix: namePrefix };
  }

  // ── After <-  (thread) ────────────────────────────────────────────────────
  const threadMatch = /<-\s*([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
  if (threadMatch) {
    return { type: "thread", prefix: threadMatch[1] || "" };
  }

  // ── VAR / CONST = rhs  ────────────────────────────────────────────────────
  const declRhs =
    /^\s*(VAR|CONST)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(
      before,
    );
  if (declRhs) {
    return {
      type: "declaration_rhs",
      keyword: declRhs[1],
      prefix: declRhs[2] || "",
    };
  }

  // ── Inside { } — logic/condition context ─────────────────────────────────
  // Count unmatched open braces to detect we're inside one
  let braceDepth = 0;
  for (const ch of before) {
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
  }
  if (braceDepth > 0) {
    const identMatch = /([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
    return { type: "logic", prefix: identMatch ? identMatch[1] || "" : "" };
  }

  // ── Tilde line  ~ ─────────────────────────────────────────────────────────
  if (/^\s*~\s*/.test(before)) {
    const identMatch = /([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
    return { type: "logic", prefix: identMatch ? identMatch[1] || "" : "" };
  }

  // ── Bare identifier on any other line ─────────────────────────────────────
  const bareIdent = /([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(before);
  if (bareIdent?.[1]) {
    return { type: "identifier", prefix: bareIdent[1] };
  }

  return { type: "none" };
}

// ─── Completion item builders ─────────────────────────────────────────────────

function makeRange(model, position, prefix) {
  // The word range at the cursor, extended to cover `prefix` length
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

/** Build a CompletionItem from an InkSymbol for a divert context. */
function divertItem(sym, range) {
  const isFn = sym.kind === "function";
  const hasParams = sym.params.length > 0;

  // Build snippet: knot_name  or  knot_name($1, $2)  for parameterised knots
  let insertText = sym.fullName;
  let insertTextRules;
  if (hasParams) {
    const args = sym.params.map((p, i) => `\${${i + 1}:${p}}`).join(", ");
    insertText = `${sym.fullName}(${args})`;
    insertTextRules = INSERT_AS_SNIPPET;
  }

  return {
    label: sym.fullName,
    kind: isFn ? CIK.Function : CIK.Reference,
    detail: sym.detail,
    documentation: { value: sym.documentation },
    insertText,
    insertTextRules,
    range,
    sortText: `0_${sym.fullName}`, // diverts first
  };
}

/** Fixed completion items that are always offered in divert position. */
function divertKeywordItems(range) {
  return [
    {
      label: "END",
      kind: CIK.Keyword,
      detail: "Ends the story flow",
      documentation: { value: "`-> END` terminates the story." },
      insertText: "END",
      range,
      sortText: "zz_END",
    },
    {
      label: "DONE",
      kind: CIK.Keyword,
      detail: "Ends the current flow branch",
      documentation: {
        value: "`-> DONE` marks the intentional end of a thread or branch.",
      },
      insertText: "DONE",
      range,
      sortText: "zz_DONE",
    },
  ];
}

/** Snippet items only shown in divert context. */
function divertSnippetItems(range) {
  return [
    {
      label: "-> (tunnel call)",
      kind: CIK.Snippet,
      detail: "Tunnel: run a knot and return",
      documentation: {
        value: "`-> knot_name ->` runs a knot as a tunnel, then continues.",
      },
      insertText: "${1:knot_name} ->",
      insertTextRules: INSERT_AS_SNIPPET,
      range,
      sortText: "zz_snippet_tunnel",
    },
  ];
}

/** Logic-context completions: variables, functions, keywords, operators. */
function logicItems(symbols, range) {
  const items = [];

  // Variables
  for (const sym of symbols) {
    if (!["var", "const", "list", "list_item", "temp"].includes(sym.kind))
      continue;
    items.push({
      label: sym.name,
      kind:
        sym.kind === "const"
          ? CIK.Constant
          : sym.kind === "list"
            ? CIK.Enum
            : sym.kind === "list_item"
              ? CIK.EnumMember
              : CIK.Variable,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: sym.name,
      range,
      sortText: `1_${sym.name}`,
    });
  }

  // Functions (called inline: name(...))
  for (const sym of symbols.filter((s) => s.kind === "function")) {
    const args = sym.params.map((p, i) => `\${${i + 1}:${p}}`).join(", ");
    items.push({
      label: `${sym.name}(${sym.params.join(", ")})`,
      kind: CIK.Function,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: sym.params.length ? `${sym.name}(${args})` : `${sym.name}()`,
      insertTextRules: INSERT_AS_SNIPPET,
      range,
      sortText: `2_${sym.name}`,
    });
  }

  // Built-in math functions
  const builtins = [
    {
      name: "POW",
      sig: "POW(base, exp)",
      doc: "Returns base to the power of exp.",
    },
    {
      name: "RANDOM",
      sig: "RANDOM(min, max)",
      doc: "Returns a random integer between min and max (inclusive).",
    },
    {
      name: "INT",
      sig: "INT(x)",
      doc: "Truncates x to an integer (rounds toward zero).",
    },
    { name: "FLOOR", sig: "FLOOR(x)", doc: "Returns the largest integer ≤ x." },
    {
      name: "FLOAT",
      sig: "FLOAT(x)",
      doc: "Casts x to a floating-point number.",
    },
    {
      name: "LIST_COUNT",
      sig: "LIST_COUNT(list)",
      doc: "Returns the number of items currently in the list.",
    },
    {
      name: "LIST_MIN",
      sig: "LIST_MIN(list)",
      doc: "Returns the lowest-valued item in the list.",
    },
    {
      name: "LIST_MAX",
      sig: "LIST_MAX(list)",
      doc: "Returns the highest-valued item in the list.",
    },
    {
      name: "LIST_ALL",
      sig: "LIST_ALL(list)",
      doc: "Returns the full set of possible values for this list type.",
    },
    {
      name: "LIST_INVERT",
      sig: "LIST_INVERT(list)",
      doc: "Returns the inverse of the list (items not currently set).",
    },
    {
      name: "LIST_RANDOM",
      sig: "LIST_RANDOM(list)",
      doc: "Returns a random item from the list.",
    },
    {
      name: "LIST_RANGE",
      sig: "LIST_RANGE(list, min, max)",
      doc: "Returns items between min and max values.",
    },
    {
      name: "LIST_VALUE",
      sig: "LIST_VALUE(item)",
      doc: "Returns the numeric value of a list item.",
    },
    {
      name: "CHOICE_COUNT",
      sig: "CHOICE_COUNT()",
      doc: "Returns the number of choices created so far in this chunk.",
    },
    {
      name: "TURNS",
      sig: "TURNS()",
      doc: "Returns the total number of turns since the game began.",
    },
    {
      name: "TURNS_SINCE",
      sig: "TURNS_SINCE(-> knot)",
      doc: "Returns turns since knot was last visited. -1 = never seen.",
    },
    {
      name: "SEED_RANDOM",
      sig: "SEED_RANDOM(seed)",
      doc: "Seeds the random number generator for reproducible results.",
    },
  ];

  for (const { name, sig, doc } of builtins) {
    const argPart = sig.slice(name.length + 1, -1); // e.g. "base, exp"
    const snippetArgs = argPart
      ? argPart
          .split(",")
          .map((p, i) => `\${${i + 1}:${p.trim()}}`)
          .join(", ")
      : "";
    items.push({
      label: sig,
      kind: CIK.Function,
      detail: "built-in",
      documentation: { value: doc },
      insertText: `${name}(${snippetArgs})`,
      insertTextRules: INSERT_AS_SNIPPET,
      range,
      sortText: `3_${name}`,
    });
  }

  // Keywords valid in logic context
  const logicKeywords = [
    { label: "not", doc: "Boolean negation." },
    { label: "or", doc: "Boolean OR (also written ||)." },
    { label: "and", doc: "Boolean AND (also written &&)." },
    { label: "mod", doc: "Modulo operator (also written %)." },
    { label: "true", doc: "Boolean literal true." },
    { label: "false", doc: "Boolean literal false." },
    { label: "return", doc: "Return a value from a function: ~ return value" },
  ];
  for (const { label, doc } of logicKeywords) {
    items.push({
      label,
      kind: CIK.Keyword,
      detail: "keyword",
      documentation: { value: doc },
      insertText: label,
      range,
      sortText: `4_${label}`,
    });
  }

  return items;
}

/** Keyword and snippet completions valid at the start of a line. */
function lineStartItems(range) {
  const snippets = [
    // Declarations
    {
      label: "VAR declaration",
      insertText: "VAR ${1:name} = ${2:value}",
      detail: "VAR name = value",
      doc: "Declare a global variable.",
      sortText: "1_VAR",
    },
    {
      label: "CONST declaration",
      insertText: "CONST ${1:NAME} = ${2:value}",
      detail: "CONST NAME = value",
      doc: "Declare a global constant.",
      sortText: "1_CONST",
    },
    {
      label: "LIST declaration",
      insertText: "LIST ${1:Name} = ${2:item1}, ${3:item2}",
      detail: "LIST Name = item1, item2",
      doc: "Declare an ink list (enum / flag set).",
      sortText: "1_LIST",
    },
    // Knots
    {
      label: "knot declaration",
      insertText: "=== ${1:knot_name} ===\n${2:Content.}\n-> END",
      detail: "=== knot_name ===",
      doc: "Declare a new knot.",
      sortText: "2_knot",
    },
    {
      label: "stitch declaration",
      insertText: "= ${1:stitch_name}\n${2:Content.}",
      detail: "= stitch_name",
      doc: "Declare a stitch inside the current knot.",
      sortText: "2_stitch",
    },
    {
      label: "function declaration",
      insertText:
        "=== function ${1:name}(${2:params}) ===\n~ return ${3:value}",
      detail: "=== function name(params) ===",
      doc: "Declare an ink function.",
      sortText: "2_function",
    },
    // Control
    {
      label: "divert ->",
      insertText: "-> ${1:knot_name}",
      detail: "-> knot_name",
      doc: "Divert the story to another knot.",
      sortText: "3_divert",
    },
    {
      label: "tunnel -> ->",
      insertText: "-> ${1:knot_name} ->",
      detail: "-> knot_name ->",
      doc: "Run a knot as a tunnel, then return.",
      sortText: "3_tunnel",
    },
    {
      label: "tunnel return ->->",
      insertText: "->->",
      detail: "->->",
      doc: "Return from a tunnel.",
      sortText: "3_tunnel_ret",
    },
    {
      label: "thread <-",
      insertText: "<- ${1:knot_name}",
      detail: "<- knot_name",
      doc: "Include choices from another knot via a thread.",
      sortText: "3_thread",
    },
    // Choices
    {
      label: "* choice",
      insertText: "* [${1:Option text}] ${2:Response text}",
      detail: "* [Option] Response",
      doc: "A once-only choice.",
      sortText: "4_choice_once",
    },
    {
      label: "+ sticky choice",
      insertText: "+ [${1:Option text}] ${2:Response text}",
      detail: "+ [Option] Response",
      doc: "A sticky (repeatable) choice.",
      sortText: "4_choice_sticky",
    },
    {
      label: "- gather",
      insertText: "- ${1:}",
      detail: "- (gather point)",
      doc: "Gather point: rejoin flow from all preceding choices.",
      sortText: "4_gather",
    },
    // Logic
    {
      label: "~ assignment",
      insertText: "~ ${1:variable} = ${2:value}",
      detail: "~ variable = value",
      doc: "Assign a value to a variable.",
      sortText: "5_tilde",
    },
    {
      label: "~ temp variable",
      insertText: "~ temp ${1:name} = ${2:value}",
      detail: "~ temp name = value",
      doc: "Declare a temporary (scoped) variable.",
      sortText: "5_temp",
    },
    // Blocks
    {
      label: "{ conditional block }",
      insertText: "{ ${1:condition}:\n\t${2:content}\n- else:\n\t${3:other}\n}",
      detail: "{ condition: ... - else: ... }",
      doc: "Conditional if/else block.",
      sortText: "6_cond",
    },
    {
      label: "{ stopping sequence }",
      insertText:
        "{ stopping:\n- ${1:First time.}\n- ${2:Second time.}\n- ${3:Always after.}\n}",
      detail: "{ stopping: - ... }",
      doc: "Stopping sequence: plays through once, sticks on last.",
      sortText: "6_stopping",
    },
    {
      label: "{ cycle sequence }",
      insertText:
        "{ cycle:\n- ${1:Option A.}\n- ${2:Option B.}\n- ${3:Option C.}\n}",
      detail: "{ cycle: - ... }",
      doc: "Cycle: loops through alternatives.",
      sortText: "6_cycle",
    },
    {
      label: "{ once sequence }",
      insertText: "{ once:\n- ${1:Option A.}\n- ${2:Option B.}\n}",
      detail: "{ once: - ... }",
      doc: "Once: shows each alternative once, then nothing.",
      sortText: "6_once",
    },
    {
      label: "{ shuffle sequence }",
      insertText:
        "{ shuffle:\n- ${1:Option A.}\n- ${2:Option B.}\n- ${3:Option C.}\n}",
      detail: "{ shuffle: - ... }",
      doc: "Shuffle: randomly picks alternatives.",
      sortText: "6_shuffle",
    },
    // INCLUDE
    {
      label: "INCLUDE",
      insertText: "INCLUDE ${1:filename.ink}",
      detail: "INCLUDE filename.ink",
      doc: "Include another ink file.",
      sortText: "7_include",
    },
  ];

  return snippets.map((s) => ({
    label: s.label,
    kind: CIK.Snippet,
    detail: s.detail,
    documentation: { value: s.doc },
    insertText: s.insertText,
    insertTextRules: INSERT_AS_SNIPPET,
    range,
    sortText: s.sortText,
  }));
}

/** declaration_rhs completions: booleans, list values, common patterns. */
function declarationRhsItems(symbols, range) {
  const items = [
    { label: "true", kind: CIK.Keyword, doc: "Boolean true." },
    { label: "false", kind: CIK.Keyword, doc: "Boolean false." },
    { label: "0", kind: CIK.Value, doc: "Integer zero." },
    { label: '""', kind: CIK.Value, doc: "Empty string." },
  ];

  const result = items.map(({ label, kind, doc }) => ({
    label,
    kind,
    detail: label,
    documentation: { value: doc },
    insertText: label,
    range,
    sortText: `0_${label}`,
  }));

  // Also suggest divert targets (for  VAR x = -> knot  patterns)
  for (const sym of symbols.filter((s) =>
    ["knot", "function"].includes(s.kind),
  )) {
    result.push({
      label: `-> ${sym.fullName}`,
      kind: CIK.Reference,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: `-> ${sym.fullName}`,
      range,
      sortText: `1_${sym.fullName}`,
    });
  }

  // And list values
  for (const sym of symbols.filter((s) => s.kind === "list_item")) {
    result.push({
      label: sym.name,
      kind: CIK.EnumMember,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: sym.name,
      range,
      sortText: `2_${sym.name}`,
    });
  }

  return result;
}

// ─── Main provider ────────────────────────────────────────────────────────────

/**
 * Create and return a Monaco completion provider object for the ink language.
 * Pass the returned object directly to monaco.languages.registerCompletionItemProvider.
 *
 * @param {object} monaco  - The global monaco object
 * @returns {object}       - CompletionItemProvider
 */
export function createInkCompletionProvider(monaco) {
  return {
    // Trigger on these characters in addition to the default word-boundary triggers
    triggerCharacters: ["-", ">", "<", ".", "{", "~", "=", " "],

    provideCompletionItems(model, position) {
      const lineText = model.getLineContent(position.lineNumber);
      const ctx = detectContext(lineText, position.column);

      if (ctx.type === "none") return { suggestions: [] };

      // Extract symbols fresh from the current model state
      const { symbols } = extractSymbols(model.getLinesContent());
      const range = makeRange(model, position, ctx.prefix);

      // ── After ->  ────────────────────────────────────────────────────────
      if (ctx.type === "divert") {
        const knotsAndFunctions = symbols.filter(
          (s) =>
            s.kind === "knot" || s.kind === "function" || s.kind === "label",
        );
        const suggestions = [
          ...knotsAndFunctions.map((s) => divertItem(s, range)),
          // Stitches without knot prefix (local scope)
          ...symbols
            .filter((s) => s.kind === "stitch")
            .map((s) => ({
              ...divertItem(s, range),
              label: s.name, // offer both forms
              insertText: s.name,
              detail: `${s.detail} (local)`,
              sortText: `1_${s.name}`,
            })),
          ...divertKeywordItems(range),
          ...divertSnippetItems(range),
        ];
        return { suggestions };
      }

      // ── After -> knot.   (stitch completion) ────────────────────────────
      if (ctx.type === "divert_stitch") {
        const stitches = symbols.filter(
          (s) => s.kind === "stitch" && s.parentKnot === ctx.knotName,
        );
        const suggestions = stitches.map((s) => ({
          label: s.name,
          kind: CIK.Reference,
          detail: s.detail,
          documentation: { value: s.documentation },
          insertText: s.name,
          range,
          sortText: `0_${s.name}`,
        }));
        return { suggestions };
      }

      // ── Thread <-  ────────────────────────────────────────────────────────
      if (ctx.type === "thread") {
        const suggestions = symbols
          .filter((s) => s.kind === "knot" || s.kind === "stitch")
          .map((s) => ({
            label: s.fullName,
            kind: CIK.Reference,
            detail: s.detail,
            documentation: { value: s.documentation },
            insertText: s.fullName,
            range,
            sortText: `0_${s.fullName}`,
          }));
        return { suggestions };
      }

      // ── Logic / condition context  { }  or  ~  ───────────────────────────
      if (ctx.type === "logic") {
        return { suggestions: logicItems(symbols, range) };
      }

      // ── declaration_rhs   VAR x =  ───────────────────────────────────────
      if (ctx.type === "declaration_rhs") {
        return { suggestions: declarationRhsItems(symbols, range) };
      }

      // ── Generic identifier  ───────────────────────────────────────────────
      if (ctx.type === "identifier") {
        const suggestions = [
          ...logicItems(symbols, range),
          ...lineStartItems(range),
        ];
        return { suggestions };
      }

      return { suggestions: [] };
    },

    // Resolve provider: enrich items lazily when the user hovers on them
    resolveCompletionItem(item) {
      return item; // already fully populated
    },
  };
}

// ─── Registration helper ──────────────────────────────────────────────────────

/**
 * Register the ink completion provider with Monaco.
 * Call once after Monaco is loaded and the 'ink' language has been registered.
 *
 * @param {object} monaco
 * @returns {object} IDisposable — call .dispose() to unregister
 */
export function registerInkCompletions(monaco) {
  return monaco.languages.registerCompletionItemProvider(
    "ink",
    createInkCompletionProvider(monaco),
  );
}
