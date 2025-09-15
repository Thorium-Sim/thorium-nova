import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { Entity, type ECS } from "@thorium/utils/ecs";
import { z } from "zod";

function getContacts(ecs: ECS, shipId: number) {
	const contacts: Entity[] = [];
	for (const contact of ecs.componentCache.get("isArmyContact") || []) {
		if (contact.components.isSensorContact?.shipId === shipId) {
			contacts.push(contact);
		}
	}

	return contacts;
}

export const sensorGrid = t.router({
	armyContacts: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(["isSensorContact", "isArmyContact"], (entity) =>
			entity.components.isSensorContact?.shipId
				? { shipId: entity.components.isSensorContact?.shipId }
				: null,
		)
		.request(({ ctx, input }) => {
			return getContacts(ctx.ecs, input.shipId).map((contact) => ({
				id: contact.id,
				name: contact.components.identity?.name || "Contact",
				icon: contact.components.isSensorContact?.icon,
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
			const lastContact = getContacts(ctx.ecs, input.shipId).at(-1);

			const contact = new Entity();

			contact.addComponent("isArmyContact");
			contact.addComponent("isSensorContact", {
				shipId: input.shipId,
				sensorsId: sensors.id,
				type: "contact",
				icon: lastContact?.components.isSensorContact?.icon,
			});
			contact.addComponent("identity", {
				name: lastContact?.components.identity?.name || "Contact",
			});
			contact.addComponent("rotation", lastContact?.components.rotation);
			contact.addComponent("size", lastContact?.components.size);
			contact.addComponent("color", lastContact?.components.color);

			ctx.ecs.addEntity(contact);
			pubsub.publish.legacy.sensorGrid.armyContacts({ shipId: input.shipId });
		}),
});
