import {ShipSystemTypes} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {DataContext} from "server/src/utils/DataContext";

export function getShipSystem<Type extends keyof typeof ShipSystemTypes>(
  context: DataContext,
  type: Type
) {
  const shipSystems = context.ship?.components.shipSystems?.shipSystemIds;
  // TODO April 28, 2022 - It would be good to have a lookup table that lets you look up
  // a ship system given a ship entity and a system type, perhaps on the flight object.
  // It shouldn't be persisted to the database, but should be created whenever a ship is spawned
  // or a flight is loaded.
  const system = context.flight?.ecs.entities.filter(
    e => shipSystems?.includes(e.id) && e.components.isShipSystem?.type === type
  );

  // Do a bit of transformation to make it nicer to work with
  // TODO April 28, 2022 - We should do some TypeScript magic to make it so only the components
  // that are relevant to the specific system type are returned.
  return (
    system?.map(e => ({
      ...e.components,
      id: e.id,
    })) || []
  );
}
