export function isFriendOrFoe(
	shipReputation: Record<string, number>,
	factionReputation: Record<string, number> | null,
	targetId: number,
	targetFactionId: number | null,
) {
	const shipToShip = shipReputation[targetId.toString()] || 0;
	const shipToFaction = shipReputation[targetFactionId?.toString() || ""] || 0;
	const factionToShip = factionReputation?.[targetId.toString()] || 0;
	const factionToFaction = factionReputation?.[targetFactionId?.toString() || ""] || 0;

	// Add up all of the IFF values. This makes it possible to
	// sway an individual ship to your side by overcoming your
	// reputation in the eyes of their faction
	return shipToShip + shipToFaction + factionToShip + factionToFaction;
}
