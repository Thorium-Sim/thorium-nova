import React from "react";
import {render} from "react-dom";
import ClientApp from "./App";
import {initializeClient} from "./helpers/getClientId";
import {ThemeProvider, DarkMode} from "@chakra-ui/core";
import Dialog from "./components/Dialog";
import {ApolloProvider} from "@apollo/client";
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
    <ApolloProvider client={client}>
      <ThemeProvider>
        <DarkMode>
          <Dialog>
            <ClientApp />
          </Dialog>
        </DarkMode>
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
