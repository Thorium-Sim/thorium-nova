import {DataContext} from "server/src/utils/DataContext";

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
