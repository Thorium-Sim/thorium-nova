import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import { q } from "@client/context/AppContext";

export function ShipTemplate({
	value,
	setValue,
}: {
	value: { pluginId: string; name: string } | undefined;
	setValue: (value: { pluginId: string; name: string } | null) => void;
}) {
	const selectedSpawn = value
		? {
				id: value.name,
				pluginName: value.pluginId,
				name: value.name,
				category: "",
				vanity: "",
		  }
		: null;
	return (
		<SearchableInput<{
			id: string;
			pluginName: string;
			name: string;
			category: string;
			vanity: string;
		}>
			inputClassName="input-sm"
			queryKey="spawn"
			getOptions={async ({ queryKey, signal }) => {
				const result = await q.starmapCore.spawnSearch.netRequest(
					{ query: queryKey[1], allPlugins: true },
					{ signal },
				);
				return result;
			}}
			ResultLabel={({ active, result, selected }) => (
				<DefaultResultLabel active={active} selected={selected}>
					<div className="flex gap-4">
						<img src={result.vanity} alt="" className="w-8 h-8" />
						<div>
							<p className="m-0 leading-none">{result.name}</p>
							<p className="m-0 leading-none">
								<small>{result.category}</small>
							</p>
						</div>
					</div>
				</DefaultResultLabel>
			)}
			setSelected={(item) =>
				setValue(item ? { pluginId: item?.pluginName, name: item?.name } : null)
			}
			selected={selectedSpawn}
			placeholder="Ship Spawn Search..."
		/>
	);
}
