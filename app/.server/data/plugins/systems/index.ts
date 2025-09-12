import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { type Primitive, z, type ZodLiteral } from "zod";
import {
	getPlugin,
	getShipSystem,
	getShipSystemForInput,
	pluginFilter,
	systemInput,
} from "../utils";
import { impulse } from "./impulse";
import { warp } from "./warp";
import { inertialDampeners } from "./inertialDampeners";
import { thrusters } from "./thrusters";
import { reactor } from "./reactor";
import { battery } from "./battery";
import { torpedoLauncher } from "./torpedoLauncher";
import { shields } from "./shields";
import { phasers } from "./phasers";
import { sound } from "@thorium/ecs-components/sound";
import path from "node:path";
import { sensors } from "./sensors";
import { mainComputer } from "./mainComputer";
import type BaseShipSystemPlugin from "@thorium/.server/classes/Plugins/ShipSystems/BaseSystem";

const systemTypes = createUnionSchema(
	Object.keys(ShipSystemTypes) as (keyof typeof ShipSystemTypes)[],
);

export const systems = t.router({
	impulse,
	warp,
	inertialDampeners,
	thrusters,
	reactor,
	battery,
	torpedoLauncher,
	shields,
	phasers,
	sensors,
	mainComputer,
	all: t.procedure
		.input(z.object({ pluginId: z.string() }).optional())
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (!input) return true;
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			if (!input?.pluginId)
				return ctx.server.plugins
					.reduce(
						(acc, plugin) => acc.concat(plugin.aspects.shipSystems),
						[] as typeof plugin.aspects.shipSystems,
					)
					.map((shipSystem) => ({
						...shipSystem,
						pluginName: shipSystem.plugin.name,
						// @ts-expect-error
						flightModes: shipSystem.constructor.flightModes,
					}));
			const plugin = getPlugin(ctx, input.pluginId);

			return plugin.aspects.shipSystems.map((shipSystem) => ({
				...shipSystem,
				pluginName: shipSystem.plugin.name,
				// @ts-expect-error
				flightModes: shipSystem.constructor.flightModes,
			}));
		}),
	get: t.procedure
		.input(systemInput)
		.filter(pluginFilter)
		.request(({ ctx, input }) => {
			return getShipSystem({ ctx, input });
		}),
	available: t.procedure.request(() => {
		return Object.keys(ShipSystemTypes).map((key) => {
			const type = key as keyof typeof ShipSystemTypes;
			const systemConstructor = ShipSystemTypes[type];
			return { type, flags: systemConstructor.flags };
		});
	}),
	create: t.procedure
		.input(
			z.object({ pluginId: z.string(), name: z.string(), type: systemTypes }),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ShipSystemClass =
				ShipSystemTypes[input.type as keyof typeof ShipSystemTypes];
			const shipSystem = new ShipSystemClass({ name: input.name }, plugin);
			plugin.aspects.shipSystems.push(shipSystem);

			pubsub.publish.plugin.systems.all({ pluginId: input.pluginId });
			return { shipSystemId: shipSystem.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), shipSystemId: z.string() }))
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const shipSystem = plugin.aspects.shipSystems.find(
				(s) => s.name === input.shipSystemId,
			);
			if (!shipSystem) {
				throw new Error("Ship system not found");
			}
			plugin.aspects.shipSystems.splice(
				plugin.aspects.shipSystems.indexOf(shipSystem),
				1,
			);

			pubsub.publish.plugin.systems.all({ pluginId: input.pluginId });
			return { shipSystemId: shipSystem.name };
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipId: z.string().optional(),
				shipPluginId: z.string().optional(),
				name: z.string().optional(),
				description: z.string().optional(),
				tags: z.string().array().optional(),
				powerLevels: z.number().array().optional(),
				defaultPower: z.number().optional(),
				maxSafePower: z.number().optional(),
				powerToHeat: z.number().optional(),
				heatDissipationRate: z.number().optional(),
				nominalHeat: z.number().optional(),
				maxSafeHeat: z.number().optional(),
				maxHeat: z.number().optional(),
				offlineEfficiency: z.number().optional(),
				onlineEfficiency: z.number().optional(),
				overloadDamageMultiplier: z.number().optional(),
				minSignature: z.number().optional(),
				maxSignature: z.number().optional(),
				signatureSpike: z.number().optional(),
				signatureSpikeDuration: z.number().optional(),
				entropyMultiplier: z.number().optional(),
				soundEffects: z.record(sound.array()).optional(),
				coolantTransferRate: z.number().optional(),
				coolantConsumptionRate: z.number().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput(ctx, input);
			const shipSystem = override || system;

			if (!system || !shipSystem) {
				throw new Error("Ship system not found");
			}
			if (input.name) {
				if (shipSystem.rename) {
					await shipSystem.rename(input.name);
				} else {
					shipSystem.name = input.name;
				}
			}
			if (typeof input.description === "string") {
				shipSystem.description = input.description;
			}
			if (input.tags) {
				shipSystem.tags = input.tags;
			}

			if (input.shipPluginId && input.shipId) {
				pubsub.publish.plugin.ship.get({
					pluginId: input.shipPluginId,
					shipId: input.shipId,
				});
			}

			if (Array.isArray(input.powerLevels)) {
				shipSystem.powerLevels = input.powerLevels;
			}
			if (typeof input.defaultPower === "number") {
				shipSystem.defaultPower = input.defaultPower;
			}
			if (typeof input.powerToHeat === "number") {
				shipSystem.powerToHeat = input.powerToHeat;
			}
			if (typeof input.heatDissipationRate === "number") {
				shipSystem.heatDissipationRate = input.heatDissipationRate;
			}
			if (typeof input.nominalHeat === "number") {
				shipSystem.nominalHeat = input.nominalHeat;
			}
			if (typeof input.maxSafeHeat === "number") {
				shipSystem.maxSafeHeat = input.maxSafeHeat;
			}
			if (typeof input.maxHeat === "number") {
				shipSystem.maxHeat = input.maxHeat;
			}
			if (typeof input.offlineEfficiency === "number") {
				shipSystem.offlineEfficiency = Math.min(
					1,
					Math.max(0, input.offlineEfficiency),
				);
			}
			if (typeof input.onlineEfficiency === "number") {
				shipSystem.onlineEfficiency = Math.min(
					1,
					Math.max(0, input.onlineEfficiency),
				);
			}
			if (typeof input.overloadDamageMultiplier === "number") {
				shipSystem.overloadDamageMultiplier = input.overloadDamageMultiplier;
			}
			if (typeof input.minSignature === "number") {
				shipSystem.minSignature = input.minSignature;
			}
			if (typeof input.maxSignature === "number") {
				shipSystem.maxSignature = input.maxSignature;
			}
			if (typeof input.signatureSpike === "number") {
				shipSystem.signatureSpike = input.signatureSpike;
			}
			if (typeof input.signatureSpikeDuration === "number") {
				shipSystem.signatureSpikeDuration = input.signatureSpikeDuration;
			}
			if (typeof input.entropyMultiplier === "number") {
				shipSystem.entropyMultiplier = input.entropyMultiplier;
			}
			if (
				typeof input.soundEffects === "object" &&
				"soundEffects" in shipSystem
			) {
				shipSystem.soundEffects = input.soundEffects;
			}

			// Legacy Properties
			if (typeof input.coolantConsumptionRate === "number") {
				shipSystem.coolantConsumptionRate = input.coolantConsumptionRate;
			}
			if (typeof input.coolantTransferRate === "number") {
				shipSystem.coolantTransferRate = input.coolantTransferRate;
			}
			pubsub.publish.plugin.systems.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.systems.get({
				pluginId: input.pluginId,
			});
			return { shipSystemId: system.name };
		}),
	addSoundEffect: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipId: z.string().optional(),
				shipPluginId: z.string().optional(),
				fileName: z.string().optional(),
				file: z.instanceof(File),
				soundEffect: z.string(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput(ctx, input);
			const shipSystem = override || system;
			if (!shipSystem || "soundEffects" in shipSystem === false) {
				return;
			}
			if (typeof input.file === "string") {
				const filePath = path.basename(input.file);
				const url = await ctx.uploadFile.call(
					system,
					input.file,
					input.fileName || filePath,
				);
				if (!Array.isArray(shipSystem.soundEffects[input.soundEffect])) {
					shipSystem.soundEffects[input.soundEffect] = [];
				}
				shipSystem.soundEffects[input.soundEffect].push({
					url,
					channel: null,
					volume: [1, 1],
					loop: false,
					delay: 0,
					gap: 0,
					playbackRate: [1, 1],
					loopEnd: null,
					loopStart: null,
				});
			}

			pubsub.publish.plugin.systems.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.systems.get({
				pluginId: input.pluginId,
			});
		}),
	restoreOverride: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				systemId: z.string(),
				shipId: z.string(),
				shipPluginId: z.string(),
				property: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const [system, override] = getShipSystemForInput(ctx, input);

			if (override) {
				delete override[input.property];
			}

			pubsub.publish.plugin.ship.get({
				pluginId: input.shipPluginId,
				shipId: input.shipId,
			});
			if (system) {
				pubsub.publish.plugin.systems.all({ pluginId: input.pluginId });
				pubsub.publish.plugin.systems.get({
					pluginId: input.pluginId,
				});
			}
		}),
});

function createUnionSchema<T extends readonly Primitive[]>(values: T) {
	if (values.length === 0) {
		return z.never();
	}

	if (values.length === 1) {
		return z.literal(values[0]);
	}

	const createUnion = <
		T extends Readonly<[Primitive, Primitive, ...Primitive[]]>,
	>(
		values: T,
	) => {
		const zodLiterals = values.map((value) => z.literal(value)) as unknown as [
			ZodLiteral<Primitive>,
			ZodLiteral<Primitive>,
			...ZodLiteral<Primitive>[],
		];
		return z.union(zodLiterals);
	};

	return createUnion(
		values as unknown as Readonly<[Primitive, Primitive, ...Primitive[]]>,
	);
}
