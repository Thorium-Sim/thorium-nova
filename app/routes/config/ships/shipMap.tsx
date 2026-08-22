import { isSortable } from "@dnd-kit/react/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { SortableList } from "@thorium/components/ui/SortableItem";
import { q } from "@thorium/context/AppContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import SearchableList from "@thorium/ui/SearchableList";
import { cn } from "@thorium/utils/cn";
import { Activity, Suspense } from "react";
import { useNavigate, Outlet, Link, href, useParams } from "react-router";

import type { Route } from "./+types/shipMap";

export default function ShipMap({
	params: { pluginId, shipId, deckName },
	matches,
}: Route.ComponentProps) {
	const currentView = matches.some((match) => match?.pathname.includes("shipMap/rooms"))
		? "rooms"
		: "decks";

	return (
		<>
			<div className="flex w-72 flex-col">
				<div className="flex">
					<Link
						to={href("/config/:pluginId/ships/:shipId/shipMap", { pluginId, shipId })}
						className={cn("btn btn-sm flex-auto rounded-r-none", {
							"btn-active": currentView === "decks",
						})}
					>
						Decks
					</Link>
					<Link
						to={href("/config/:pluginId/ships/:shipId/shipMap/rooms", { pluginId, shipId })}
						className={cn("btn btn-sm flex-auto rounded-l-none", {
							"btn-active": currentView === "rooms",
						})}
					>
						Rooms
					</Link>
				</div>
				<Activity mode={currentView === "decks" ? "visible" : "hidden"}>
					<Suspense>
						<DecksList pluginId={pluginId} shipId={shipId} deckName={deckName} />
					</Suspense>
				</Activity>
				<Activity mode={currentView === "rooms" ? "visible" : "hidden"}>
					<Suspense>
						<RoomsList pluginId={pluginId} shipId={shipId} />
					</Suspense>
				</Activity>
			</div>
			<Outlet />
		</>
	);
}

function DecksList({
	pluginId,
	shipId,
	deckName,
}: {
	pluginId: string;
	shipId: string;
	deckName?: string;
}) {
	const navigate = useNavigate();

	const confirm = useConfirm();
	const prompt = usePrompt();
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	const queryClient = useQueryClient();

	return (
		<>
			<SortableList
				items={data.decks.map((d) => ({ id: d.name, children: d.name }))}
				onDragEnd={async (event) => {
					if (event.canceled || !event.operation.source || !isSortable(event.operation.source))
						return;

					const result = await q.plugin.ship.deck.update.netSend({
						pluginId,
						shipId,
						deckId: event.operation.source.id as string,
						newIndex: event.operation.source.index,
					});
					if (result) {
						navigate(result.name);
					}
				}}
				selectedItem={deckName}
				className="mb-2"
			/>
			<Button
				className="btn-success btn-sm w-full"
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
			<div className="mt-2 grid grid-cols-2 gap-2">
				<Button
					className="btn-sm"
					disabled={!(deckName && deckName.length > 0)}
					title={deckName && deckName.length > 0 ? "" : "Select a deck to be able to rename it"}
					onClick={async (event) => {
						event.preventDefault();
						event.stopPropagation();
						const deckname = await prompt({
							header: "Change the current deck's name",
							body: "Give this deck a distinct name",
							defaultValue: deckName,
							inputProps: { className: "input-error" },
						});
						if (deckName && typeof deckname === "string") {
							const result = await q.plugin.ship.deck.update.netSend({
								pluginId,
								shipId,
								deckId: deckName,
								newName: deckname,
							});
							if (result) {
								await queryClient.resetQueries({
									queryKey: q.plugin.ship.get.getQueryKey({
										pluginId,
										shipId,
									}),
								});
								navigate(`${result.name}`);
							}
						}
					}}
				>
					Rename
				</Button>
				<Button
					className="btn-error btn-sm"
					disabled={!deckName}
					onClick={async (event) => {
						if (!deckName) return;
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
					Delete
				</Button>
			</div>
		</>
	);
}
function RoomsList({ pluginId, shipId }: { pluginId: string; shipId: string }) {
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	const navigate = useNavigate();
	const items = data.decks.flatMap((d) =>
		d.nodes.flatMap((node) =>
			node.isRoom
				? {
						id: `${d.name}%%%${node.id}`,
						label: node.name,
						category: d.name,
						deckId: d.name,
						nodeId: node.id,
					}
				: [],
		),
	);
	const params = useParams();

	return (
		<SearchableList
			items={items}
			categorySort={([a], [b]) =>
				data.decks.findIndex((d) => d.name === a) - data.decks.findIndex((d) => d.name === b)
			}
			selectedItem={`${params.deckName}%%%${params.roomId}`}
			setSelectedItem={(item) =>
				navigate(
					href("/config/:pluginId/ships/:shipId/shipMap/rooms/:deckName/:roomId", {
						pluginId,
						shipId,
						deckName: item.id.split("%%%")[0],
						roomId: item.id.split("%%%")[1],
					}),
				)
			}
		/>
	);
}
