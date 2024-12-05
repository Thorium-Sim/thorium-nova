export function interpolateToRange(range: [number, number], value: number) {
	return value * (range[1] - range[0]) + range[0];
}
