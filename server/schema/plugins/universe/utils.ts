import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import UniverseTemplate from "server/schema/universe";
import {Field, ObjectType} from "type-graphql";

export function publish(universe: UniverseTemplate) {
  pubsub.publish("templateUniverses", {
    id: universe.id,
    universes: App.plugins.universes,
  });
  pubsub.publish("templateUniverse", {
    id: universe.id,
    universe,
  });
}
export function getUniverse(id: string) {
  const universe = App.plugins.universes.find(u => u.id === id);
  if (!universe) {
    throw new Error("Unable to find that universe.");
  }
  return universe;
}

@ObjectType()
export class PlanetarySystem extends Entity {
  universeId!: string;

  @Field(type => [Entity], {
    description: "The objects that inhabit this system",
  })
  items: Entity[] = [];

  constructor(params: Partial<PlanetarySystem> & {universeId: string}) {
    super(params);
    this.universeId = params.universeId;
  }
}

export function getSystem(
  id: string,
  systemId: string,
  optimizeUniverse?: UniverseTemplate
) {
  const universe = optimizeUniverse || getUniverse(id);
  const system = universe.entities.find(s => s.id === systemId);
  if (!system) {
    throw new Error("System does not exist");
  }
  return {
    universe,
    system: new PlanetarySystem({...system, universeId: universe.id}),
  };
}

export function getSystemObject(id: string, objectId: string) {
  const universe = getUniverse(id);
  const object = universe.entities.find(s => s.id === objectId);
  if (!object) {
    throw new Error("Object does not exist");
  }

  if (!object.satellite?.parentId) {
    throw new Error("System does not exist");
  }
  const {system} = getSystem(id, object.satellite.parentId, universe);

  return {universe, object, system};
}

// Astronomical units in KM
export const AU = 149597870;

export function removeUniverseObject(
  universe: UniverseTemplate,
  objectId: string
) {
  // Remove any other object inside this object.
  universe.entities.forEach(o => {
    if (o.satellite?.parentId === objectId) {
      removeUniverseObject(universe, o.id);
    }
  });
  universe.entities = universe.entities.filter(e => {
    if (e.id === objectId) {
      return false;
    }
    return true;
  });
}

export function objectPublish(
  universe: UniverseTemplate,
  object: Entity,
  system?: Entity
) {
  publish(universe);
  if (system) {
    pubsub.publish("templateUniverseSystem", {id: system.id, system});
  }
  pubsub.publish("templateUniverseObject", {
    id: object.id,
    universeId: universe.id,
    object,
  });
  return object;
}
