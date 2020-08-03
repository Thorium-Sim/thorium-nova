import init from "./startup/init";
import bonjour from "./startup/bonjour";
import setupServer from "./startup/server";
import setupClientServer from "./startup/clientServer";
import App from "./app";
import setupApollo from "./startup/apollo";
import setupHttpServer from "./startup/httpServer";
import setupUDP from "./startup/udp";

// We should change this so it can be dynamically set
export async function startUp() {
  try {
    await init();
    await App.init();
    const {bonjour: bj, service} = await bonjour(App.port, App.httpOnly);
    const server = await setupServer();
    /* istanbul ignore next */
    if (process.env.NODE_ENV === "production") {
      await setupClientServer(server);
    }
    const apollo = await setupApollo(server);
    const httpServer = await setupHttpServer(
      server,
      apollo,
      App.port,
      App.httpOnly,
    );
    setupUDP(httpServer);

    return {
      App,
      server,
      apollo,
      httpServer,
      bonjour: bj,
      bonjourService: service,
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
