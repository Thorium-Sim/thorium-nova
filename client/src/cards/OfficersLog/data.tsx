import {DataContext} from "server/src/utils/DataContext";

export const subscriptions = {
  officersLog(context: DataContext, publishParams: {clientId: string}) {
    if (publishParams && context.clientId !== publishParams.clientId)
      throw null;

    return context.flightClient?.officersLog || [];
  },
};
