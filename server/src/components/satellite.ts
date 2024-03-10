import { z } from "zod";

export const satellite = z
	.object({
		/**
		 * The tilt of the axis of rotation in degrees
		 */
		axialTilt: z.number().default(23.5),
		/**
		 * Orbital mechanics based on Keplerian Elements https://en.wikipedia.org/wiki/Orbital_elements#Keplerian_elements
		 * Check this page if you need a visualization https://ciechanow.ski/gps/
		 * To simplify it, this doesn't include the Longitude of Ascending Node or the Argument of Periapsis, and
		 * True Anomaly is renamed to Orbital Arc to be a little easier to understand.
		 * Defaults based on Earth
		 */
		/**
		 * Distance from the center of the orbit to the furthest point
		 */
		semiMajorAxis: z.number().default(149600000),
		/**
		 * The shape of the orbit elliptical compared to a circle. 0 is a circular orbit.
		 */
		eccentricity: z.number().min(0).max(1).default(0.01671022),
		/**
		 * Vertical tilt of the orbit in degrees
		 */
		inclination: z.number().default(0),
		/**
		 * Angle where the object currently is in its orbit in degrees
		 */
		orbitalArc: z.number().default(0),
		/**
		 * Whether the orbit should be shown on the star map
		 */
		showOrbit: z.boolean().default(true),
		/**
		 * The ID of the parent object.
		 */
		parentId: z.number().nullable().default(null),
	})
	.default({});
