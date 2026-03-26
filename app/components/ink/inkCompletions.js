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
 *   Action …             Action name list, then named-parameter snippet
 *
 * Usage
 * ─────
 *   import { registerInkCompletions } from './ink.completions.js';
 *
 *   // Without actions:
 *   registerInkCompletions(monaco);
 *
 *   // With actions:
 *   registerInkCompletions(monaco, [
 *     { name: 'camera.shake',  params: ['intensity', 'duration'] },
 *     { name: 'audio.play',    params: ['clip', 'volume'] },
 *     { name: 'flag.set',      params: ['flagName', 'value'] },
 *   ]);
 *
 * Each action produces a snippet like:
 *   Action camera.shake intensity: ${1:intensity} duration: ${2:duration}
 *
 * The provider is self-contained: it re-scans the model on every completion
 * request so suggestions always reflect the current document state.
 */

// ─── CompletionItemKind aliases ───────────────────────────────────────────────
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

const INSERT_AS_SNIPPET = 4; // InsertTextRule.InsertAsSnippet

// ─── Symbol extractor ─────────────────────────────────────────────────────────

/**
 * @typedef {object} InkSymbol
 * @property {'knot'|'stitch'|'function'|'var'|'const'|'list'|'list_item'|'temp'|'label'} kind
 * @property {string}  name
 * @property {string}  fullName
 * @property {string}  parentKnot
 * @property {string[]} params
 * @property {number}  line
 * @property {string}  detail
 * @property {string}  documentation
 */

/**
 * @typedef {object} ActionDef
 * @property {string}   name    - Action name, e.g. "camera.shake"
 * @property {string[]} params  - Named parameters, e.g. ["intensity", "duration"]
 */

/**
 * @typedef {object} EventDef
 * @property {string}   name    - Event name, e.g. "targeting.setTarget"
 * @property {string[]} params  - Matchable parameter names, e.g. ["shipId", "targetId"]
 */

/**
 * Extract all declared symbols from an array of line strings.
 * @param {string[]} lines
 * @returns {{ symbols: InkSymbol[], byKind: Map<string, InkSymbol[]> }}
 */
export function extractSymbols(lines) {
  const symbols = [];

  const stripLC = (l) => {
    const i = l.indexOf("//");
    return i >= 0 ? l.slice(0, i) : l;
  };
  const stripIBC = (l) =>
    l.replace(/\/\*[^*]*(\*(?!\/)[^*]*)*\*\//g, (m) => " ".repeat(m.length));
  const clean = (l) => stripLC(stripIBC(l)).trimEnd();

  let inBlock = false;
  let currentKnot = null;
  let tempsSeen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = clean(raw);
    const ln = i + 1;

    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.includes("/*") && !line.includes("*/")) {
      inBlock = true;
      continue;
    }
    if (/^\s*\/\//.test(line) || /^\s*$/.test(line)) continue;

    // Knot
    if (/^\s*={2,}/.test(line)) {
      const m =
        /^\s*={2,}\s*(function\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(\s*\(([^)]*)\))?\s*(={2,})?/.exec(
          line,
        );
      if (m) {
        const isFunc = !!m[1];
        const name = m[2];
        const params = (m[4] || "")
          .split(",")
          .map((p) => p.replace(/^->\s*/, "").trim())
          .filter(Boolean);
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

    // Stitch
    if (/^\s*=(?!=)/.test(line) && currentKnot) {
      const m = /^\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)(\s*\(([^)]*)\))?/.exec(line);
      if (m) {
        const name = m[1];
        const params = (m[3] || "")
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

    // VAR
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

    // CONST
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

    // LIST
    const listM = /^\s*LIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/.exec(line);
    if (listM) {
      const listName = listM[1];
      const items = (listM[2] || "")
        .split(",")
        .map((s) =>
          s
            .replace(/[()]/g, "")
            .trim()
            .replace(/\s*=\s*\d+/, "")
            .trim(),
        )
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

    // temp
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

    // Label
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
 * Contexts:
 *   { type: 'action_keyword' }              — line contains a partial "Action" or "Event" keyword
 *   { type: 'action_name', prefix: string } — after "Action ", choosing an action name
 *   { type: 'none' }
 */
function detectContext(lineText, column) {
  const before = lineText.slice(0, column - 1);

  // ── Action / Event keyword contexts ──────────────────────────────────────
  //
  // These constructs live at the start of a line (no # prefix).

  // Stage 1: user has typed "Action " (with trailing space) or more —
  //          they are now choosing / have chosen the action name.
  const actionNameMatch = /^\s*Action:\s+([a-zA-Z0-9._-]*)$/.exec(before);
  if (actionNameMatch) {
    return { type: "action_name", prefix: actionNameMatch[1] };
  }

  // Stage 2+3: user has typed a partial "Action" or "Event" keyword at line start.
  // Only fire when the line is solely this partial keyword — avoids colliding with
  // ink logic or narrative text that happens to start with those letters.
  const actionKwMatch =
    /^\s*((?:Action:|Event:)\w*|Act\w*|Eve\w*|Ac\w?|Ev\w?)$/.exec(before);
  if (actionKwMatch) {
    return { type: "action_keyword", matched: actionKwMatch[1] };
  }

  // ── Event sub-contexts ────────────────────────────────────────────────────
  //
  // Full shape: Event event.name param: {var} [persist] divertTarget

  // Stage E4: cursor is after "persist " — only divert targets.
  const eventDivertMatch =
    /^\s*Event:\s+[a-zA-Z0-9._-]+(\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*\{[^}]*\})*\s+persist\s+([a-zA-Z_][a-zA-Z0-9_.]*)?$/.exec(
      before,
    );
  if (eventDivertMatch) {
    return { type: "event_divert", prefix: eventDivertMatch[2] || "" };
  }

  // Stage E3: event name + zero-or-more params typed, no "persist" yet —
  //           offer "persist" keyword AND divert targets.
  const eventPersistMatch =
    /^\s*Event:\s+[a-zA-Z0-9._-]+(\s+[a-zA-Z_][a-zA-Z0-9_]*:\s*\{[^}]*\})*\s+([a-zA-Z_][a-zA-Z0-9_.]*)?$/.exec(
      before,
    );
  if (eventPersistMatch) {
    return { type: "event_persist", prefix: eventPersistMatch[2] || "" };
  }

  // Stage E2: "Event " typed — user is choosing the event name.
  const eventNameMatch = /^\s*Event:\s+([a-zA-Z0-9._-]*)$/.exec(before);
  if (eventNameMatch) {
    return { type: "event_name", prefix: eventNameMatch[1] };
  }

  // ── Original contexts (unchanged) ─────────────────────────────────────────
  if (/->->/.test(before)) return { type: "none" };

  const divertMatch =
    /->(?!>)\s*([a-zA-Z_][a-zA-Z0-9_]*\.)?([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(
      before,
    );
  if (divertMatch) {
    const knotPrefix = divertMatch[1];
    const namePrefix = divertMatch[2] || "";
    if (knotPrefix)
      return {
        type: "divert_stitch",
        knotName: knotPrefix.slice(0, -1),
        prefix: namePrefix,
      };
    return { type: "divert", prefix: namePrefix };
  }

  const threadMatch = /<-\s*([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
  if (threadMatch) return { type: "thread", prefix: threadMatch[1] || "" };

  const declRhs =
    /^\s*(VAR|CONST)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(
      before,
    );
  if (declRhs)
    return {
      type: "declaration_rhs",
      keyword: declRhs[1],
      prefix: declRhs[2] || "",
    };

  let braceDepth = 0;
  for (const ch of before) {
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
  }
  if (braceDepth > 0) {
    const identMatch = /([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
    return { type: "logic", prefix: identMatch ? identMatch[1] || "" : "" };
  }

  if (/^\s*~\s*/.test(before)) {
    const identMatch = /([a-zA-Z_][a-zA-Z0-9_]*)?$/.exec(before);
    return { type: "logic", prefix: identMatch ? identMatch[1] || "" : "" };
  }

  const bareIdent = /([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(before);
  if (bareIdent?.[1]) return { type: "identifier", prefix: bareIdent[1] };

  return { type: "none" };
}

// ─── Action completion builders ───────────────────────────────────────────────

/**
 * Build the "Action" and "Event" keyword items.
 *
 * The range covers the partial keyword the user has typed so the replacement
 * always produces the complete keyword string.
 *
 * @param {string} matched    - the partial text the user has typed (ctx.matched)
 * @param {number} lineNumber
 * @param {number} column     - cursor column (1-based)
 * @returns {object[]}
 */
function hashKeywordItems(matched, lineNumber, column) {
  const endColumn = column - 1;
  const startColumn = endColumn - matched.length;

  const range = {
    startLineNumber: lineNumber,
    endLineNumber: lineNumber,
    startColumn,
    endColumn,
  };

  return [
    {
      label: "Action",
      kind: CIK.Keyword,
      detail: "Ink action",
      documentation: {
        value:
          "Trigger a named action with parameters.\nAfter selecting, choose an action name from the list.",
      },
      insertText: "Action: ",
      range,
      sortText: "0_action_keyword",
    },
    {
      label: "Event",
      kind: CIK.Keyword,
      detail: "Ink event listener",
      documentation: {
        value:
          "Listen for a named event, optionally matching parameters.\nSyntax: `Event: event.name param: {var} [persist] divertTarget`",
      },
      insertText: "Event: ",
      range,
      sortText: "0_event_keyword",
    },
  ];
}

/**
 * Build one completion item per registered action.
 *
 * The inserted snippet for an action with params looks like:
 *   camera.shake intensity: ${1:intensity} duration: ${2:duration}
 *
 * For actions with no params:
 *   flag.reset
 *
 * The label shown in the list is just the action name; the full
 * formatted signature appears in the detail column.
 *
 * @param {ActionDef[]} actions
 * @param {object}      range
 * @returns {object[]}
 */
function actionNameItems(actions, range) {
  return actions.map((action, idx) => {
    const { name, params = [] } = action;

    // Build a human-readable signature for the detail column
    const signature = params.length
      ? `${name} ${params.map((p) => `${p}: …`).join(" ")}`
      : name;

    // Build the snippet body — only the part after "Action "
    // because by the time we're in action_name context the prefix
    // "Action " is already on the line.
    let insertText;
    let insertTextRules;
    if (params.length) {
      const paramSnippets = params
        .map((p, i) => `${p}: \${${i + 1}:${p}}`)
        .join(" ");
      insertText = `${name} ${paramSnippets}`;
      insertTextRules = INSERT_AS_SNIPPET;
    } else {
      insertText = name;
      insertTextRules = undefined;
    }

    return {
      label: name,
      kind: CIK.Function,
      detail: signature,
      documentation: {
        value: params.length
          ? `**Action:** \`${name}\`\n\n**Parameters:** ${params.map((p) => `\`${p}\``).join(", ")}\n\n**Usage:**\n\`Action: ${signature}\``
          : `**Action:** \`${name}\`\n\n**Usage:**\n\`Action ${name}\``,
      },
      insertText,
      insertTextRules,
      range,
      sortText: `0_${String(idx).padStart(6, "0")}_${name}`, // preserve registration order
    };
  });
}

// ─── Event completion builders ────────────────────────────────────────────────

/**
 * One item per registered event — inserts the full snippet:
 *   event.name param: ${1:{param}} … persist ${N:divertTarget}
 *
 * "persist" is the final tab stop before the divert target so the user can
 * delete it easily if they don't want it.
 *
 * @param {EventDef[]} events
 * @param {object}     range
 * @returns {object[]}
 */
function eventNameItems(events, range) {
  return events.map((event, idx) => {
    const { name, params = [] } = event;

    const signature = params.length
      ? `${name} ${params.map((p) => `${p}: {…}`).join(" ")} [persist] divertTarget`
      : `${name} [persist] divertTarget`;

    // Build snippet. Each param value is a brace-expression tab stop.
    // Tab stop indices: params occupy 1..N, then persist word is N+1, then divert target N+2.
    const snippetParts = [];
    params.forEach((p, i) => {
      snippetParts.push(`${p}: {$\{${i + 1}:${p}}}`);
    });
    const persistIdx = params.length + 1;
    const divertIdx = params.length + 2;
    snippetParts.push(`\${${persistIdx}:persist}`);
    snippetParts.push(`\${${divertIdx}:divertTarget}`);

    const insertText = `${name} ${snippetParts.join(" ")}`;

    console.log(signature);
    return {
      label: name,
      kind: CIK.Event,
      detail: signature,
      documentation: {
        value: [
          `**Event listener:** \`${name}\``,
          params.length
            ? `**Match parameters:** ${params.map((p) => `\`${p}\``).join(", ")}`
            : "",
          "**Optional:** `persist` — keep this listener active across knots/stitches.",
          "**Required:** divert target knot or stitch name.",
          `\n**Usage:**\n\`Event: ${signature}\``,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
      insertText,
      insertTextRules: INSERT_AS_SNIPPET,
      range,
      sortText: `0_${String(idx).padStart(6, "0")}_${name}`,
    };
  });
}

/**
 * Items shown after "Event name …params…" — "persist" keyword plus all
 * knot/stitch divert targets (the user may skip persist and go straight to target).
 *
 * @param {InkSymbol[]} symbols
 * @param {object}      range
 * @returns {object[]}
 */
function eventPersistItems(symbols, range) {
  const items = [
    {
      label: "persist",
      kind: CIK.Keyword,
      detail: "Keep listener active across knots/stitches",
      documentation: {
        value:
          "The `persist` keyword makes this event listener survive knot and stitch transitions. Without it the listener is removed when the story moves on.",
      },
      insertText: "persist ",
      range,
      sortText: "0_persist",
    },
  ];

  // Also offer divert targets directly (user may omit persist)
  for (const sym of symbols) {
    if (sym.kind !== "knot" && sym.kind !== "stitch" && sym.kind !== "label")
      continue;
    items.push({
      label: sym.fullName,
      kind: CIK.Reference,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: sym.fullName,
      range,
      sortText: `1_${sym.fullName}`,
    });
  }

  return items;
}

/**
 * Items shown after "Event name …params… persist " — only divert targets.
 *
 * @param {InkSymbol[]} symbols
 * @param {object}      range
 * @returns {object[]}
 */
function eventDivertItems(symbols, range) {
  return symbols
    .filter(
      (s) => s.kind === "knot" || s.kind === "stitch" || s.kind === "label",
    )
    .map((sym) => ({
      label: sym.fullName,
      kind: CIK.Reference,
      detail: sym.detail,
      documentation: { value: sym.documentation },
      insertText: sym.fullName,
      range,
      sortText: `0_${sym.fullName}`,
    }));
}

function makeRange(model, position) {
  const word = model.getWordUntilPosition(position);
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

function divertItem(sym, range) {
  const isFn = sym.kind === "function";
  const hasParams = sym.params.length > 0;
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
    sortText: `0_${sym.fullName}`,
  };
}

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

function logicItems(symbols, range) {
  const items = [];

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
    const argPart = sig.slice(name.length + 1, -1);
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

function lineStartItems(range) {
  const snippets = [
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
 * Create and return a Monaco completion provider for the ink language.
 *
 * @param {object}      monaco   - The global monaco object
 * @param {ActionDef[]} actions  - Optional list of action definitions
 * @param {EventDef[]}  events   - Optional list of event definitions
 * @returns {object}             - CompletionItemProvider
 */
export function createInkCompletionProvider(monaco, actions = [], events = []) {
  return {
    triggerCharacters: ["-", ">", "<", ".", "{", "~", "=", " "],

    provideCompletionItems(model, position) {
      const lineText = model.getLineContent(position.lineNumber);
      const ctx = detectContext(lineText, position.column);

      if (ctx.type === "none") return { suggestions: [] };

      const { symbols } = extractSymbols(model.getLinesContent());
      const range = makeRange(model, position);

      // ── Action / Event keyword (user typed "Act…" or "Eve…") ─────────────
      if (ctx.type === "action_keyword") {
        return {
          suggestions: hashKeywordItems(
            ctx.matched,
            position.lineNumber,
            position.column,
          ),
        };
      }

      // ── Action <name> (user is choosing / has typed the action name) ──────
      if (ctx.type === "action_name") {
        return { suggestions: actionNameItems(actions, range) };
      }

      // ── Event <name> ──────────────────────────────────────────────────────
      if (ctx.type === "event_name") {
        return { suggestions: eventNameItems(events, range) };
      }

      // ── Event name …params… → offer "persist" + divert targets ───────────
      if (ctx.type === "event_persist") {
        return { suggestions: eventPersistItems(symbols, range) };
      }

      // ── Event name …params… persist → divert targets only ─────────────────
      if (ctx.type === "event_divert") {
        return { suggestions: eventDivertItems(symbols, range) };
      }

      // ── Original contexts ─────────────────────────────────────────────────
      if (ctx.type === "divert") {
        const knotsAndFunctions = symbols.filter(
          (s) =>
            s.kind === "knot" || s.kind === "function" || s.kind === "label",
        );
        const suggestions = [
          ...knotsAndFunctions.map((s) => divertItem(s, range)),
          ...symbols
            .filter((s) => s.kind === "stitch")
            .map((s) => ({
              ...divertItem(s, range),
              label: s.name,
              insertText: s.name,
              detail: `${s.detail} (local)`,
              sortText: `1_${s.name}`,
            })),
          ...divertKeywordItems(range),
          ...divertSnippetItems(range),
        ];
        return { suggestions };
      }

      if (ctx.type === "divert_stitch") {
        const stitches = symbols.filter(
          (s) => s.kind === "stitch" && s.parentKnot === ctx.knotName,
        );
        return {
          suggestions: stitches.map((s) => ({
            label: s.name,
            kind: CIK.Reference,
            detail: s.detail,
            documentation: { value: s.documentation },
            insertText: s.name,
            range,
            sortText: `0_${s.name}`,
          })),
        };
      }

      if (ctx.type === "thread") {
        return {
          suggestions: symbols
            .filter((s) => s.kind === "knot" || s.kind === "stitch")
            .map((s) => ({
              label: s.fullName,
              kind: CIK.Reference,
              detail: s.detail,
              documentation: { value: s.documentation },
              insertText: s.fullName,
              range,
              sortText: `0_${s.fullName}`,
            })),
        };
      }

      if (ctx.type === "logic")
        return { suggestions: logicItems(symbols, range) };
      if (ctx.type === "declaration_rhs")
        return { suggestions: declarationRhsItems(symbols, range) };
      if (ctx.type === "identifier")
        return {
          suggestions: [
            ...logicItems(symbols, range),
            ...lineStartItems(range),
          ],
        };

      return { suggestions: [] };
    },

    resolveCompletionItem(item) {
      return item;
    },
  };
}

// ─── Registration helper ──────────────────────────────────────────────────────

/**
 * Register the ink completion provider with Monaco.
 *
 * @param {object}      monaco   - The global monaco object
 * @param {ActionDef[]} actions  - Optional action definitions, e.g.:
 *                                 [{ name: 'camera.shake', params: ['intensity', 'duration'] }]
 * @param {EventDef[]}  events   - Optional event definitions, e.g.:
 *                                 [{ name: 'targeting.setTarget', params: ['shipId', 'targetId'] }]
 * @returns {object} IDisposable
 */
export function registerInkCompletions(monaco, actions = [], events = []) {
  return monaco.languages.registerCompletionItemProvider(
    "ink",
    createInkCompletionProvider(monaco, actions, events),
  );
}
