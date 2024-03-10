import type { AllShipSystems } from "@server/classes/Plugins/ShipSystems/shipSystemTypes";
import type { DataContext } from "@server/utils/types";
import { z } from "zod";

export function getPlugin(context: DataContext, pluginId: string) {
	const plugin = context.server.plugins.find(
		(plugin) => plugin.id === pluginId,
	);
	if (!plugin) throw null;
	return plugin;
}

export function pluginFilter(
	publish: { pluginId: string },
	{ input }: { input: { pluginId: string } },
) {
	if (publish && input.pluginId !== publish.pluginId) return false;
	return true;
}
export const systemInput = z.object({
	pluginId: z.string(),
	shipPluginId: z.string().optional(),
	shipId: z.string().optional(),
	systemId: z.string(),
});

export function getShipSystem({
	input,
	ctx,
}: {
	ctx: DataContext;
	input: {
		pluginId: string;
		shipPluginId?: string;
		shipId?: string;
		systemId: string;
	};
}) {
	let override = {};
	let systemId = input.systemId;
	if (input.shipPluginId) {
		const plugin = getPlugin(ctx, input.shipPluginId);
		const ship = plugin.aspects.ships.find((s) => s.name === input.shipId);
		if (ship) {
			const system = ship.shipSystems.find(
				(s) =>
					s.id === input.systemId ||
					(s.systemId === input.systemId && s.pluginId === input.shipPluginId),
			);
			if (system) {
				systemId = system.systemId;
				if (!system.overrides) {
					system.overrides = {};
				}
				override = system.overrides;
			}
		}
	}
	const plugin = getPlugin(ctx, input.pluginId);
	const shipSystem = plugin.aspects.shipSystems.find(
		(system) => system.name === systemId,
	);
	if (!shipSystem) throw new Error(`System not found: ${systemId}`);
	const { plugin: sysPlugin, ...system } = shipSystem;

	return {
		...system,
		...override,
		pluginName: plugin.name,
	};
}

/**
 * Gets a ship system plugin to use in an input
 */
export function getShipSystemForInput<T extends keyof AllShipSystems>(
	context: DataContext,
	{
		pluginId,
		systemId,
		shipPluginId,
		shipId,
	}: {
		pluginId: string;
		systemId: string;
		shipPluginId?: string;
		shipId?: string;
	},
) {
	const plugin = getPlugin(context, pluginId);
	let override = null;
	if (shipPluginId) {
		const plugin = getPlugin(context, shipPluginId);
		const ship = plugin.aspects.ships.find((s) => s.name === shipId);
		if (!ship) {
			throw new Error("Ship not found");
		}
		const system = ship.shipSystems.find(
			(s) =>
				s.id === systemId ||
				(s.systemId === systemId && s.pluginId === shipPluginId),
		);
		if (!system) {
			throw new Error("Ship system is not assigned to ship");
		}
		systemId = system.systemId;
		if (!system.overrides) {
			system.overrides = {};
		}
		override = system.overrides;
	}
	const shipSystem = plugin.aspects.shipSystems.find(
		(s) => s.name === systemId,
	) as AllShipSystems[T];
	if (!shipSystem) {
		throw new Error("Ship system not found");
	}
	return [shipSystem, override] as const;
}

export function getSolarSystem(
	context: DataContext,
	pluginId: string,
	solarSystemId: string,
) {
	const plugin = getPlugin(context, pluginId);
	const solarSystem = plugin.aspects.solarSystems.find(
		(solarSystem) => solarSystem.name === solarSystemId,
	);
	if (!solarSystem) {
		throw new Error(`No solar system found with id ${solarSystemId}`);
	}
	return solarSystem;
}
