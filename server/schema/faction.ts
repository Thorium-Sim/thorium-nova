import App from "server/app";
import Entity from "server/helpers/ecs/entity";

export function getAnyFaction(factionId: string) {
  return App.plugins.reduce((acc: Entity[], p) => {
    const faction = p.factions.find(o => o.id === factionId);
    if (faction) {
      faction.pluginId = p.id;
      acc.push(faction);
    }
    return acc;
  }, [])[0];
}
