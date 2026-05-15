/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is object {
	return !!(item && typeof item === "object" && !Array.isArray(item));
}
