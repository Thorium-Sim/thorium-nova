import {DataContext} from "../utils/DataContext";
import {pubsub} from "../utils/pubsub";

export const officerLogInputs = {
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
