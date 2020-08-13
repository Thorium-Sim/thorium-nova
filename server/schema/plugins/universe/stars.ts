import {IdentityComponent} from "server/components/identity";
import {IsStarComponent} from "server/components/isStar";
import {SatelliteComponent} from "server/components/satellite";
import {SizeComponent} from "server/components/size";
import {TagsComponent} from "server/components/tags";
import {TemperatureComponent} from "server/components/temperature";
import Entity from "server/helpers/ecs/entity";
import {Arg, ID, Mutation, Resolver} from "type-graphql";
import {starTypes} from "./starTypes";
import {getUniverse, publish} from "./utils";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
type range = {min: number; max: number};
function randomFromRange({min, max}: range) {
  return Math.random() * (max - min) + min;
}

@Resolver()
export class UniversePluginStarsResolver {
  @Mutation(returns => Entity)
  async universeTemplateAddStar(
    @Arg("id", type => ID)
    id: string,
    @Arg("systemId", type => ID)
    systemId: string,
    @Arg("spectralType", type => String)
    spectralType: string
  ) {
    const universe = getUniverse(id);
    const system = universe.entities.find(s => s.id === systemId);
    const childrenStars = universe.entities.filter(
      s => s.satellite?.parentId === systemId && s.isStar
    );

    const starType = starTypes.find(s => s.spectralType === spectralType);

    if (!system) {
      throw new Error("System does not exist");
    }
    if (!starType) {
      throw new Error(`Invalid spectral type: ${spectralType}`);
    }

    // Let's assume that there are fewer than 26 stars in the system.
    const name = `${system?.identity?.name} ${alphabet[childrenStars.length]}`;

    const entity = new Entity(null, [
      TagsComponent,
      IdentityComponent,
      IsStarComponent,
      SizeComponent,
      TemperatureComponent,
      SatelliteComponent,
    ]);
    entity.updateComponent("identity", {name});
    entity.updateComponent("satellite", {
      axialTilt: 0,
      distance: 0,
      orbitalArc: Math.random() * 360,
      eccentricity: 0,
      showOrbit: false,
      parentId: systemId,
    });
    entity.updateComponent("isStar", {
      solarMass: Math.round(randomFromRange(starType.solarMassRange) * 10) / 10,
      age: Math.round(randomFromRange(starType.ageRange)),
      spectralType: starType.spectralType,
      hue: Math.round(randomFromRange(starType.hueRange)),
      isWhite: starType.white,
    });
    entity.updateComponent("temperature", {
      temperature: Math.round(randomFromRange(starType.temperatureRange)),
    });
    entity.updateComponent("size", {
      value: Math.round(randomFromRange(starType.radiusRange)),
    });
    universe.entities.push(entity);
    publish(universe);
    return entity;
  }
}
