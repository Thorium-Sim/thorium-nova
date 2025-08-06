import type { RNG } from "@thorium/utils/rng";

export function randomFromList<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)];
}
