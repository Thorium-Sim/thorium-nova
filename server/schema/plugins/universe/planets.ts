import {IdentityComponent} from "server/components/identity";
import {SatelliteComponent} from "server/components/satellite";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Resolver,
  Root,
} from "type-graphql";
import {planetTypes, PlanetType} from "./planetTypes";
import {
  getSystem,
  getSystemObject,
  getPlugin,
  objectPublish,
  publish,
} from "./utils";
import {toRoman} from "roman-numerals";
import {IsPlanetComponent} from "server/components/isPlanet";
import getHabitableZone from "server/generatorFixtures/habitableZone";
import {randomFromList} from "server/helpers/randomFromList";
import {PopulationComponent} from "server/components/population";
import {AU} from "./utils";
import {FileUpload, GraphQLUpload} from "graphql-upload";
import {appStoreDir} from "server/helpers/appPaths";
import uploadAsset from "server/helpers/uploadAsset";
import {GraphQLContext} from "server/helpers/graphqlContext";

type range = {min: number; max: number};
function randomFromRange({min, max}: range) {
  return Math.random() * (max - min) + min;
}

function createPlanet({
  distance,
  parentId,
  planetType,
  name,
}: {
  distance: number;
  parentId: string;
  planetType: PlanetType;
  name: string;
}) {
  const entity = new Entity(null, [
    TagsComponent,
    IdentityComponent,
    IsPlanetComponent,
    TemperatureComponent,
    SatelliteComponent,
    PopulationComponent,
  ]);
  entity.updateComponent("identity", {name});
  entity.updateComponent("satellite", {
    axialTilt: Math.round(randomFromRange({min: 0, max: 45}) * 10) / 10,
    distance,
    orbitalArc: Math.round(Math.random() * 360),
    eccentricity: Math.round(Math.random() * 0.2 * 100) / 100,
    showOrbit: true,
    parentId,
  });
  entity.updateComponent("isPlanet", {
    age: Math.round(randomFromRange(planetType.ageRange)),
    classification: planetType.classification,
    radius: Math.round(randomFromRange(planetType.radiusRange)),
    terranMass:
      Math.round(randomFromRange(planetType.terranMassRange) * 100) / 100,
    habitable: planetType.habitable,
    lifeforms: randomFromList(planetType.lifeforms),
    textureMapAsset: randomFromList(planetType.possibleTextureMaps),
    cloudsMapAsset:
      planetType.hasClouds <= Math.random()
        ? randomFromList(planetType.possibleCloudMaps)
        : "",
    ringsMapAsset:
      planetType.hasRings <= Math.random()
        ? randomFromList(planetType.possibleRingMaps)
        : "",
  });

  entity.updateComponent("population", {
    count:
      typeof planetType.population === "number"
        ? planetType.population
        : Math.round(randomFromRange(planetType.population) / 1000) * 1000,
  });
  entity.updateComponent("temperature", {
    temperature: Math.round(randomFromRange(planetType.temperatureRange)),
  });

  return entity;
}

@Resolver()
export class UniversePluginPlanetsResolver {
  @Mutation(returns => Entity)
  async pluginUniverseAddPlanet(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("classification", type => String)
    classification: string
  ) {
    const {plugin, system} = getSystem(id, systemId);
    const childrenPlanets = plugin.universe.filter(
      s => s.satellite?.parentId === systemId && s.isPlanet
    );

    const planetType = planetTypes.find(
      s => s.classification === classification
    );

    if (!planetType) {
      throw new Error(`Invalid planet classification: ${classification}`);
    }

    const name = `${system?.components?.identity?.name} ${toRoman(
      childrenPlanets.length + 1
    )}`;

    // Just less than the orbit of Neptune 🥶
    const maxPlanetDistance = 4000000000;

    // 1/5 the orbit of Mercury 🥵
    const minPlanetDistance = 10000000;

    // We'll do a messy thing with the habitable zone where we just the habitable zone values together
    const stars = plugin.universe.filter(
      s => s.satellite?.parentId === systemId && s.isStar
    );

    // We'll use the habitable zone radius of the largest star
    const biggestStar = stars.reduce((prev: Entity | null, next) => {
      if (!prev || !prev.isStar) return next;
      if (!next.isStar) return prev;
      if (next.isStar.radius > prev.isStar.radius) return next;
      return prev;
    }, null);

    let habitableZone = {min: minPlanetDistance, max: maxPlanetDistance};
    if (biggestStar?.isStar && biggestStar.temperature) {
      const tempZone = getHabitableZone(
        biggestStar.isStar?.radius,
        biggestStar.temperature?.temperature
      );
      habitableZone = {
        min: Math.max(tempZone.min * AU, minPlanetDistance),
        max: Math.min(tempZone.max * AU, maxPlanetDistance),
      };
    }
    let distance = 0;
    const zone = randomFromList(planetType.systemZone);
    if (zone === "hot") {
      distance = Math.round(
        randomFromRange({min: minPlanetDistance, max: habitableZone.min})
      );
    }
    if (zone === "habitable") {
      distance = Math.round(randomFromRange(habitableZone));
    }
    if (zone === "cold") {
      distance = Math.round(
        randomFromRange({min: habitableZone.max, max: maxPlanetDistance})
      );
    }

    const entity = createPlanet({
      distance,
      name,
      parentId: systemId,
      planetType,
    });
    plugin.universe.push(entity);
    publish(plugin);
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
    return entity;
  }
  @Mutation(returns => Entity)
  pluginUniverseAddMoon(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("classification", type => String)
    classification: string
  ) {
    const {plugin, system, object} = getSystemObject(id, objectId);

    const planetType = planetTypes.find(
      s => s.classification === classification
    );

    if (!planetType) {
      throw new Error(`Invalid planet classification: ${classification}`);
    }

    const childrenMoons = plugin.universe.filter(
      s => s.satellite?.parentId === objectId && s.isPlanet
    );
    const name = `${object?.components?.identity?.name} ${
      [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
      ]?.[childrenMoons.length] || childrenMoons.length + 1
    }`;

    // These are random ranges loosely based on moons of Jupiter.
    const distance = randomFromRange({min: 129000, max: 664000});
    planetType.radiusRange = {min: 800, max: 1700};

    const entity = createPlanet({
      distance,
      name,
      parentId: objectId,
      planetType,
    });
    plugin.universe.push(entity);
    publish(plugin);
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
    return entity;
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetTemperature(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("temperature", {description: "The temperature of the star in Kelvin"})
    temperature: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("temperature", {temperature});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetAge(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("age", {description: "The age of the planet in years"})
    age: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {age});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetRadius(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("radius", {description: "The radius of the planet in kilometers"})
    radius: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {radius});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetTerranMass(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("terranMass", {
      description: "The mass of the planet compared to Earth",
    })
    terranMass: number
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {terranMass});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetHabitable(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("habitable", {
      description: "Whether the planet is habitable by humans.",
    })
    habitable: boolean
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {habitable});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  pluginUniversePlanetSetLifeforms(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("lifeforms", {
      description: "A text description of the lifeforms on the planet.",
    })
    lifeforms: string
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    object.updateComponent("isPlanet", {lifeforms});
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  async pluginUniversePlanetSetTexture(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("image", type => GraphQLUpload) image: FileUpload,
    @Ctx() ctx: GraphQLContext
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    ctx.pluginId = plugin.id;
    const pathPrefix = `${appStoreDir}plugins/${
      plugin.name || plugin.id
    }/assets`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    const fileName = `planet-texture-${object.id}${Math.round(
      Math.random() * 1000
    )}.${ext}`;
    await uploadAsset(image, pathPrefix, fileName);
    object.updateComponent("isPlanet", {
      textureMapAsset: fileName,
    });
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  async pluginUniversePlanetSetClouds(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("image", type => GraphQLUpload) image: FileUpload,
    @Ctx() ctx: GraphQLContext
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    ctx.pluginId = plugin.id;
    const pathPrefix = `${appStoreDir}plugins/${
      plugin.name || plugin.id
    }/assets`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    const fileName = `planet-clouds-${object.id}${Math.round(
      Math.random() * 1000
    )}.${ext}`;
    await uploadAsset(image, pathPrefix, fileName);
    object.updateComponent("isPlanet", {
      cloudsMapAsset: fileName,
    });
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  async pluginUniversePlanetSetRings(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Arg("image", type => GraphQLUpload) image: FileUpload,
    @Ctx() ctx: GraphQLContext
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    ctx.pluginId = plugin.id;
    const pathPrefix = `${appStoreDir}plugins/${
      plugin.name || plugin.id
    }/assets`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    const fileName = `planet-rings-${object.id}${Math.round(
      Math.random() * 1000
    )}.${ext}`;
    await uploadAsset(image, pathPrefix, fileName);
    object.updateComponent("isPlanet", {
      ringsMapAsset: fileName,
    });
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  async pluginUniversePlanetClearClouds(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Ctx() ctx: GraphQLContext
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    ctx.pluginId = plugin.id;
    object.updateComponent("isPlanet", {
      cloudsMapAsset: "",
    });
    return objectPublish(plugin, object, system);
  }
  @Mutation(returns => Entity)
  async pluginUniversePlanetClearRings(
    @Arg("id", type => ID)
    id: string,
    @Arg("objectId", type => ID)
    objectId: string,
    @Ctx() ctx: GraphQLContext
  ) {
    const {plugin, object, system} = getSystemObject(id, objectId);
    ctx.pluginId = plugin.id;
    object.updateComponent("isPlanet", {
      ringsMapAsset: "",
    });
    return objectPublish(plugin, object, system);
  }
}

@Resolver(of => IsPlanetComponent)
export class PlanetAssetsResolver {
  @FieldResolver(type => String)
  textureMapAsset(
    @Root() self: IsPlanetComponent,
    @Ctx() context: GraphQLContext
  ) {
    if (self.textureMapAsset?.indexOf("/assets/textures") === 0)
      return self.textureMapAsset;
    const pluginId = context.pluginId || context.entity?.pluginId;
    if (!pluginId) {
      return "";
    }
    try {
      const plugin = getPlugin(pluginId);
      return self.textureMapAsset
        ? `/assets/plugins/${plugin.name || plugin.id}/assets/${
            self.textureMapAsset
          }`
        : "";
    } catch (err) {
      return "";
    }
  }
  @FieldResolver(type => String)
  cloudsMapAsset(
    @Root() self: IsPlanetComponent,
    @Ctx() context: GraphQLContext
  ) {
    if (self.cloudsMapAsset?.indexOf("/assets/textures") === 0)
      return self.cloudsMapAsset;
    const pluginId = context.pluginId || context.entity?.pluginId;
    if (!pluginId) {
      return "";
    }
    try {
      const plugin = getPlugin(pluginId);
      return self.cloudsMapAsset
        ? `/assets/plugins/${plugin.name || plugin.id}/assets/${
            self.cloudsMapAsset
          }`
        : "";
    } catch (err) {
      return "";
    }
  }
  @FieldResolver(type => String)
  ringsMapAsset(
    @Root() self: IsPlanetComponent,
    @Ctx() context: GraphQLContext
  ) {
    if (self.ringsMapAsset?.indexOf("/assets/textures") === 0)
      return self.ringsMapAsset;
    const pluginId = context.pluginId || context.entity?.pluginId;
    if (!pluginId) {
      return "";
    }
    try {
      const plugin = getPlugin(pluginId);
      return self.ringsMapAsset
        ? `/assets/plugins/${plugin.name || plugin.id}/assets/${
            self.ringsMapAsset
          }`
        : "";
    } catch (err) {
      return "";
    }
  }
}
