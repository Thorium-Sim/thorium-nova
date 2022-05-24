import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";

export const requests = {
  officersLog(
    context: DataContext,
    params: {},
    publishParams: {clientId: string}
  ) {
    if (publishParams && context.clientId !== publishParams.clientId)
      throw null;

    return context.flightClient?.officersLog || [];
  },
};

export const inputs = {
  officersLogAdd(
    context: DataContext,
    params: {message: string; timestamp: number}
  ) {
    const {message, timestamp = Date.now()} = params;

    context.flightClient?.officersLog.push({
      message,
      timestamp,
    });

    pubsub.publish("officersLog", {
      clientId: context.clientId,
    });
  },
};
