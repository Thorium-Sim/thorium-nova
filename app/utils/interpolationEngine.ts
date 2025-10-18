import { createRNG } from "@thorium/utils/rng";
import { capitalCase } from "change-case";

export function interpolateText(
	template: string,
	vars: Record<string, any> = {},
	rng = createRNG(Math.random()),
) {
	const ctx = { ...vars };

	// Random from list
	template = template.replace(/\{\s*~([^}]+)\s*\}/g, (_, options: string) => {
		return rng.nextFromList(options.split(",").map((o) => o.trim()));
	});
	// 1) evaluate all switches like {key|A:out;k=v|B:out2;...|default:...}
	template = template.replace(
		/\[(\w+)\|([^\]]+)\]/g,
		(string, key, body: string) => {
			const value = ctx[key] ?? "";

			const parts = body.split("|").map((p) => p.trim());

			if (body.indexOf(":") === -1) {
				// This is a simple ternary switch.
				return value ? ctx[parts[0]] || parts[0] : ctx[parts[1]] || parts[1];
			}

			for (const part of parts) {
				const colonIdx = part.indexOf(":");
				if (colonIdx === -1) continue;
				const branchKey = part.slice(0, colonIdx).trim();
				const branchBody = part.slice(colonIdx + 1).trim();

				const isMatch = branchKey.toLowerCase() === value.toLowerCase();
				const isDefault = branchKey.toLowerCase() === "default";

				if (
					isMatch ||
					(isDefault &&
						!parts.some(
							(p) =>
								p.slice(0, p.indexOf(":")).trim().toLowerCase() ===
								value.toLowerCase(),
						))
				) {
					const segments = branchBody
						.split(";")
						.map((s) => s.trim())
						.filter(Boolean);
					const out = segments.shift() || "";

					// parse assignments like k=v
					for (const assign of segments) {
						const eq = assign.indexOf("=");
						if (eq === -1) continue;
						const k = assign.slice(0, eq).trim();
						const v = assign.slice(eq + 1).trim();
						ctx[k] = v;
					}
					return out;
				}
			}
			return ""; // no match (and no default)
		},
	);

	// 2) replace simple variables {name}
	template = template.replace(/\{\s*(\w+)\s*\}/g, (_, name) => {
		return ctx[name] !== undefined ? ctx[name] : "";
	});

	// Assorted functions
	template = template.replace(
		/(RANDOM|CAPITALIZE|LOWERCASE|UPPERCASE|PLURALIZE)\((.+?)\)/g,
		(
			_,
			functionName:
				| "RANDOM"
				| "CAPITALIZE"
				| "LOWERCASE"
				| "UPPERCASE"
				| "PLURALIZE",
			input: string,
		) => {
			switch (functionName) {
				case "RANDOM": {
					const options = input.replace("RANDOM(", "").replace(")", "");
					const nums = options.split(",").map((v) => Number(v));
					const max = nums[1] || nums[0];
					const min = max === nums[0] ? 0 : nums[0];
					return Math.round((rng.next() + 0.5) * (max - min) + min).toString();
				}
				case "CAPITALIZE":
					return capitalCase(input);
				case "UPPERCASE":
					return input.toUpperCase();
				case "LOWERCASE":
					return input.toLowerCase();
				case "PLURALIZE": {
					const params = input.split(",");
					return pluralize(Number(params[0]), params[1], params[2]);
				}
				default:
					functionName satisfies never;
					return "";
			}
		},
	);

	return template;
}

const pluralRules = new Intl.PluralRules("en-US");

function pluralize(count: number, singular: string, plural: string) {
	const grammaticalNumber = pluralRules.select(count);
	switch (grammaticalNumber) {
		case "one":
			return `${count} ${singular}`;
		case "other":
			return `${count} ${plural}`;
		default:
			throw new Error(`Unknown: ${grammaticalNumber}`);
	}
}
