import Button from "@thorium/ui/Button";
import { useNavigate, useParams, Outlet } from "@remix-run/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { q } from "@client/context/AppContext";
import { SortableList } from "@client/components/ui/SortableItem";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";

export default function ShipMap() {
	const { pluginId, shipId, deckName } = useParams() as {
		pluginId: string;
		shipId: string;
		deckName: string;
	};
	const navigate = useNavigate();
	const confirm = useConfirm();
	const prompt = usePrompt();
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
				<div className="grid gap-2 grid-cols-2 mt-2">
					<Button
						className=""
						disabled={deckName && deckName.length > 0 ? false : true}
						title={
							deckName && deckName.length > 0
								? ""
								: "Select a deck to be able to rename it"
						}
						onClick={async (event) => {
							event.preventDefault();
							event.stopPropagation();
							const deckname = await prompt({
								header: "Change the current deck's name",
								body: "Give this deck a distinct name",
								defaultValue: deckName,
								inputProps: { className: "input-error" },
							});
							if (typeof deckname === "string") {
								const result = await q.plugin.ship.deck.update.netSend({
									pluginId,
									shipId,
									deckId: deckName,
									newName: deckname,
								});
								if (result) {
									navigate(`${result.name}`);
								}
							}
						}}
					>
						Rename Deck
					</Button>
					<Button
						className="btn-error"
						disabled={deckName ? false : true}
						onClick={async (event) => {
							event.preventDefault();
							event.stopPropagation();
							if (
								await confirm({
									header: `Are you sure you want to delete deck '${deckName}'?`,
								})
							) {
								await q.plugin.ship.deck.delete.netSend({
									pluginId,
									shipId,
									deckId: deckName,
								});
								navigate(`.`);
							}
						}}
					>
						Delete Deck
					</Button>
				</div>
			</div>
			<Outlet />
		</>
	);
}
