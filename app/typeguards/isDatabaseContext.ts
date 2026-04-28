import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { isObject } from "@thorium/typeguards/isObject";

export interface DatabaseContext {
	server: ServerDataModel;
	flight: FlightDataModel | null;
}

export const isDatabaseContext = (obj: unknown): obj is DatabaseContext => {
	return isObject(obj) && "server" in obj && "flight" in obj;
};
