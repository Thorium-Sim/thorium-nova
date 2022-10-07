import StarPlugin from "server/src/classes/Plugins/Universe/Star";
import {SpectralTypes, starTypes} from "server/src/spawners/starTypes";
import {DataContext} from "server/src/utils/DataContext";
import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {randomFromRange} from "server/src/utils/randomFromRange";
import {getPlugin} from "../utils";

function getSolarSystem(
  context: DataContext,
  pluginId: string,
  solarSystemId: string
) {
  const plugin = getPlugin(context, pluginId);
  const solarSystem = plugin.aspects.solarSystems.find(
    solarSystem => solarSystem.name === solarSystemId
  );
  if (!solarSystem) {
    throw new Error(`No solar system found with id ${solarSystemId}`);
  }
  return solarSystem;
}

const ALPHABET = "ABC";

/**
 * The distance between stars in the same system.
 */
const STAR_DISTANCE = 6;

export const starPluginInputs = {
  pluginStarCreate(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      spectralType: SpectralTypes;
    }
  ) {
    inputAuth(context);
    const solarSystem = getSolarSystem(
      context,
      params.pluginId,
      params.solarSystemId
    );
    const childrenStars = solarSystem.stars;

    const starType = starTypes.find(
      s => s.spectralType === params.spectralType
    );
    if (solarSystem.stars.length >= 3) {
      throw new Error(`Only 3 stars are allowed`);
    }

    if (!starType) {
      throw new Error(`Invalid spectral type: ${params.spectralType}`);
    }

    // Let's assume that there are fewer than 3 stars in the system.
    const name = `${solarSystem.name} ${ALPHABET[solarSystem.stars.length]}`;

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
        spectralType: params.spectralType,
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

    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: solarSystem.name,
    });

    return star;
  },
  pluginStarDelete(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      starId: string;
    }
  ) {
    inputAuth(context);
    const solarSystem = getSolarSystem(
      context,
      params.pluginId,
      params.solarSystemId
    );
    const star = solarSystem.stars.find(s => s.name === params.starId);
    if (!star) {
      throw new Error(`No star found with id ${params.starId}`);
    }
    solarSystem.stars = solarSystem.stars.filter(s => s !== star);
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: solarSystem.name,
    });
    return star;
  },

  pluginStarUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      starId: string;
      name?: string;
      radius?: number;
      age?: number;
      hue?: number;
      isWhite?: boolean;
      solarMass?: number;
      temperature?: number;
    }
  ) {
    inputAuth(context);
    const solarSystem = getSolarSystem(
      context,
      params.pluginId,
      params.solarSystemId
    );
    const star = solarSystem.stars.find(s => s.name === params.starId);
    if (!star) {
      throw new Error(`No star found with id ${params.starId}`);
    }
    if (params.name) {
      star.name = generateIncrementedName(
        params.name,
        solarSystem.planets
          .map(p => p.name)
          .concat(solarSystem.stars.map(star => star.name))
          .concat(solarSystem.name)
      );
    }
    if (params.radius) {
      star.radius = params.radius;
    }
    if (params.age) {
      star.age = params.age;
    }
    if (params.hue) {
      star.hue = params.hue;
    }
    if (params.isWhite !== undefined) {
      star.isWhite = params.isWhite;
    }
    if (params.solarMass) {
      star.solarMass = params.solarMass;
    }
    if (params.temperature) {
      star.temperature = params.temperature;
    }
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: solarSystem.name,
    });
    return star;
  },
};
