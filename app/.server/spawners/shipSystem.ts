import type BaseShipSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/BaseSystem";
import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { components, type ComponentIds } from "@thorium/ecs-components";
import { Entity } from "@thorium/utils/ecs";
import { mergeDeep } from "@thorium/utils/operations/mergeDeep";

export function spawnShipSystem(
	shipId: number,
	systemPlugin: Partial<BaseShipSystemPlugin>,
	isPlayerShip?: boolean,
	overrides: Record<string, any> = {},
) {
	const entity = new Entity();
	const template = mergeDeep(systemPlugin, overrides);

	entity.addComponent("identity", {
		name: template.name,
		description: template.description,
	});
	entity.addComponent("tags", { tags: template.tags });

	if (template.soundEffects) {
		entity.addComponent("soundEffects", {
			soundBank: template.soundEffects,
		});
	}

	if (template.type) {
		entity.addComponent("isShipSystem", { type: template.type, shipId });

		const componentName =
			`is${template.type[0].toUpperCase()}${template.type.slice(
				1,
			)}` as `is${Capitalize<typeof template.type>}`;

		const flags = ShipSystemTypes[template.type].flags;

		if (template.type !== "generic" && componentName in components)
			entity.addComponent(componentName as ComponentIds, template);

		const {
			powerToHeat,
			heatDissipationRate,
			maxHeat,
			maxSafeHeat,
			nominalHeat,
			requiredPower,
			defaultPower,
			maxSafePower,
		} = systemPlugin;
		if (isPlayerShip) {
			if (flags.includes("heat"))
				entity.addComponent("heat", {
					powerToHeat: overrides.powerToHeat || powerToHeat,
					heatDissipationRate:
						overrides.heatDissipationRate || heatDissipationRate,
					maxHeat: overrides.maxHeat || maxHeat,
					maxSafeHeat: overrides.maxSafeHeat || maxSafeHeat,
					nominalHeat: overrides.nominalHeat || nominalHeat,
					heat: overrides.nominalHeat || nominalHeat,
				});
			if (flags.includes("efficiency")) entity.addComponent("efficiency");
		}
		if (flags.includes("power"))
			entity.addComponent("power", {
				requiredPower: overrides.requiredPower || requiredPower,
				defaultPower: overrides.defaultPower || defaultPower,
				maxSafePower: overrides.maxSafePower || maxSafePower,
			});
	}

	return entity;
}
