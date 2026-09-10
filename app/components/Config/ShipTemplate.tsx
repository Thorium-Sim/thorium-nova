import { q } from "@thorium/context/AppContext";
import Select from "@thorium/ui/Select";

export function ShipTemplate({
	value,
	setValue,
}: {
	value: { pluginId: string; name: string } | undefined;
	setValue: (value: { pluginId: string; name: string } | null) => void;
}) {
	const [templates] = q.starmapCore.spawnSearch.useNetRequest({ allPlugins: true });

	return (
		<Select
			placeholder="Ship spawn search..."
			label="Ship Template"
			labelHidden
			size="xxs"
			items={templates.map((i) => ({ id: i.id, label: i.name }))}
			selected={value ? `${value.name}-${value.pluginId}` : null}
			setSelected={(value) => {
				if (value) {
					const [name, pluginId] = value.split("-");
					setValue({ name, pluginId });
				} else {
					setValue(null);
				}
			}}
		/>
	);
}
