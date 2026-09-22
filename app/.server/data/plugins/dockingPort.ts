import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { shipCategories } from "@thorium/utils/flags/shipClasses";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import z from "zod";

import { getPlugin } from "./utils";
function getDockingPort(
	context: DataContext,
	{ pluginId, shipId, portId }: { pluginId: string; shipId: string; portId: string },
) {
	const plugin = getPlugin(context, pluginId);
	const ship = plugin.aspects.ships.find((ship) => ship.name === shipId);
	if (!ship) throw new Error("Ship not found");

	const dockingPort = ship.dockingPorts.find((dockingPort) => dockingPort.name === portId);
	if (!dockingPort) throw new Error("Docking port not found");
	return { ship, dockingPort };
}

const coordinates = z.object({ x: z.number(), y: z.number(), z: z.number() });
export const dockingPort = t.router({
	create: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				position: coordinates,
				orientation: coordinates,
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return null;

			const dockingPort = ship.addDockingPort({
				position: input.position,
				orientation: input.orientation,
			});

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return dockingPort;
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				portId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return;

			const dockingPortIndex = ship.dockingPorts.findIndex(
				(dockingPort) => dockingPort.name === input.portId,
			);
			ship.removeDockingPort(dockingPortIndex);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
		}),
	update: t.procedure
		.input(
			z.intersection(
				z.object({
					pluginId: z.string(),
					shipId: z.string(),
					portId: z.string(),
				}),
				z.union([
					z.object({ newName: z.string() }),
					z.object({ newIndex: z.number() }),
					z.object({
						incomingCategories: shipCategories.array(),
					}),
					z.object({
						allowOutgoing: z.boolean(),
					}),
					z.object({
						position: coordinates,
						orientation: coordinates,
					}),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, dockingPort } = getDockingPort(ctx, input);
			if ("newName" in input) {
				dockingPort.name = input.newName;
			}
			if ("newIndex" in input && typeof input.newIndex === "number") {
				const deckIndex = ship.dockingPorts.findIndex((deck) => deck.name === input.portId);
				moveArrayItem(ship.decks, deckIndex, input.newIndex);
			}
			if ("incomingCategories" in input && Array.isArray(input.incomingCategories)) {
				dockingPort.incomingCategories = input.incomingCategories;
			}
			if ("allowOutgoing" in input) {
				dockingPort.allowOutgoing = input.allowOutgoing;
			}
			if ("position" in input) {
				dockingPort.position = input.position;
				dockingPort.orientation = input.orientation;
			}

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return dockingPort;
		}),
});
