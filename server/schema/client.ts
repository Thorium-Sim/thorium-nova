import {
  ObjectType,
  Field,
  ID,
  ResolverInterface,
  Resolver,
  Query,
  Arg,
  Mutation,
} from "type-graphql";
import {UserInputError} from "apollo-server-errors";
import uuid from "uniqid";
import App from "../app";
@ObjectType()
export default class Client {
  @Field(type => ID)
  id: string;

  @Field()
  connected: Boolean = false;
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
}

@Resolver(Client)
export class ClientResolver {
  @Query(returns => Client)
  async client(@Arg("id", type => ID) id: string) {
    const client = App.storage.clients.find(c => c.id === id);
    if (client === undefined) {
      throw new UserInputError(id);
    }
    return client;
  }

  @Mutation(returns => Client)
  clientConnect(@Arg("id", type => ID) clientId: string): Client {
    let client = App.storage.clients.find(c => c.id === clientId);
    if (!client) {
      client = new Client({id: clientId});
      App.storage.clients.push(client);
    }
    client.connect();

    return client;
  }

  @Mutation(returns => Client)
  clientDisconnect(
    @Arg("id", type => ID) clientId: string,
  ): Client | undefined {
    let client = App.storage.clients.find(c => c.id === clientId);

    client?.disconnect();

    return client;
  }
}
