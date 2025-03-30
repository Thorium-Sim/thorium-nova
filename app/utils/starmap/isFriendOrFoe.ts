export function isFriendOrFoe(
	shipReputation: Record<string, number>,
	factionReputation: Record<string, number> | null,
	targetId: number,
	targetFactionId: number | null,
) {
	// The direct reputation between these two ships.
	if (typeof shipReputation[targetId.toString()] === "number")
		return shipReputation[targetId.toString()];
	// Reputation between the ship and the target's faction
	if (
		targetFactionId &&
		typeof shipReputation[targetFactionId?.toString()] === "number"
	) {
		return shipReputation[targetFactionId.toString()];
	}
	if (!factionReputation) return 0;
	// Reputation between the ship's faction and the target ship
	if (typeof factionReputation[targetId.toString()] === "number")
		return factionReputation[targetId.toString()];

	// Reputation between the ship's faction and the target's faction
	if (
		targetFactionId &&
		typeof factionReputation[targetFactionId.toString()] === "number"
	)
		return factionReputation[targetFactionId.toString()];
	return 0;
}
