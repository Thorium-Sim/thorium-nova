/* istanbul ignore file */
import React from "react";
import {render} from "react-dom";
import ClientApp from "./App";
import {initializeClient} from "./helpers/getClientId";
import {ApolloProvider} from "@apollo/client";
import client from "./helpers/graphqlClient";
import AppContext from "./helpers/appContext";
import {BrowserRouter as Router} from "react-router-dom";
import "./helpers/i18n";

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
      <AppContext>
        <Router>
          <ClientApp></ClientApp>
        </Router>
      </AppContext>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
