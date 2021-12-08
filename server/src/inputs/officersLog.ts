import {DataContext} from "../utils/DataContext";
import {pubsub} from "../utils/pubsub";

export const officerLogInputs = {
  officersLogAdd(context: DataContext, params: {message: string}) {
    const {message} = params;
    const timestamp = Date.now();

    context.flightClient?.officersLog.push({
      message,
      timestamp,
    });

    pubsub.publish("officersLog", {
      clientId: context.clientId,
    });
  },
};
