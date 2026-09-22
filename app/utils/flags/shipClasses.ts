import z from "zod";

/**
 * Carrier — Primarily carries other ships, either with docking ports or shuttle/fighter bays.
 * Cruiser — Heavily armed, designed to operate on solo missions.
 * Frigate — Smaller, designed to escort other ships and operate in fleets.
 * Corvette — Smaller, faster, designed to operate around planets and starbases, not deep space.
 * Scout — Very small, very fast ships with limited personnel. Recon and stealth missions.
 * Shuttle — The smallest, for transporting cargo or personnel or very limited missions.
 * Fighter — Single-pilot, short-range for combat.
 */
export const shipCategories = z.enum([
	"Carrier",
	"Cruiser",
	"Frigate",
	"Corvette",
	"Scout",
	"Shuttle",
	"Fighter",
]);
export type ShipCategories = z.infer<typeof shipCategories>;
