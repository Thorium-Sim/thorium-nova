import fastify from "fastify";
import fastifyHttpProxy from "fastify-http-proxy";
import {readFileSync} from "fs";
import path from "path";
import {rootPath} from "../utils/appPaths";

const isHeadless = !process.env.FORK;
export function buildHttpsProxy(port: number) {
  // Create a proxy server to handle the HTTPS requests
  // All requests are proxied to the HTTP server
  const certDir =
    process.env.NODE_ENV !== "production"
      ? "../../../desktop/resources"
      : isHeadless
      ? "./resources"
      : "../../app";

  const proxy = fastify({
    https: {
      key: readFileSync(path.join(rootPath, certDir, "server.key")),
      cert: readFileSync(path.join(rootPath, certDir, "server.cert")),
    },
  });
  proxy.register(fastifyHttpProxy, {
    upstream: `http://localhost:${port}`,
  });

  return proxy;
}
