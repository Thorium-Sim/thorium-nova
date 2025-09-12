import { type Entity, System } from "@thorium/utils/ecs";
import { i } from "node_modules/react-router/dist/development/context-jKip1TFB.mjs";

const transferRate = 0.04;
export class LegacyCoolantTransferSystem extends System {
	static flightMode = ["legacy"];
	test(entity: Entity) {
		return !!entity.components.isCoolantTank;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;

		const coolantTank = entity.components.isCoolantTank;
		const coolant = entity.components.legacyCoolant;
		if (!coolantTank || !coolant) return;

		if (
			coolantTank.transferSystem === null ||
			coolantTank.transferSystem === -1
		)
			return;
		if (coolantTank.transferDirection === "out" && coolant.coolant <= 0) return;
		if (coolantTank.transferDirection === "in" && coolant.coolant >= 1) return;

		const transferSystem = this.ecs.getEntityById(
			entity.components.isCoolantTank?.transferSystem || -1,
		);
		const systemCoolant = transferSystem?.components.legacyCoolant;
		if (!systemCoolant) return;

		const tankRate =
			coolantTank.transferDirection === "out"
				? -1 * coolant.coolantTransferRate
				: 1 * coolant.coolantTransferRate;
		const systemRate =
			coolantTank.transferDirection === "out"
				? 1 * systemCoolant.coolantTransferRate
				: -1 * systemCoolant.coolantTransferRate;

		entity.updateComponent("legacyCoolant", {
			coolant: Math.min(
				1,
				Math.max(
					0,
					coolant.coolant +
						transferRate *
							coolant.coolantTransferRate *
							tankRate *
							elapsedRatio,
				),
			),
		});

		transferSystem.updateComponent("legacyCoolant", {
			coolant: Math.min(
				1,
				Math.max(
					0,
					systemCoolant.coolant + transferRate * systemRate * elapsedRatio,
				),
			),
		});

		if (
			entity.components.legacyCoolant?.coolant === 0 ||
			entity.components.legacyCoolant?.coolant === 1 ||
			transferSystem.components.legacyCoolant?.coolant === 0 ||
			transferSystem.components.legacyCoolant?.coolant === 1
		) {
			entity.updateComponent("isCoolantTank", {
				transferSystem: -1,
			});
		}
	}
}
