import {pubsub} from "../utils/pubsub";
import {DataContext} from "../utils/DataContext";

export const clientInputs = {
  clientSetName: (context: DataContext, params: {name: string}) => {
    if (!params.name) throw new Error("name is a required parameter.");
    if (typeof params.name !== "string")
      throw new Error("name must be a string.");
    if (!params.name.trim()) throw new Error("name cannot be blank.");
    context.server.clients[context.clientId].name = params.name;
    pubsub.publish("clientList");
    pubsub.publish("client", {clientId: context.clientId});

    return {
      clientId: context.clientId,
      name: params.name,
    };
  },
  clientSetStation: (
    context: DataContext,
    params: {shipId: number | null; stationId: string; clientId?: string}
  ) => {
    let flightClient = context.flightClient;
    if (!flightClient) {
      // TODO November 18, 2021 - Check to see if the client is the host of the flight.
      // This will probably involve checking their Thorium account or associating their
      // client ID with the flight somehow.
      // For now, we'll just allow anyone to change anyone else's station.
      let isHost = true;

      if (!isHost || !params.clientId) {
        throw new Error("No flight has been started.");
      }
      flightClient = context.findFlightClient(params.clientId);
      if (!flightClient) {
        throw new Error("No flight has been started.");
      }
    }

    // If shipId is null, we're removing ourselves from the flight.
    if (!params.shipId) {
      flightClient.stationId = null;
      flightClient.shipId = null;

      return flightClient;
    }
    const ship = context.flight?.ships.find(ship => ship.id === params.shipId);
    if (!ship) {
      throw new Error("No ship with that ID exists.");
    }
    const station = ship.components.stationComplement?.stations.find(
      station => station.name === params.stationId
    );
    if (!station) {
      throw new Error("No station with that ID exists.");
    }
    flightClient.stationId = params.stationId;
    flightClient.shipId = params.shipId;

    pubsub.publish("clientList");
    pubsub.publish("client", {clientId: context.clientId});

    return flightClient;
  },
};
