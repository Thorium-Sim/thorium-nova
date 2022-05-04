import {getShipSystem} from "client/src/utils/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  ship(context: DataContext) {
    return context.ship?.toJSON();
  },
  impulseEngines(context: DataContext) {
    return getShipSystem(context, "impulseEngines");
  },
};
