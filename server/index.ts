import init from "./startup/init";
import bonjour from "./startup/bonjour";
import setupServer from "./startup/server";
import setupClientServer from "./startup/clientServer";
import App from "./app";
import setupApollo from "./startup/apollo";
import setupHttpServer from "./startup/httpServer";

// We should change this so it can be dynamically set
async function startUp() {
  await init();
  App.init();
  await bonjour(App.port, App.httpOnly);
  const server = await setupServer();
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
}

startUp();
