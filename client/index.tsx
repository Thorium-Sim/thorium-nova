import React from "react";
import {render} from "react-dom";
import ClientApp from "./App";
import {initializeClient} from "./helpers/getClientId";
import {GraphQLHooksProvider} from "./helpers/graphqlHooks";
import client from "./helpers/graphqlClient";
import {ThemeProvider} from "@chakra-ui/core";

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
      <ThemeProvider>
        <ClientApp />
      </ThemeProvider>
    </GraphQLHooksProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
