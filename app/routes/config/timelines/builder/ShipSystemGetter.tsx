import { q } from "@thorium/context/AppContext";
import {
	MadLibSelect,
	MadLibsCombobox,
	EntityInput,
	ValueInput,
	type BlockProps,
} from "@thorium/routes/config/timelines/builder/BlockInputs";

export function ShipSystemGetter({
	count,
	entity,
	systemType,
	update,
	variable,
}: BlockProps<"ShipSystemGetter">) {
	const [availableShipSystems] = q.plugin.systems.available.useNetRequest();

	return (
		<div className="flex gap-1">
			Save{" "}
			<MadLibSelect
				value={count}
				onChange={(value) => update("count", value as any)}
				options={["all", "one"]}
			/>
			<MadLibsCombobox
				placeholder="System Type"
				value={systemType}
				onChange={(value) => update("systemType", value)}
				items={availableShipSystems.map((sys) => ({ id: sys.type }))}
			/>{" "}
			systems from ship{" "}
			<EntityInput value={entity} onChange={(e) => update("entity", e)} /> as
			local variable{" "}
			<ValueInput value={variable} onChange={(v) => update("variable", v)} />
		</div>
	);
}
