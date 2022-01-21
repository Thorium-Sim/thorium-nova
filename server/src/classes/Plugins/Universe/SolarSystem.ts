import systemNames from "server/src/spawners/systemNames";
import {UNIVERSE_RADIUS} from "server/src/utils/constants";
import {randomFromList} from "server/src/utils/randomFromList";
import {AstronomicalUnit, LightMinute} from "server/src/utils/unitTypes";
import BasePlugin from "..";
import {Aspect} from "../Aspect";

export default class SolarSystemPlugin extends Aspect {
  apiVersion = "solarSystem/v1" as const;
  kind = "solarSystems" as const;
  name: string;
  description: string;

  /**
   * Position of the solar system in the universe. Measured in light minutes.
   */
  position: {
    x: LightMinute;
    y: LightMinute;
    z: LightMinute;
  };

  tags: string[];

  /**
   * The inner radius of the habitable zone of the system in AU.
   */
  habitableZoneInner: AstronomicalUnit;
  /**
   * The outer radius of the habitable zone of the system in AU.
   */
  habitableZoneOuter: AstronomicalUnit;
  /**
   * A string key that is used to procedurally generate the nebula skybox background in this system in the viewscreen.
   */
  skyboxKey: string;
  assets = {};

  constructor(params: Partial<SolarSystemPlugin>, plugin: BasePlugin) {
    const starNames = plugin.aspects.solarSystems.map(s => s.name);
    const availableNames = systemNames.filter(val => !starNames.includes(val));

    const name = randomFromList(availableNames) || "Bob"; // If this happens, I'll laugh very hard.

    super({name, ...params}, {kind: "solarSystems"}, plugin);
    this.name = name;
    this.description = `A solar system named ${name}`;

    this.position = params.position || {
      x: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
      y: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
      z: UNIVERSE_RADIUS * 2 * (Math.random() - 0.5),
    };

    this.tags = params.tags || [];

    this.habitableZoneInner = params.habitableZoneInner || 0.9;
    this.habitableZoneOuter = params.habitableZoneOuter || 3.0;
    this.skyboxKey = params.skyboxKey || "Random Key";
  }
}
