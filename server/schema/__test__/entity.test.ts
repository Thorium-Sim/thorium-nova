import {IsPlanetComponent} from "server/components/isPlanet";
import {IsShipComponent} from "server/components/isShip";
import {IsStarComponent} from "server/components/isStar";
import {PlanetarySystemComponent} from "server/components/planetarySystem";
import {TimerComponent} from "server/components/timer";
import Entity from "server/helpers/ecs/entity";
import {EntityTypes, getEntityType} from "../ecs";

describe("entity", () => {
  describe("getEntityType", () => {
    it("should return the correct entity type for an entity with certain components", () => {
      const system = new Entity(null, [PlanetarySystemComponent]);
      expect(getEntityType(system)).toEqual(EntityTypes.system);

      const planet = new Entity(null, [IsPlanetComponent]);
      expect(getEntityType(planet)).toEqual(EntityTypes.planet);

      const star = new Entity(null, [IsStarComponent]);
      expect(getEntityType(star)).toEqual(EntityTypes.star);

      const ship = new Entity(null, [IsShipComponent]);
      expect(getEntityType(ship)).toEqual(EntityTypes.ship);

      const timer = new Entity(null, [TimerComponent]);
      expect(getEntityType(timer)).toEqual(EntityTypes.timer);

      try {
        const unknown = new Entity(null, []);
        getEntityType(unknown);
      } catch (err) {
        expect(err.message).toEqual(
          "Unknown entity type for entity. Check the logs."
        );
      }
    });
  });
});
