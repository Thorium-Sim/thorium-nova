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
  clientDisconnect: (context: DataContext, params: {nothing: "hi"}) => {
    return "goodbye" as const;
  },
};
