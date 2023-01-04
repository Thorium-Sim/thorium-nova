import {t} from "@server/init/t";
import {FlightStartingPoint} from "@server/utils/types";

export const mission = t.router({
  startingPoints: t.procedure.request(({ctx}) => {
    return ctx.server.plugins.reduce(
      (points: FlightStartingPoint[], plugin) => {
        if (!plugin.active) return points;

        return points.concat(
          plugin.aspects.solarSystems.flatMap(solarSystem => {
            const planets = solarSystem.planets.map(planet => ({
              pluginId: plugin.id,
              solarSystemId: solarSystem.name,
              objectId: planet.name,
              type: "planet" as const,
            }));
            // TODO May 17, 2022 - Make permanent ships available as starting points.
            return planets;
          })
        );
      },
      []
    );
  }),
});
