import init from "./startup/init";
import setupServer from "./startup/server";
import setupClientServer from "./startup/clientServer";
import App from "./app";
import setupApollo from "./startup/apollo";

// We should change this so it can be dynamically set
export async function startUp() {
  try {
    await init();

    await App.init();

    if (!App.servers.express) {
      const server = await setupServer();
      /* istanbul ignore next */
      if (process.env.NODE_ENV === "production") {
        await setupClientServer(server);
      }
      App.servers.express = server;
    }
    if (!App.servers.apollo) {
      if (!App.servers.express) {
        throw new Error(
          "Express server didn't start up. This should never happen."
        );
      }
      App.servers.apollo = await setupApollo(App.servers.express);
    }

    const httpServer = await App.startHttpServer();

    return {
      App,
      server: App.servers.express,
      apollo: App.servers.apollo,
      httpServer,
    };
  } catch (err) {
    /* istanbul ignore next */
    console.error("An error ocurred during startup:");
    /* istanbul ignore next */
    console.error(err);
  }
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== "test") {
  startUp();
}
