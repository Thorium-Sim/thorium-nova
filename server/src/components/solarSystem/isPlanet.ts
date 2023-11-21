import {planetClasses} from "@server/spawners/planetTypes";
import z from "zod";

export const isPlanet = z
  .object({
    /**
     * Age of the planet in years
     */
    age: z.number().default(4543000000),
    /**
     * Star Trek planetary classification can be found here: https://memory-alpha.fandom.com/wiki/Planetary_classification
     */
    classification: planetClasses.default("M"),
    /**
     * Radius of the planet in kilometers
     */
    radius: z.number().default(3959),
    /**
     * Mass of the planet compared to Earth
     */
    terranMass: z.number().default(1),
    /**
     * If the planet is habitable or not
     */
    isHabitable: z.boolean().default(true),
    /**
     * A description of lifeforms on the planet
     */

    lifeforms: z.array(z.string()).default(["Unknown"]),
    /**
     * A list of the components that make up the planet's atmosphere
     */
    atmosphericComposition: z
      .array(
        z.object({
          component: z.string(),
          concentration: z.number(),
        })
      )
      .default([{component: "nitrogen", concentration: 100}]),
    /**
     * Image used for the texture of the planet's surface
     */
    textureMapAsset: z.string().default(""),
    /**
     * Image used for the texture of the planet's clouds
     */
    cloudMapAsset: z.string().nullable().default(null),
    /**
     * Image used for the texture of the planet's rings
     */
    ringMapAsset: z.string().nullable().default(null),
  })
  .default({});
