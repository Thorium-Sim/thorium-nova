import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import type BasePlugin from ".";
import { InkAspect } from "./Aspect";
import type { DamageTypes } from "@thorium/utils/flags/damageTypes";

export class ReportPlugin extends InkAspect {
	apiVersion = "report/v1" as const;
	kind = "reports" as const;
	name: string;
	damageTypes: DamageTypes[];
	category: string;
	inkText: string;

	assets = {};
	constructor(params: Partial<ReportPlugin>, plugin: BasePlugin) {
		const name = generateIncrementedName(
			params.name || "New Report",
			plugin.aspects.macros.map((macro) => macro.name),
		);
		super({ name, ...params }, { kind: "macros" }, plugin, {});
		this.name = name;
		this.category = params.category || "";
		this.damageTypes = params.damageTypes || [];
		this.inkText = params.inkText || `# name:${name}`;
	}
}
