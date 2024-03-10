import Button from "@thorium/ui/Button";
import { useNavigate, useParams, Outlet } from "@remix-run/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { q } from "@client/context/AppContext";
import { SortableList } from "@client/components/ui/SortableItem";

export default function ShipMap() {
	const { pluginId, shipId, deckName } = useParams() as {
		pluginId: string;
		shipId: string;
		deckName: string;
	};
	const navigate = useNavigate();
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });

	async function handleDragEnd({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
	}) {
		const result = await q.plugin.ship.deck.update.netSend({
			pluginId,
			shipId,
			deckId: active.id as string,
			newIndex: Number(overIndex),
		});
		if (result) {
			navigate(result.name);
		}
	}

	return (
		<>
			<div className="w-72 flex flex-col">
				<SortableList
					items={data.decks.map((d) => ({ id: d.name, children: d.name }))}
					onDragEnd={handleDragEnd}
					selectedItem={deckName}
					className="mb-2"
				/>
				<Button
					className="btn-success w-full"
					onClick={async () => {
						const deck = await q.plugin.ship.deck.create.netSend({
							pluginId,
							shipId,
						});
						if (deck === null) return;
						navigate(deck.name.toString());
					}}
				>
					Add Deck
				</Button>
			</div>
			<Outlet />
		</>
	);
}
