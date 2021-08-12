import {FlightClient, ServerClient} from "../classes/Client";
import {ServerDataModel} from "../classes/ServerDataModel";
import {FlightDataModel} from "../classes/FlightDataModel";

/**
 * An instance of this class is available in every input and subscription handler
 * You can use getters to provide convenient computed data
 */

export class DataContext {
  constructor(
    public clientId: string,
    public database: {server: ServerDataModel; flight: FlightDataModel | null}
  ) {
    // Let's generate a client if it doesn't already exist in the database
    const client = database.server.clients[clientId];
    if (!client) {
      database.server.clients[clientId] = new ServerClient({id: clientId});
    }
  }
  get server() {
    return this.database.server;
  }
  get flight() {
    return this.database.flight;
  }
  set flight(flight: FlightDataModel | null) {
    this.database.flight = flight;
  }
  get client() {
    return this.database.server.clients[this.clientId];
  }
}
