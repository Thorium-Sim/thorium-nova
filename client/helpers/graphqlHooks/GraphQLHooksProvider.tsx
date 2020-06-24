import React from "react";
import {SubscriptionClient} from "subscriptions-transport-ws";

export const GraphQLHooksContext = React.createContext<SubscriptionClient>(
  (null as unknown) as SubscriptionClient,
);

export const GraphQLHooksProvider: React.FC<{client: SubscriptionClient}> = ({
  client,
  children,
}) => {
  return (
    <GraphQLHooksContext.Provider value={client}>
      {children}
    </GraphQLHooksContext.Provider>
  );
};
