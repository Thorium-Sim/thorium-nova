import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {KilometerPerSecond} from "server/src/utils/unitTypes";
import {getShipSystem} from "./utils";

export const warpEnginesPluginInput = {
  async pluginWarpEnginesUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      interstellarCruisingSpeed?: KilometerPerSecond;
      solarCruisingSpeed?: KilometerPerSecond;
      minSpeedMultiplier?: number;
      warpFactorCount?: number;
    }
  ) {
    inputAuth(context);
    const shipSystem = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId,
      "warpEngines"
    );
    if (typeof params.minSpeedMultiplier === "number") {
      if (params.minSpeedMultiplier < 0)
        throw new Error("minSpeedMultiplier must be >= 0");
      shipSystem.minSpeedMultiplier = params.minSpeedMultiplier;
    }
    if (typeof params.interstellarCruisingSpeed === "number") {
      shipSystem.interstellarCruisingSpeed = params.interstellarCruisingSpeed;
    }
    if (typeof params.solarCruisingSpeed === "number") {
      shipSystem.solarCruisingSpeed = params.solarCruisingSpeed;
    }
    if (typeof params.warpFactorCount === "number") {
      if (params.warpFactorCount < 2)
        throw new Error("warpFactorCount must be >= 2");
      if (Math.round(params.warpFactorCount) !== params.warpFactorCount)
        throw new Error("warpFactorCount must be an integer");
      shipSystem.warpFactorCount = params.warpFactorCount;
    }

    pubsub.publish("pluginShipSystem", {
      pluginId: params.pluginId,
      systemId: params.shipSystemId,
    });

    return shipSystem;
  },
};
