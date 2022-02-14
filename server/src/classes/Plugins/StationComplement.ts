import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import BasePlugin from ".";
import Station from "../Station";
import {Aspect} from "./Aspect";

export default class StationComplementPlugin extends Aspect {
  apiVersion = "stations/v1" as const;
  kind = "stationComplements" as const;
  name!: string;
  hasShipMap!: boolean;
  stations!: Station[];
  get stationCount() {
    return this.stations.length;
  }
  assets!: Record<string, string>;
  constructor(params: Partial<StationComplementPlugin>, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || "New Station Complement",
      plugin.aspects.stationComplements.map(station => station.name)
    );
    super({...params, name}, {kind: "stationComplements"}, plugin);
    this.stations = this.stations || params.stations || [];
    this.hasShipMap = this.hasShipMap || params.hasShipMap || false;
    this.assets = this.assets || params.assets || {};

    this.assets = this.stations.reduce((assets, station) => {
      const cardIcons = station.cards.reduce(
        (icons: Record<string, string>, card) => {
          if (card.icon) {
            icons[`${station.name}-${card.name}-icon`] = card.icon;
          }
          return icons;
        },
        {}
      );

      return {
        ...assets,
        [`${station.name}-logo`]: station.logo,
        ...cardIcons,
      };
    }, {});
  }
  toJSON() {
    return {
      ...super.toJSON(),
      stationCount: this.stationCount,
    };
  }
}
