import StarPlugin from "@server/classes/Plugins/Universe/Star";
import {t} from "@server/init/t";
import {pubsub} from "@server/init/pubsub";
import {spectralTypes, starTypes} from "@server/spawners/starTypes";
import {generateIncrementedName} from "@server/utils/generateIncrementedName";
import inputAuth from "@server/utils/inputAuth";
import {randomFromRange} from "@server/utils/randomFromRange";
import {z} from "zod";
import {getSolarSystem} from "../utils";

function getAlphabet(index: number): string {
  if (index > 26)
    return `${getAlphabet(Math.floor(index / 26))}${getAlphabet(index % 26)}`;
  return String.fromCharCode(index + 65);
}

/**
 * The distance between stars in the same system.
 */
const STAR_DISTANCE = 6;

export const star = t.router({
  create: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        solarSystemId: z.string(),
        spectralType: spectralTypes,
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const solarSystem = getSolarSystem(
        ctx,
        input.pluginId,
        input.solarSystemId
      );
      const childrenStars = solarSystem.stars;

      const starType = starTypes.find(
        s => s.spectralType === input.spectralType
      );
      if (solarSystem.stars.length >= 3) {
        throw new Error(`Only 3 stars are allowed`);
      }

      if (!starType) {
        throw new Error(`Invalid spectral type: ${input.spectralType}`);
      }

      // Let's assume that there are fewer than 3 stars in the system.
      const name = `${solarSystem.name} ${getAlphabet(
        solarSystem.stars.length
      )}`;

      const radius = randomFromRange(starType.radiusRange);

      // TODO January 21, 2022 Calculate the distance of the star for binary systems
      let semiMajorAxis = 0;
      let orbitalArc = Math.random() * 360;
      if (childrenStars.length === 1) {
        const otherStar = childrenStars[0];
        semiMajorAxis = (radius + (otherStar.radius || 0)) * STAR_DISTANCE;
        orbitalArc = (otherStar.satellite?.orbitalArc || 0) + 180;
        if (otherStar.satellite) {
          otherStar.satellite.semiMajorAxis = semiMajorAxis;
        }
      }
      if (childrenStars.length === 2) {
        const star1 = childrenStars[0];
        const star2 = childrenStars[1];
        semiMajorAxis =
          (radius + (star1.radius || 0) + (star2.radius || 0)) * STAR_DISTANCE;
        orbitalArc = (star1.satellite?.orbitalArc || 0) + 120;
        if (star1.satellite) {
          star1.satellite.semiMajorAxis = semiMajorAxis;
        }
        if (star2.satellite) {
          star2.satellite.orbitalArc = orbitalArc + 120;
          star2.satellite.semiMajorAxis = semiMajorAxis;
        }
      }

      const star = new StarPlugin(
        {
          name: generateIncrementedName(
            name,
            solarSystem.planets
              .map(p => p.name)
              .concat(solarSystem.stars.map(star => star.name))
              .concat(solarSystem.name)
          ),
          spectralType: input.spectralType,
          radius,
          age: randomFromRange(starType.ageRange),
          hue: randomFromRange(starType.hueRange),
          isWhite: starType.white,
          solarMass: randomFromRange(starType.solarMassRange),
          temperature: randomFromRange(starType.temperatureRange),
          satellite: {
            orbitalArc,
            semiMajorAxis,
          },
        },
        solarSystem
      );
      solarSystem.stars.push(star);

      pubsub.publish.plugin.starmap.get({
        pluginId: input.pluginId,
        solarSystemId: solarSystem.name,
      });

      return star;
    }),
  delete: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        solarSystemId: z.string(),
        starId: z.string(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const solarSystem = getSolarSystem(
        ctx,
        input.pluginId,
        input.solarSystemId
      );
      const star = solarSystem.stars.find(s => s.name === input.starId);
      if (!star) {
        throw new Error(`No star found with id ${input.starId}`);
      }
      solarSystem.stars = solarSystem.stars.filter(s => s !== star);
      pubsub.publish.plugin.starmap.get({
        pluginId: input.pluginId,
        solarSystemId: solarSystem.name,
      });
      return star;
    }),
  update: t.procedure
    .input(
      z.object({
        pluginId: z.string(),
        solarSystemId: z.string(),
        starId: z.string(),
        name: z.string().optional(),
        radius: z.number().optional(),
        age: z.number().optional(),
        hue: z.number().optional(),
        isWhite: z.boolean().optional(),
        solarMass: z.number().optional(),
        temperature: z.number().optional(),
      })
    )
    .send(({ctx, input}) => {
      inputAuth(ctx);
      const solarSystem = getSolarSystem(
        ctx,
        input.pluginId,
        input.solarSystemId
      );
      const star = solarSystem.stars.find(s => s.name === input.starId);
      if (!star) {
        throw new Error(`No star found with id ${input.starId}`);
      }
      if (input.name) {
        star.name = generateIncrementedName(
          input.name,
          solarSystem.planets
            .map(p => p.name)
            .concat(solarSystem.stars.map(star => star.name))
            .concat(solarSystem.name)
        );
      }
      if (input.radius) {
        star.radius = input.radius;
      }
      if (input.age) {
        star.age = input.age;
      }
      if (input.hue) {
        star.hue = input.hue;
      }
      if (input.isWhite !== undefined) {
        star.isWhite = input.isWhite;
      }
      if (input.solarMass) {
        star.solarMass = input.solarMass;
      }
      if (input.temperature) {
        star.temperature = input.temperature;
      }
      pubsub.publish.plugin.starmap.get({
        pluginId: input.pluginId,
        solarSystemId: solarSystem.name,
      });
      return star;
    }),
});
