import type { Entity } from "@thorium/utils/ecs";
import z from "zod";

export const damageTypes = z.enum([
	"Electrical",
	"Heat",
	"Structural",
	"Plumbing",
	"Radiation",
	"Contamination",
	"Computer",
	"Corrosion",
	"Fatigue",
	"Cryogenic",
]);

const damageEffects = [
	"efficiency",
	"heatMultiplier",
	"instability",
	"signature",
	"failureRisk",
	"cascadeRisk",
	"crewSafetyRating",
] as const;

export const damageTypeValues = Object.values(damageTypes.Values);

type DamageEffects = (typeof damageEffects)[number];

type DamageEffectsObject = { [K in DamageEffects]: number };
/**
 * Takes a ship system entity and determines what effects should be applied
 * when a damage report is completed.
 */
export function getReportEffects(
	system: Entity,
	mainEffect: DamageEffects = "efficiency",
	sideEffectType: "negative" | "positive" | "neutral" = "neutral",
): Partial<DamageEffectsObject> {
	const rng = system.ecs.rng;
	const damage = system.components.damage;
	if (!damage) return {};

	// Decide which effects we can adjust - it will most often be all of them
	const possibleEffects: DamageEffects[] = [];
	if (damage.efficiency < 1) possibleEffects.push("efficiency");
	// We'll hard-code this limit
	if (damage.heatMultiplier > 0.5) possibleEffects.push("heatMultiplier");
	if (damage.instability > 0 && damage.instability < 1)
		possibleEffects.push("instability");
	if (
		damage.signature > damage.minSignature &&
		damage.signature < damage.maxSignature
	)
		possibleEffects.push("signature");
	if (damage.failureRisk > 0 && damage.failureRisk < 1)
		possibleEffects.push("failureRisk");
	if (damage.cascadeRisk > 0 && damage.cascadeRisk < 1)
		possibleEffects.push("cascadeRisk");
	if (damage.crewSafetyRating > 0) possibleEffects.push("crewSafetyRating");

	// Bias the number of effects to 2, but allow 3 or 1 effect as well.
	const val = rng.next() + 0.5;
	const numberOfEffects = val < 0.1 ? 1 : val > 0.7 ? 3 : 2;
	const effects: Partial<DamageEffectsObject> = {};

	for (let i = 0; i < numberOfEffects; i++) {
		const effect =
			i === 0
				? mainEffect
				: // Remove effects that have already been chosen
					rng.nextFromList(damageEffects.filter((e) => !effects[e]));

		let effectAmount = rng.next() * 0.2;
		if (i === 0 || sideEffectType === "positive")
			effectAmount =
				Math.abs(effectAmount) * (effect === "efficiency" ? 1 : -1);
		if (sideEffectType === "negative")
			effectAmount =
				Math.abs(effectAmount) * (effect === "efficiency" ? -1 : 1);

		effects[effect] = effectAmount;
	}

	return effects;
}
