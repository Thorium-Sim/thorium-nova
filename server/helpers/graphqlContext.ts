import Client from "../schema/client";
import Flight from "../schema/flight";
import Entity from "./ecs/entity";

export interface GraphQLContext {
  clientId: string;
  client?: Client;
  flight?: Flight;
  ship?: Entity;
}
