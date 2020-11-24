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

    const httpServer = App.startHttpServer();

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
