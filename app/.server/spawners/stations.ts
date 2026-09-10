import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import type StationComplementPlugin from "@thorium/.server/classes/Plugins/StationComplement";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { isPanelElement } from "@thorium/ecs-components/engineeringPanel";
import {
	panelElementList,
	type PanelElementTypes,
} from "@thorium/ecs-components/engineeringPanelElementConfig";
import { Entity } from "@thorium/utils/ecs";
import { getPluginTextPatterns, interpolateText } from "@thorium/utils/interpolationEngine";
import { createRNG, type RNG } from "@thorium/utils/rng";
import z from "zod";

export function spawnStations(
	ctx: { flight: FlightDataModel | null; server: ServerDataModel },
	shipEntity: Entity,
	ship: { crewCount: number; stationComplement?: { pluginId: string; stationId?: string } },
	mode: "nova" | "legacy",
) {
	const activePlugins = ctx.server.plugins.filter((p) => p.active);

	const extraEntities: Entity[] = [];
	// First see if there is a station complement
	// that matches the specific one that was passed in
	const stationComplement = getStationComplement(mode, activePlugins, ship);
	shipEntity.addComponent("stationComplement", {
		name: stationComplement?.name || "Station Complement",
		stations: stationComplement?.stations || [],
		crewCount: stationComplement?.stations.length || ship.crewCount,
	});

	// Generate Engineering panels for any cards that need them
	for (const station of shipEntity.components.stationComplement?.stations || []) {
		for (const card of station.cards) {
			if (card.component === "EngineeringPanels") {
				const panel = new Entity();

				panel.addComponent("isPanel", { shipId: shipEntity.id });
				if (card.config?.tags) {
					panel.addComponent("tags", { tags: card.config.tags });
				}
				extraEntities.push(panel);

				card.config = { ...card.config, panelId: panel.id };
				if ("config" in card && card.config && "elements" in card.config) {
					for (const { name, ...element } of card.config.elements.slice(0, 24)) {
						const elementEntity = new Entity();
						elementEntity.addComponent("identity", { name });
						elementEntity.addComponent("isPanelElement", {
							panelId: panel.id,
							shipId: shipEntity.id,
							element,
						});
						extraEntities.push(elementEntity);
					}
				} else {
					let config = Object.assign(
						{
							elementCount: 12,
							elementNameTemplate: `{~A,B,C,D,E}{~A,B,C,D,E}-RANDOM(10,99)`,
							randomSeed: ctx.flight?.ecs.rng.nextString(),
						},

						card.config,
					);
					const rng = createRNG(config.randomSeed);
					const filteredTypes: PanelElementTypes[] = [];
					const includedTypes: PanelElementTypes[] = [];
					const elementCount = Math.min(config.elementCount, 24);

					function addElement(
						type: PanelElementTypes = rng.nextFromList(
							panelElementList.filter((v) => !filteredTypes.includes(v)),
						),
					) {
						const elementEntity = new Entity();
						elementEntity.addComponent("identity", {
							name: interpolateText(
								config.elementNameTemplate,
								{},
								getPluginTextPatterns(ctx.server),
								rng,
							),
						});
						elementEntity.addComponent("isPanelElement", {
							panelId: panel.id,
							shipId: shipEntity.id,
							element: getPanelElement(type, rng),
						});
						ctx.flight!.ecs.addEntity(elementEntity);
						includedTypes.push(type);
						return type;
					}
					for (let i = 0; i < elementCount; i++) {
						const type = addElement();
						if (
							i < elementCount - 1 &&
							type === "cableSocket" &&
							includedTypes.filter((i) => i === "cableSocket").length < 4
						) {
							// Add another cable socket, just to add more variety
							addElement("cableSocket");
						}

						// Remove element types as necessary
						// Only one keypad
						if (type === "numberPad") filteredTypes.push(type);
						// No more than 20% of the panel should be one type
						if (includedTypes.filter((v) => v === type).length >= elementCount / 5)
							filteredTypes.push(type);
					}
				}
			}
		}
	}

	return extraEntities;
}

function getPanelElement(
	type: z.infer<typeof isPanelElement>["element"]["type"],
	rng: RNG,
): z.infer<typeof isPanelElement>["element"] {
	switch (type) {
		case "triSwitch":
		case "numberPad":
			return { type };
		case "pressButton":
		case "switch":
			return {
				type,
				color: rng.nextFromList([
					"red",
					"orange",
					"yellow",
					"#00ff00",
					"cyan",
					"blue",
					"rebeccapurple",
				]),
			};
		case "cableSocket":
			// Even integer
			return { type, ports: rng.nextInt(2, 5) * 2 };
		// case "numberedRotor":
		// 	return { type, max: 6 };
		case "numberedSlider":
			return { type, max: rng.nextInt(4, 8) };
		default:
			const typeName = type;
			typeName satisfies never;
			throw new Error("Invalid panel element type");
	}
}

function getStationComplement(
	mode: "nova" | "legacy",
	activePlugins: BasePlugin[],
	ship: { crewCount: number; stationComplement?: { pluginId: string; stationId?: string } },
) {
	let stationComplement = activePlugins.reduce((acc: StationComplementPlugin | null, plugin) => {
		if (acc) return acc;
		if (ship.stationComplement && plugin.id !== ship.stationComplement.pluginId) return acc;
		if (ship.stationComplement) {
			return (
				plugin.aspects.stationComplements.find(
					(pluginStationComplement) =>
						pluginStationComplement.name === ship.stationComplement?.stationId,
				) || null
			);
		}
		return null;
	}, null);
	// No station complement? Find the one that best fits from the default plugin
	if (!stationComplement) {
		stationComplement = activePlugins.reduce((acc: StationComplementPlugin | null, plugin) => {
			if (acc) return acc;
			if (!plugin.default) return acc;
			// TODO November 18, 2021 - Check to see if the ship is a big ship or a little ship
			// and assign the appropriate station complement based on that.
			return (
				plugin.aspects.stationComplements.find(
					(pluginStationComplement) =>
						pluginStationComplement.flightMode === mode &&
						pluginStationComplement.stationCount === ship.crewCount,
				) || null
			);
		}, null);
	}
	return stationComplement;
}
