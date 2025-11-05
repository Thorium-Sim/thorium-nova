export function getMaxSpeedIndex(powerLevels: number[], currentPower: number) {
	const maxPower = powerLevels.at(-1) || 1;

	return currentPower / maxPower;
}
