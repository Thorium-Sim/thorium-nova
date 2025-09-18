import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { activePingInterval } from "@thorium/.server/systems/Legacy/SensorSonarSystem";
import {
	createContact,
	defaultIcon,
	defaultPicture,
	getArmyContacts,
} from "@thorium/cards/Legacy/SensorGrid/createContact.server";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity, type ECS } from "@thorium/utils/ecs";
import { degToRad } from "@thorium/utils/unitTypes";
import { z } from "zod";

interface ContactProperties {
	id: number;
	name: string;
	type: "contact" | "border" | "planet" | "ping" | "projectile";
	icon: string;
	picture: string | null;
	color: string;
	size: number;
	locked: boolean;
	disabled: boolean;
	hostile: boolean;
	cloaked: boolean;
	infrared: boolean;
	destroyed: boolean;
	position: { x: number; y: number };
	destination: { x: number; y: number };
}

function updateContact(
	contact: Entity,
	properties: Partial<
		Pick<
			ContactProperties,
			| "name"
			| "icon"
			| "picture"
			| "color"
			| "size"
			| "locked"
			| "disabled"
			| "hostile"
			| "cloaked"
			| "infrared"
			| "destination"
			| "destroyed"
		> & { speed: number }
	>,
) {
	const sensors = contact.ecs.getEntityById(
		contact?.components.isSensorContact?.sensorsId || -1,
	);
	if (sensors?.components.isLegacySensors?.frozen) {
		contact.updateComponent("isSensorContact", {
			frozenState: {
				...contact.components.isSensorContact?.frozenState,
				...properties,
				...(properties.destination ? { removed: false } : {}),
			},
		});
	} else {
		for (const property of Object.entries(properties)) {
			switch (property[0]) {
				case "name":
					contact.updateComponent("identity", { name: properties.name });
					break;
				case "size":
					contact.updateComponent("size", { length: properties.size });
					break;
				case "color":
					contact.updateComponent("color", { color: properties.color });
					break;
				case "destination":
					contact.updateComponent("isSensorContact", {
						destination: properties.destination,
						speed:
							properties.speed ||
							sensors?.components.isLegacySensors?.defaultSpeed,
					});
					pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
						shipId: contact.components.isSensorContact?.shipId || -1,
					});
					break;
				default:
					contact.updateComponent("isSensorContact", {
						[property[0]]: property[1],
					});
					break;
			}
		}
	}
}

export const sensorGrid = t.router({
	sensors: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isLegacySensors"], (entity) =>
			entity.components.isShipSystem?.shipId
				? { shipId: entity.components.isShipSystem?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const sensors = sensorsSys.components.isLegacySensors;

			if (!sensors) throw new Error("Sensors not found");
			return {
				id: sensorsSys.id,
				pingActive: sensors.pingActive,
				pingMode: sensors.pingMode,
				autoTargeting: sensors.autoTargeting,
				autoThrusters: sensors.autoThrusters,
				defaultSpeed: sensors.defaultSpeed,
				frozen: sensors.frozen,
				interference: sensors.interference,
				movement: sensors.movement,
				segments: sensors.segments,
				program: sensors.program,
			};
		}),
	updateSensors: t.procedure
		.input(
			z.object({
				sensorsId: z.number(),
				defaultSpeed: z.number().optional(),
				movement: z.object({ x: z.number(), y: z.number() }).optional(),
				interference: z.number().optional(),
				autoTargeting: z.boolean().optional(),
				autoThrusters: z.boolean().optional(),
				pingActive: z.boolean().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.sensorsId);
			if (!system) return;

			if (typeof input.defaultSpeed !== "undefined") {
				system.updateComponent("isLegacySensors", {
					defaultSpeed: input.defaultSpeed,
				});
			}
			if (typeof input.movement !== "undefined") {
				system.updateComponent("isLegacySensors", {
					movement: input.movement,
				});
			}
			if (typeof input.interference !== "undefined") {
				system.updateComponent("isLegacySensors", {
					interference: input.interference,
				});
			}
			if (typeof input.autoTargeting !== "undefined") {
				system.updateComponent("isLegacySensors", {
					autoTargeting: input.autoTargeting,
				});
			}
			if (typeof input.autoThrusters !== "undefined") {
				system.updateComponent("isLegacySensors", {
					autoThrusters: input.autoThrusters,
				});
			}
			if (typeof input.pingActive !== "undefined") {
				system.updateComponent("isLegacySensors", {
					pingActive: input.pingActive,
				});
			}

			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
		}),
	// Just lets the station know to fire off the sonar ping
	sonarPing: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish([], () => null)
		.request(({ ctx, input, publish }) => {
			if (!publish) return null;
			return true;
		}),
	freezeSensors: t.procedure
		.input(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			sensorsSys.updateComponent("isLegacySensors", { frozen: true });
			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: input.shipId,
			});
		}),
	unfreezeSensors: t.procedure
		.input(z.object({ shipId: z.number(), apply: z.boolean() }))
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			sensorsSys.updateComponent("isLegacySensors", { frozen: false });

			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				if (
					contact.components.isArmyContact ||
					contact.components.isSensorContact?.sensorsId !== sensorsSys.id
				)
					continue;

				const data = contact.components.isSensorContact.frozenState;
				if (!data) continue;
				if (input.apply) {
					if (data.removed) {
						ctx.ecs.removeEntity(contact);
					} else {
						updateContact(contact, data);
					}
				} else if (data.new) {
					ctx.ecs.removeEntity(contact);
				}
				contact.updateComponent("isSensorContact", { frozenState: null });
			}

			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: input.shipId,
			});
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: input.shipId,
			});
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: input.shipId,
			});
		}),
	setPingMode: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				pingMode: z.enum(["active", "passive", "manual"]),
			}),
		)
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			sensorsSys.updateComponent("isLegacySensors", {
				pingMode: input.pingMode,
			});
			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: input.shipId,
			});
		}),
	triggerPing: t.procedure
		.input(
			z.object({
				shipId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			if (
				sensorsSys.components.isLegacySensors &&
				sensorsSys.components.isLegacySensors.timeSincePingMs >=
					activePingInterval
			) {
				pubsub.publish.legacy.sensorGrid.sonarPing({
					shipId: input.shipId,
				});
				sensorsSys.updateComponent("isLegacySensors", {
					timeSincePingMs: 0,
				});
			}
		}),
	setProgram: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				program: z
					.object({ type: z.literal("field"), density: z.number() })
					.nullable(),
			}),
		)
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});

			sensorsSys.updateComponent("isLegacySensors", { program: input.program });
			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: input.shipId,
			});
		}),
	setSegment: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				ring: z.number(),
				line: z.number(),
				blocked: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const sensorsSys = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			sensorsSys.updateComponent("isLegacySensors", {
				segments: {
					...sensorsSys.components.isLegacySensors?.segments,
					[`${input.ring}-${input.line}`]: input.blocked,
				},
			});
			pubsub.publish.legacy.sensorGrid.sensors({
				shipId: input.shipId,
			});
		}),
	sensorContacts: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isSensorContact"], (entity) =>
			entity.components.isSensorContact?.shipId
				? { shipId: entity.components.isSensorContact?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			const contacts: (ContactProperties & {
				frozenState: Partial<
					Pick<
						ContactProperties,
						| "name"
						| "icon"
						| "picture"
						| "infrared"
						| "cloaked"
						| "locked"
						| "disabled"
						| "destination"
						| "destroyed"
						| "size"
					> & {
						new: boolean;
						speed: number;
						removed: boolean;
					}
				> | null;
			})[] = [];
			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				if (
					contact.components.isSensorContact?.shipId === input.shipId &&
					!contact.components.isArmyContact
				) {
					contacts.push({
						id: contact.id,
						name: contact.components.identity?.name || "Contact",
						type: contact.components.isSensorContact.type,
						icon: contact.components.isSensorContact.icon,
						picture: contact.components.isSensorContact.picture,
						color: contact.components.color?.color || "#ffffff",
						size: contact.components.size?.length || 1,
						locked: contact.components.isSensorContact.locked,
						disabled: contact.components.isSensorContact.disabled,
						hostile: contact.components.isSensorContact.hostile,
						cloaked: contact.components.isSensorContact.cloaked,
						infrared: contact.components.isSensorContact.infrared,
						destroyed: contact.components.isSensorContact.destroyed,
						destination: contact.components.isSensorContact.destination,
						position: {
							x: contact.components.position?.x || 0,
							y: contact.components.position?.y || 0,
						},
						frozenState: contact.components.isSensorContact.frozenState,
					});
				}
			}

			return contacts;
		}),
	// A more narrow request to avoid high bandwidth messages
	// when destination updates
	sensorContactsDestination: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isSensorContact"], (entity) =>
			entity.components.isSensorContact?.shipId
				? { shipId: entity.components.isSensorContact?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			const contacts = new Map<number, { x: number; y: number }>();
			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				if (
					contact.components.isSensorContact?.shipId === input.shipId &&
					!contact.components.isArmyContact
				) {
					contacts.set(
						contact.id,
						contact.components.isSensorContact.destination,
					);
				}
			}

			return Array.from(contacts.entries());
		}),
	armyContacts: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isSensorContact", "isArmyContact"], (entity) =>
			entity.components.isSensorContact?.shipId
				? { shipId: entity.components.isSensorContact?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			return getArmyContacts(ctx.ecs, input.shipId).map((contact) => ({
				id: contact.id,
				name: contact.components.identity?.name || "Contact",
				icon: contact.components.isSensorContact?.icon || defaultIcon,
				picture: contact.components.isSensorContact?.picture || defaultPicture,
				color: contact.components.color?.color || "#ffffff",
				size: contact.components.size?.length || 1,
				locked: contact.components.isSensorContact?.locked || false,
				disabled: contact.components.isSensorContact?.disabled || false,
				hostile: contact.components.isSensorContact?.hostile || false,
				cloaked: contact.components.isSensorContact?.cloaked || false,
				infrared: contact.components.isSensorContact?.infrared || false,
				omitFromProgram:
					contact.components.isArmyContact?.omitFromProgram || false,
			}));
		}),

	addArmyContact: t.procedure
		.input(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			// Get the last contact in the list as a template
			const lastContact = getArmyContacts(ctx.ecs, input.shipId).at(-1);

			const contact = createContact(
				sensors.components.isShipSystem?.shipId || -1,
				sensors.id,
				lastContact,
			);
			contact.addComponent(
				"isArmyContact",
				lastContact?.components.isArmyContact,
			);

			ctx.ecs.addEntity(contact);
			pubsub.publish.legacy.sensorGrid.armyContacts({ shipId: input.shipId });
		}),

	updateArmyContact: t.procedure
		.input(
			z.object({
				contactId: z.number(),
				name: z.string().optional(),
				icon: z.string().optional(),
				picture: z.string().optional(),
				color: z.string().optional(),
				size: z.number().optional(),
				locked: z.boolean().optional(),
				disabled: z.boolean().optional(),
				hostile: z.boolean().optional(),
				cloaked: z.boolean().optional(),
				infrared: z.boolean().optional(),
				omitFromProgram: z.boolean().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const contact = ctx.ecs.getEntityById(input.contactId);

			if (!contact || !contact.components.isArmyContact) return;

			if (typeof input.name === "string") {
				contact.updateComponent("identity", { name: input.name });
			}
			if (typeof input.icon === "string") {
				contact.updateComponent("isSensorContact", { icon: input.icon });
			}
			if (typeof input.picture === "string") {
				contact.updateComponent("isSensorContact", { picture: input.picture });
			}
			if (typeof input.color === "string") {
				contact.updateComponent("color", { color: input.color });
			}
			if (typeof input.size === "number") {
				contact.updateComponent("size", { length: input.size });
			}
			if (typeof input.locked === "boolean") {
				contact.updateComponent("isSensorContact", { locked: input.locked });
			}
			if (typeof input.disabled === "boolean") {
				contact.updateComponent("isSensorContact", {
					disabled: input.disabled,
				});
			}
			if (typeof input.hostile === "boolean") {
				contact.updateComponent("isSensorContact", { hostile: input.hostile });
			}
			if (typeof input.cloaked === "boolean") {
				contact.updateComponent("isSensorContact", { cloaked: input.cloaked });
			}
			if (typeof input.infrared === "boolean") {
				contact.updateComponent("isSensorContact", {
					infrared: input.infrared,
				});
			}
			if (typeof input.omitFromProgram === "boolean") {
				contact.updateComponent("isArmyContact", {
					omitFromProgram: input.omitFromProgram,
				});
			}

			pubsub.publish.legacy.sensorGrid.armyContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),

	removeArmyContact: t.procedure
		.input(z.object({ armyContactId: z.number() }))
		.send(({ ctx, input }) => {
			const contact = ctx.ecs.getEntityById(input.armyContactId);

			if (!contact) return;
			ctx.ecs.removeEntity(contact);

			pubsub.publish.legacy.sensorGrid.armyContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),

	addContact: t.procedure
		.input(
			z.object({
				armyContactId: z.number(),
				position: z.tuple([z.number(), z.number()]),
			}),
		)
		.send(({ ctx, input }) => {
			const armyContact = ctx.ecs.getEntityById(input.armyContactId);
			const sensors = ctx.ecs.getEntityById(
				armyContact?.components.isSensorContact?.sensorsId || -1,
			);

			if (!armyContact) return;
			const contact = createContact(
				armyContact.components.isSensorContact?.shipId || -1,
				armyContact.components.isSensorContact?.sensorsId || -1,
				armyContact,
			);

			contact.updateComponent("position", {
				x: input.position[0],
				y: input.position[1],
			});
			contact.updateComponent("isSensorContact", {
				destination: { x: input.position[0], y: input.position[1] },
			});
			if (sensors?.components.isLegacySensors?.frozen) {
				contact.updateComponent("isSensorContact", {
					frozenState: { new: true },
				});
			}

			ctx.ecs.addEntity(contact);

			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),
	addSpecialContact: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				type: z.enum(["planet", "border", "ping"]),
				position: z.tuple([z.number(), z.number()]),
				name: z.string(),
				color: z.string(),
				size: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const sensors = getShipSystem(ctx.ecs, {
				systemType: "sensors",
				shipId: input.shipId,
			});
			const contact = new Entity();
			contact.addComponent("identity", { name: input.name });
			contact.addComponent("color", { color: input.color });
			contact.addComponent("size", { length: input.size });
			contact.addComponent("isSensorContact", {
				shipId: input.shipId,
				sensorsId: sensors.id,
				type: input.type,
				destination: { x: input.position[0], y: input.position[1] },
			});
			contact.updateComponent("position", {
				x: input.position[0],
				y: input.position[1],
			});
			if (sensors?.components.isLegacySensors?.frozen) {
				contact.updateComponent("isSensorContact", {
					frozenState: { new: true },
				});
			}
			ctx.ecs.addEntity(contact);

			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),
	updateContact: t.procedure
		.input(
			z.object({
				contactId: z.number(),
				name: z.string().optional(),
				icon: z.string().optional(),
				picture: z.string().optional(),
				color: z.string().optional(),
				size: z.number().optional(),
				locked: z.boolean().optional(),
				disabled: z.boolean().optional(),
				hostile: z.boolean().optional(),
				cloaked: z.boolean().optional(),
				infrared: z.boolean().optional(),
				destination: z.object({ x: z.number(), y: z.number() }).optional(),
				speed: z.number().optional(),
				destroyed: z.boolean().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const contact = ctx.ecs.getEntityById(input.contactId);
			const sensors = ctx.ecs.getEntityById(
				contact?.components.isSensorContact?.sensorsId || -1,
			);
			if (!contact || !sensors) return;
			updateContact(contact, input);
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),
	removeContact: t.procedure
		.input(z.object({ contactId: z.number() }))
		.send(({ ctx, input }) => {
			const contact = ctx.ecs.getEntityById(input.contactId);
			if (!contact) return;
			const sensors = ctx.ecs.getEntityById(
				contact?.components.isSensorContact?.sensorsId || -1,
			);
			if (sensors?.components.isLegacySensors?.frozen) {
				contact.updateComponent("isSensorContact", {
					frozenState: {
						...contact.components.isSensorContact?.frozenState,
						removed: true,
					},
				});
			} else {
				ctx.ecs.removeEntity(contact);
			}

			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: contact.components.isSensorContact?.shipId || -1,
			});
		}),
	clearContacts: t.procedure
		.input(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				if (
					contact.components.isArmyContact ||
					contact.components.isSensorContact?.shipId !== input.shipId
				) {
					continue;
				}
				ctx.ecs.removeEntity(contact);
			}
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: input.shipId,
			});
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: input.shipId,
			});
		}),
	stopContacts: t.procedure
		.input(z.object({ shipId: z.number() }))
		.send(({ ctx, input }) => {
			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				if (
					contact.components.isArmyContact ||
					contact.components.isSensorContact?.shipId !== input.shipId ||
					!contact.components.position
				) {
					continue;
				}
				contact.updateComponent("isSensorContact", {
					destination: {
						x: contact.components.position.x,
						y: contact.components.position.y,
					},
				});
				contact.addComponent("snapInterpolation");
			}
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: input.shipId,
			});
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: input.shipId,
			});
		}),
	nudge: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				nudge: z.object({ x: z.number(), y: z.number(), yaw: z.number() }),
			}),
		)
		.send(({ ctx, input }) => {
			for (const contact of ctx.ecs.componentCache.get("isSensorContact") ||
				[]) {
				const sensors = ctx.ecs.getEntityById(
					contact.components.isSensorContact?.sensorsId || -1,
				);
				if (
					!sensors ||
					contact.components.isArmyContact ||
					contact.components.isSensorContact?.shipId !== input.shipId ||
					!contact.components.position ||
					contact.components.isSensorContact.locked
				) {
					continue;
				}

				if (input.nudge.yaw) {
					contact.updateComponent("isSensorContact", {
						destination: rotatePoint(
							contact.components.isSensorContact.destination,
							input.nudge.yaw,
						),
					});
					contact.updateComponent(
						"position",
						rotatePoint(contact.components.position, input.nudge.yaw),
					);
					contact.addComponent("snapInterpolation");
				} else {
					const maxDistance =
						contact.components.isSensorContact.type === "planet"
							? (contact.components.size?.length || 1) / 2
							: 0.02;

					updateContact(contact, {
						speed:
							sensors.components.isLegacySensors?.defaultSpeed ||
							contact.components.isSensorContact.speed,
						destination: {
							x: Math.max(
								-1 * maxDistance,
								Math.min(
									1 + maxDistance,
									contact.components.isSensorContact.destination.x +
										input.nudge.x * 0.001,
								),
							),
							y: Math.max(
								-1 * maxDistance,
								Math.min(
									1 + maxDistance,
									contact.components.isSensorContact.destination.y +
										input.nudge.y * 0.001,
								),
							),
						},
					});
				}
			}
			pubsub.publish.legacy.sensorGrid.sensorContacts({
				shipId: input.shipId,
			});
			pubsub.publish.legacy.sensorGrid.sensorContactsDestination({
				shipId: input.shipId,
			});
		}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(
			({ ctx, input, entity }) =>
				entity?.components.isSensorContact?.shipId === input.shipId &&
				!entity.components.isArmyContact,
		),
});

export function rotatePoint({ x, y }: { x: number; y: number }, angle: number) {
	const rad = degToRad(angle);
	x -= 0.5;
	y -= 0.5;
	return {
		x: x * Math.cos(rad) - y * Math.sin(rad) + 0.5,
		y: x * Math.sin(rad) + y * Math.cos(rad) + 0.5,
	};
}
