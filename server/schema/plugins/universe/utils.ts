import App from "server/app";
import {pubsub} from "server/helpers/pubsub";
import UniverseTemplate from "server/schema/universe";

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
