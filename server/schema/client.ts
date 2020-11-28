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
  Subscription,
  Root,
} from "type-graphql";
import {UserInputError} from "apollo-server-errors";
import uuid from "uniqid";
import App from "../app";
import {GraphQLContext} from "../helpers/graphqlContext";
import Entity from "../helpers/ecs/entity";
import {randomNameGenerator} from "../helpers/randomNameGenerator";
import {ServerChannel} from "@geckos.io/server";
import {pubsub} from "server/helpers/pubsub";
import Station from "./station";

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

  @Field(type => String)
  name: string;

  @Field(type => ID, {nullable: true})
  shipId: string | null = null;

  @Field(type => Entity, {nullable: true})
  get ship() {
    return App.activeFlight?.ships.find(s => s.id === this.shipId);
  }

  @Field(type => ID, {nullable: true})
  stationId: string | null = null;

  @Field(type => Station, {nullable: true})
  get station() {
    return this.ship?.stationComplement?.stations.find(
      s => s.id === this.stationId
    );
  }
  // TODO: If logged into Thoriumsim.com, include that user's profile picture here
  @Field(type => String, {nullable: true})
  loginName: string | null = null;

  @Field(type => String, {nullable: true})
  offlineState: OfflineStates = null;

  @Field()
  training: boolean = false;

  @Field()
  connected: boolean = false;

  channel!: ServerChannel;
  constructor(params: Partial<Client> = {}) {
    this.id = params.id || uuid();
    this.name = params.name || randomNameGenerator();
    this.connected = params.connected || false;
  }
  connect() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
  setShip(shipId: string | null) {
    this.shipId = shipId;
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
  // setTraining(training: boolean) {
  //   this.training = training;
  // }
  // setOfflineState(state: OfflineStates) {
  //   this.offlineState = state;
  // }
  // reset(hardReset = false) {
  //   this.setTraining(false);
  //   this.logout();

  //   this.setOfflineState(null);
  //   if (hardReset) {
  //     this.setShip(null);
  //   }
  // }
}

@Resolver(Client)
export class ClientResolver {
  @Query(returns => Client, {name: "client"})
  async clientQuery(
    @Arg("id", type => ID, {nullable: true}) id: string,
    @Ctx() context: GraphQLContext
  ) {
    const client = App.storage.clients.find(
      c => c.id === id || (!id && c.id === context.clientId)
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
    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }

  @Mutation(returns => Client)
  clientDisconnect(@Ctx() context: GraphQLContext): Client | undefined {
    let client = App.storage.clients.find(c => c.id === context.clientId);

    client?.disconnect();
    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }
  @Mutation(returns => Client)
  clientSetShip(
    @Ctx() context: GraphQLContext,
    @Arg("shipId", type => ID, {nullable: true}) shipId: string | null,
    @Arg("clientId", type => ID, {nullable: true}) clientId: string | null
  ): Client | undefined {
    // Validate that this ship is on the flight.
    if (shipId && !App.activeFlight?.ships.find(s => s.id === shipId)) {
      throw new UserInputError("Selected Ship is not present on the flight.");
    }
    let client = App.storage.clients.find(c =>
      clientId ? c.id === clientId : c.id === context.clientId
    );

    client?.setShip(shipId);
    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }
  @Mutation(returns => Client)
  clientSetStation(
    @Ctx() context: GraphQLContext,
    @Arg("stationId", type => ID, {nullable: true}) stationId: string | null,
    @Arg("clientId", type => ID, {nullable: true}) clientId: string | null
  ): Client | undefined {
    let client = App.storage.clients.find(c =>
      clientId ? c.id === clientId : c.id === context.clientId
    );
    if (!client?.shipId && stationId) {
      throw new UserInputError(
        "Client must be assigned to a ship before assigning a station."
      );
    }
    if (
      stationId &&
      !client?.ship?.stationComplement?.stations.find(s => s.id === stationId)
    ) {
      throw new UserInputError(
        "Selected Station is not present on the client's assigned ship."
      );
    }

    client?.setStation(stationId);
    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }
  @Mutation(returns => Client)
  clientLogin(
    @Ctx() context: GraphQLContext,
    @Arg("loginName", type => String, {nullable: true}) loginName: string
  ): Client | undefined {
    let client = App.storage.clients.find(c => c.id === context.clientId);

    client?.login(loginName);

    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }
  @Mutation(returns => Client)
  clientLogout(@Ctx() context: GraphQLContext): Client | undefined {
    let client = App.storage.clients.find(c => c.id === context.clientId);

    client?.logout();

    pubsub.publish("clients", {clients: App.storage.clients});
    if (client) {
      pubsub.publish("client", {client, clientId: client.id});
    }
    return client;
  }
  @Mutation(returns => Client)
  clientSetName(
    @Arg("id", type => ID, {nullable: true}) id: string | null,
    @Arg("name", type => String) name: string,
    @Ctx() context: GraphQLContext
  ): Client | undefined {
    let client = App.storage.clients.find(
      c => c.id === (id || context.clientId)
    );
    if (!client) throw new Error("Cannot find client record.");
    client.name = name;

    pubsub.publish("clients", {clients: App.storage.clients});
    pubsub.publish("client", {client, clientId: client.id});
    return client;
  }
  @Subscription(returns => Client, {
    topics: ({
      args: {clientId},
      context,
    }: {
      args: {clientId: string};
      context: GraphQLContext;
    }) => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {
          clientId: clientId || context.clientId,
          client: App.storage.clients.find(
            c => c.id === (clientId || context.clientId)
          ),
        });
      });
      return [id, "client"];
    },
    filter: ({
      payload,
      args: {clientId},
      context,
    }: {
      context: GraphQLContext;
      payload: {clientId: string};
      args: {clientId: string | null};
    }) => {
      return payload.clientId === (clientId || context.clientId);
    },
  })
  async client(
    @Root() payload: {client: Client},
    @Arg("clientId", type => ID, {nullable: true}) clientId: string | null
  ) {
    return payload.client;
  }
  @Subscription(returns => [Client], {
    topics: () => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {
          clients: App.storage.clients.filter(c => c.connected),
        });
      });
      return [id, "clients"];
    },
  })
  async clients(@Root() payload: {clients: Client[]}) {
    return payload.clients;
  }
}
