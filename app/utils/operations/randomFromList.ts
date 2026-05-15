import type { RNG } from "@thorium/utils/rng";

export function randomFromList<T>(list: T[], rng?: RNG): T {
	return list[Math.floor((rng?.nextAsPercentage() || Math.random()) * list.length)];
}
