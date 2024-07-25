import { generateIncrementedName } from "@server/utils/generateIncrementedName";
import type BasePlugin from ".";
import { Aspect } from "./Aspect";
import type { TimelineAction } from "./Timeline";

export class MacroPlugin extends Aspect {
	apiVersion = "ships/v1" as const;
	kind = "macros" as const;
	name: string;
	description: string;

	inputs: { id: string; name: string; type: string }[];
	actions: TimelineAction[];

	assets = {};
	constructor(params: Partial<MacroPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Timeline",
			plugin.aspects.timelines.map((timeline) => timeline.name),
		);
		super({ name, ...params }, { kind: "macros" }, plugin);
		this.name = name;
		this.description =
			params.description || "Performs several actions at once.";

		this.inputs = params.inputs || [];
		this.actions = params.actions || [];
	}
}
