import z from "zod";

/**
 * Any entity that has this component will automatically be cleaned up
 * when its list of entityIds is empty. To make an entity immortal, either
 * add the flight entity ID to the list, or remove this component.
 */
export const disposable = z.object({
	/**
	 * IDs of entities that this entity is connected to.
	 * If the list is empty, then the entity should be removed.
	 */
	entityIds: z.number().array(),
});
