import {
  ObjectType,
  Field,
  ID,
  ResolverInterface,
  Resolver,
  Query,
  Arg,
  Mutation,
  Ctx,
} from "type-graphql";
import {UserInputError} from "apollo-server-errors";
import uuid from "uniqid";
import App from "../app";
import {GraphQLContext} from "s/helpers/graphqlContext";

type OfflineStates =
  | "blackout"
  | "offline"
  | "power"
  | "lockdown"
  | "maintenance"
  | null;
@ObjectType()
export default class Client {
  @Field(type => ID)
  id: string;

  @Field(type => ID, {nullable: true})
  flightId: string | null = null;

  @Field(type => ID, {nullable: true})
  simulatorId: string | null = null;

  @Field(type => ID, {nullable: true})
  stationId: string | null = null;

  @Field(type => String, {nullable: true})
  loginName: string | null = null;

  @Field(type => String, {nullable: true})
  offlineState: OfflineStates = null;

  @Field()
  training: boolean = false;

  @Field()
  connected: boolean = false;
  constructor(params: Partial<Client> = {}) {
    this.id = params.id || uuid();
    this.connected = params.connected || false;
  }
  connect() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
  setFlight(flightId: string | null) {
    this.flightId = flightId;
    const flight = App.activeFlight;
    this.simulatorId = null;
    this.stationId = null;
    this.logout();
    if (flight && flight.simulators.length === 1) {
      this.simulatorId = flight.simulators[0].id;
    }
  }
  setSimulator(simulatorId: string | null) {
    this.simulatorId = simulatorId;
    this.stationId = null;
    this.logout();
  }
  setStation(stationId: string | null) {
    this.stationId = stationId;
  }
  login(name: string) {
    this.loginName = name;
  }
  logout() {
    this.loginName = null;
  }
  setTraining(training: boolean) {
    this.training = training;
  }
  setOfflineState(state: OfflineStates) {
    this.offlineState = state;
  }
  reset(hardReset = false) {
    this.setTraining(false);
    this.logout();

    this.setOfflineState(null);
    if (hardReset) {
      this.setFlight(null);
    }
  }
}

@Resolver(Client)
export class ClientResolver {
  @Query(returns => Client)
  async client(
    @Arg("id", type => ID, {nullable: true}) id: string,
    @Ctx() context: GraphQLContext,
  ) {
    const client = App.storage.clients.find(
      c => c.id === id || c.id === context.clientId,
    );
    if (client === undefined) {
      throw new UserInputError(id);
    }
    return client;
  }

  @Mutation(returns => Client)
  clientConnect(@Ctx() context: GraphQLContext): Client {
    let client = App.storage.clients.find(c => c.id === context.clientId);
    if (!client) {
      client = new Client({id: context.clientId});
      App.storage.clients.push(client);
    }
    client.connect();

    return client;
  }

  @Mutation(returns => Client)
  clientDisconnect(@Ctx() context: GraphQLContext): Client | undefined {
    let client = App.storage.clients.find(c => c.id === context.clientId);

    client?.disconnect();

    return client;
  }
  @Mutation(returns => Client)
  clientSetFlight(
    @Ctx() context: GraphQLContext,
    @Arg("id", type => ID) flightId: string,
  ): Client | undefined {
    let client = App.storage.clients.find(c => c.id === context.clientId);

    client?.setFlight(flightId);

    return client;
  }
}
