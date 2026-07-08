import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { Icon } from "@thorium/ui/Icon";
import SearchableInput, { DefaultResultLabel } from "@thorium/ui/SearchableInput";

import { useShipMapStore } from "./useShipMapStore";

export function CargoSearchInput() {
	const { shipId } = useStation();

	return (
		<SearchableInput<{
			id: number;
			name: string;
			count?: number;
			type: "deck" | "room" | "inventory";
			room?: string;
			deck: string;
			deckIndex: number;
			roomId?: number;
		}>
			className="cargo-search"
			queryKey="cargo"
			placeholder="Search for rooms, cargo, and systems"
			getOptions={async ({ queryKey, signal }) => {
				const result = await q.cargoControl.search.netRequest(
					{ query: queryKey[1], shipId },
					{ signal },
				);
				return result;
			}}
			ResultLabel={({ active, result, selected }) => (
				<DefaultResultLabel active={active} selected={selected}>
					<div className="flex gap-2">
						<Icon
							className="size-6"
							name={
								result.type === "deck"
									? "cuboid"
									: result.type === "room"
										? "warehouse"
										: "package-open"
							}
						/>
						<div>
							<p>
								{result.name}
								{result.count ? ` (${result.count})` : ""}
							</p>
							{result.type !== "deck" && (
								<p>
									<small>{[result.room, result.deck].filter(Boolean).join(", ")}</small>
								</p>
							)}
						</div>
					</div>
				</DefaultResultLabel>
			)}
			setSelected={(value) => {
				if (!value) return;
				const { deckIndex, roomId } = value;
				useShipMapStore.setState({ deckIndex });
				useShipMapStore.setState({ selectedRoomId: roomId || null });
			}}
			displayValue={(item) => item?.name || ""}
		/>
	);
}
