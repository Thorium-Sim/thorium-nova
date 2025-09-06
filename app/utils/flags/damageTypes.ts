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

export const damageEffects = [
	"efficiency",
	"heatMultiplier",
	"instability",
	"signature",
	"failureRisk",
	"cascadeRisk",
	"crewSafetyRating",
] as const;

export const damageTypeValues = Object.values(damageTypes.Values);

export type DamageTypes = Zod.infer<typeof damageTypes>;

export type DamageEffects = (typeof damageEffects)[number];

type DamageEffectsObject = { [K in DamageEffects]: number };
/**
 * Takes a ship system entity and determines what effects should be applied
 * when a damage report is completed.
 */
export function getReportEffects(
	system: Entity,
	mainEffect: DamageEffects = "efficiency",
	sideEffectType: "negative" | "positive" | "neutral" = "neutral",
): Map<number, Partial<DamageEffectsObject>> {
	const rng = system.ecs.rng;
	const damage = system.components.damage;
	if (!damage) return new Map();

	const ship = system.ecs.getEntityById(
		system.components.isShipSystem?.shipId || -1,
	);
	const damagableSystems = [
		...(ship?.components.shipSystems?.shipSystems.keys() || []),
	].flatMap((id) => {
		const sys = system.ecs.getEntityById(id);
		if (
			sys?.components.damage &&
			sys.components.damage.vulnerability !== "invulnerable"
		)
			return sys;
		return [];
	});

	// Decide which effects we can adjust - it will most often be all of them
	const possibleEffects: DamageEffects[] = [];
	if (damage.efficiency < 1) possibleEffects.push("efficiency");
	// We'll hard-code this limit
	if (
		damage.heatMultiplier > MIN_HEAT_MULTIPLIER &&
		damage.heatMultiplier < MAX_HEAT_MULTIPLIER
	)
		possibleEffects.push("heatMultiplier");
	if (damage.instability > 0 && damage.instability < MAX_INSTABILITY)
		possibleEffects.push("instability");
	if (
		damage.signature > damage.minSignature &&
		damage.signature < damage.maxSignature
	)
		possibleEffects.push("signature");
	if (damage.failureRisk > 0 && damage.failureRisk < MAX_FAILURE_RISK)
		possibleEffects.push("failureRisk");
	if (damage.cascadeRisk > 0 && damage.cascadeRisk < MAX_CASCADE_RISK)
		possibleEffects.push("cascadeRisk");
	if (
		damage.crewSafetyRating > 0 &&
		damage.crewSafetyRating < MAX_CREW_SAFETY_RATING
	)
		possibleEffects.push("crewSafetyRating");

	// Bias the number of effects to 2, but allow 3 or 1 effect as well.
	const val = rng.next() + 0.5;
	const numberOfEffects = val < 0.1 ? 1 : val > 0.7 ? 3 : 2;

	/** <systemId, Damage Effects> */
	const output = new Map<number, Partial<DamageEffectsObject>>();
	const damageMetricMultipliers = getDamageMetricMultipliers(system);

	for (let i = 0; i < numberOfEffects; i++) {
		const sysId = i === 0 ? system.id : rng.nextFromList(damagableSystems).id;
		if (!output.has(sysId)) {
			output.set(sysId, {});
		}
		const effects = output.get(sysId)!;
		const effect =
			i === 0
				? mainEffect
				: // Remove effects that have already been chosen
					rng.nextFromList(damageEffects.filter((e) => !effects?.[e]));

		let effectAmount =
			rng.next() *
			0.2 *
			(ship?.components.tweaks?.damageReportEffectMultiplier || 1);

		if (i === 0 || sideEffectType === "positive")
			effectAmount =
				Math.abs(effectAmount) *
				(effect === "efficiency" ? 1 : -1) *
				damageMetricMultipliers[effect];
		else if (sideEffectType === "negative")
			// We decrease the effect slightly if it's a negative effect to ensure that we can always make things overall better
			effectAmount =
				Math.abs(effectAmount) *
				(effect === "efficiency" ? -0.9 : 0.9) *
				damageMetricMultipliers[effect];

		effects[effect] = effectAmount;
	}

	return output;
}

// A few hard-coded values indicating the max values
const MAX_HEAT_MULTIPLIER = 2;
const MIN_HEAT_MULTIPLIER = 1;

const MAX_INSTABILITY = 0.25;

// This comes out to about an 83% chance that the system will be taken out after 5 minutes
// if the failure dice are rolled 60fps
const MAX_FAILURE_RISK = 0.01;

const MAX_CASCADE_RISK = 1;
const MAX_CREW_SAFETY_RATING = 0.5;

/**
 * Represents how much of this damage should be applied,
 * based on the mins and maxes for that damage metric
 **/
export function getDamageMetricMultipliers(
	sys: Entity,
): Record<DamageEffects, number> {
	const damage = sys.components.damage;
	return {
		efficiency: 1,
		heatMultiplier: MAX_HEAT_MULTIPLIER - MIN_HEAT_MULTIPLIER,
		instability: MAX_INSTABILITY,
		signature: damage ? damage?.maxSignature - damage?.minSignature : 0,
		failureRisk: MAX_FAILURE_RISK,
		cascadeRisk: MAX_CASCADE_RISK,
		crewSafetyRating: MAX_CREW_SAFETY_RATING,
	};
}

export function getAggregateDamage(sys: Entity) {
	const damage = sys.components.damage;
	if (!damage) return 0;
	const damageMultipliers = getDamageMetricMultipliers(sys);

	let output = 0;

	output += 1 - damage.efficiency;
	output +=
		(damage.heatMultiplier - MIN_HEAT_MULTIPLIER) *
		damageMultipliers.heatMultiplier;
	output += damage.instability * (1 / damageMultipliers.instability);
	output +=
		(damage.signature - damage.minSignature) *
		(1 / damageMultipliers.signature);
	output += damage.failureRisk * (1 / damageMultipliers.failureRisk);
	output += damage.cascadeRisk * (1 / damageMultipliers.cascadeRisk);
	output += damage.crewSafetyRating * (1 / damageMultipliers.crewSafetyRating);

	output /= 7;

	return output;
}

export const diagnosticRecord = z.object({
	efficiency: z.number(),
	heatMultiplier: z.number(),
	instability: z.number(),
	signature: z.number(),
	failureRisk: z.number(),
	cascadeRisk: z.number(),
	crewSafetyRating: z.number(),
});
