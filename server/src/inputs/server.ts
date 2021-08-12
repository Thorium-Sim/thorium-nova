import {StoreObject} from "@thorium/db-fs";
import {FlightDataModel} from "../classes/FlightDataModel";
import {ServerDataModel} from "../classes/ServerDataModel";
import {DataContext} from "../utils/DataContext";

export const serverInputs = {
  serverSnapshot: (context: DataContext) => {
    const server = context.server as ServerDataModel & StoreObject;
    server.writeFile(true);
    const flight = context.flight as (FlightDataModel & StoreObject) | null;
    flight?.writeFile(true);
  },
};
