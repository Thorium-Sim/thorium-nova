import http from "http";
import https from "https";
import fs from "fs/promises";
import url from "url";
import path from "path";

import {Application} from "express";
import {ApolloServer} from "apollo-server-express";
import {thoriumPath} from "../helpers/appPaths";
import ipAddress from "../helpers/ipAddress";

export default async function setupHttpServer(
  server: Application,
  apollo: ApolloServer,
  port: number,
  httpOnly: boolean,
) {
  let httpServer: http.Server;

  let isHttps = false;
  if (process.env.NODE_ENV === "production" && !httpOnly) {
    isHttps = true;

    // Be sure to default back to the built-in cert if the
    // actual cert doesn't exist
    let key, cert;
    try {
      await fs.access(`${thoriumPath}/server.key`);
      key = fs.readFile(`${thoriumPath}/server.key`, "utf8");
      cert = fs.readFile(`${thoriumPath}/server.cert`, "utf8");
    } catch {
      key = fs.readFile(path.resolve(`${__dirname}/../server.key`), "utf8");
      cert = fs.readFile(path.resolve(`${__dirname}/../server.cert`), "utf8");
    }
    httpServer = https.createServer({key: await key, cert: await cert}, server);

    // If the port is 443, start a server at 80 to redirect to 443
    if (port === 443) {
      const insecureServer = http.createServer((req, res) => {
        const pathParts = url.parse(req.url || "");

        res.writeHead(302, {
          Location: `https://${req.headers.host}${pathParts.path}`,
        });
        res.end();
      });
      insecureServer.listen(80);
    }
  } else {
    httpServer = http.createServer(server);
  }
  apollo.installSubscriptionHandlers(httpServer);

  function printUrl({isWs = false} = {}) {
    return `${isWs ? "ws" : "http"}${isHttps ? "s" : ""}://${ipAddress}${
      (port === 443 && isHttps) || (port === 80 && !isHttps) ? "" : `:${port}`
    }`;
  }

  const serverMessage = `
Client Server running on ${printUrl()}/client
Access the Flight Director on ${printUrl()}
GraphQL Server running on ${printUrl()}/graphql
🚀 Subscriptions ready at ${printUrl({isWs: true})}${apollo.subscriptionsPath}`;

  try {
    httpServer.listen(port, () => {
      console.info(serverMessage);
    });
  } catch (err) {
    console.error("That didn't work...", err);
  }

  return httpServer;
}
