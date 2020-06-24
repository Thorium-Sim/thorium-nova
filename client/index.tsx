import React from "react";
import {render} from "react-dom";
import App from "./App";
import {initializeClient} from "./helpers/getClientId";
import {GraphQLHooksProvider} from "./helpers/graphqlHooks";
import client from "./helpers/graphqlClient";

initializeClient();

declare global {
  interface Window {
    thorium: {clockSync: number; sendMessage: (args: unknown) => void};
  }
}

window.thorium = window.thorium || {
  sendMessage: args => {},
  clockSync: 0,
};
render(
  <React.StrictMode>
    <GraphQLHooksProvider client={client}>
      <App />
    </GraphQLHooksProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
