import type { Kilometer } from "@server/utils/unitTypes";

/**
 * In 32-bit floating point, precision is lost after 2^24,
 * so we limit the physics world to +/- 2^24 meters.
 */
export const COLLISION_PHYSICS_LIMIT: Kilometer = Math.floor(2 ** 24 / 1000);
export const SECTOR_GRID_SIZE: Kilometer = COLLISION_PHYSICS_LIMIT * 2;
export const SECTOR_GRID_OFFSET: Kilometer = SECTOR_GRID_SIZE / 2;
