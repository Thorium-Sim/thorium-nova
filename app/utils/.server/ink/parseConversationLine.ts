import type { AllSends } from "@thorium/.server/init/router";

export function parseConversationLine(
	line: string,
	tags: string[],
):
	| {
			type: "event";
			event: string;
			divert: string;
			persist: boolean;
			params: Record<string, any>;
	  }
	| { type: "action"; action: AllSends; params: Record<string, any> }
	| { type: "dialogue"; speakerName: string; dialogue: string } {
	const colonSplit = line.split(":");
	const command = colonSplit[0].toLowerCase().trim();

	switch (command) {
		case "action": {
			const lineWithTags = [line.trim(), ...tags].join("#");
			const spaceSplit = lineWithTags
				.replace(/action:/i, "")
				.split(" ")
				.map((m) => m.trim())
				.filter(Boolean);
			const actionName = spaceSplit[0] as AllSends;
			const paramsLine = lineWithTags
				.slice(lineWithTags.indexOf(actionName) + actionName.length)
				.trim();

			const params = parseParams(paramsLine);

			return { type: "action", action: actionName, params };
		}
		case "event": {
			const lineWithTags = [line.trim(), ...tags].join("#");
			const spaceSplit = lineWithTags
				.replace(/event:/i, "")
				.split(" ")
				.map((m) => m.trim());
			const eventName = spaceSplit[1];
			const divert = spaceSplit.at(-1) || "";
			let persist = false;
			let paramsLine = lineWithTags
				.slice(lineWithTags.indexOf(eventName) + eventName.length, lineWithTags.lastIndexOf(divert))
				.trim();
			if (paramsLine.endsWith("persist")) {
				persist = true;
				paramsLine = paramsLine.slice(0, paramsLine.lastIndexOf("persist"));
			}
			const params = parseParams(paramsLine);

			return {
				type: "event",
				event: eventName,
				divert,
				persist,
				params,
			};
		}
		// For ship conversation tags
		default: {
			return {
				type: "dialogue",
				speakerName: colonSplit[0].trim(),
				dialogue: colonSplit.slice(1).join(":").trim(),
			};
		}
	}
}

function parseParams(paramsLine: string) {
	const params: Record<string, string> = {};
	const paramsSplit = paramsLine.split(":");
	let key = paramsSplit.shift();
	if (!key) return params;
	while (paramsSplit.length) {
		const line = paramsSplit.shift();
		if (!line) continue;
		params[key] =
			paramsSplit.length === 0 ? line.trim() : line.slice(0, line.lastIndexOf(" ")).trim();
		key = line.slice(line.lastIndexOf(" ") + 1);
	}

	return params;
}
