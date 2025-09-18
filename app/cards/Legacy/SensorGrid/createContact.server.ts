import { type ECS, Entity } from "@thorium/utils/ecs";

export const defaultIcon =
	"/plugins/Thorium Default/assets/Sensor Contacts/Icons/dot.svg";
export const defaultPicture =
	"/plugins/Thorium Default/assets/Sensor Contacts/Pictures/Astra Battleship.avif";

export function getArmyContacts(ecs: ECS, shipId: number) {
	const contacts: Entity[] = [];
	for (const contact of ecs.componentCache.get("isArmyContact") || []) {
		if (contact.components.isSensorContact?.shipId === shipId) {
			contacts.push(contact);
		}
	}

	return contacts;
}
export function createContact(
	shipId: number,
	sensorsId: number,
	lastContact?: Entity,
) {
	const contact = new Entity();

	contact.addComponent("isSensorContact", {
		shipId,
		sensorsId,
		type: "contact",
		icon: defaultIcon,
		picture: defaultPicture,
		autoFire: false,
		cloaked: false,
		disabled: false,
		hitpoints: 5,
		hostile: false,
		infrared: false,
		miss: false,
		particle: "AntiMatter",
		...lastContact?.components.isSensorContact,
	});
	contact.addComponent("identity", {
		name: lastContact?.components.identity?.name || "Contact",
	});
	contact.addComponent("rotation", lastContact?.components.rotation);
	contact.addComponent("size", {
		length: lastContact?.components.size?.length || 1,
	});
	contact.addComponent("color", lastContact?.components.color);

	return contact;
}
