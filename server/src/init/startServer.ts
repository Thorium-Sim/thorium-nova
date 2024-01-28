import type buildHTTPServer from "./httpServer";
import {buildHttpsProxy} from "./httpsProxy";
import chalk from "chalk";
import {ipAddress} from "@thorium/ipAddress";

export async function startServer(
  app: Awaited<ReturnType<typeof buildHTTPServer>>
) {
  const PORT =
    Number(process.env.PORT) ||
    (process.env.NODE_ENV === "production" ? 4444 : 3001);
  const HTTPSPort = PORT + 1;

  try {
    await app.listen({port: PORT, host: "0.0.0.0"});
    let hasHttps = false;
    if (process.env.NODE_ENV === "production") {
      const proxy = buildHttpsProxy(PORT);
      if (proxy) {
        hasHttps = true;
        await proxy.listen({port: HTTPSPort, host: "0.0.0.0"});
      }
    }
    console.info(
      chalk.greenBright(`Access app at http://${ipAddress}:${PORT}`)
    );
    console.info(
      chalk.cyan(`Doing port forwarding? Open this port in your router:`)
    );
    console.info(chalk.cyan(`  - TCP ${PORT} for web app access`));
    if (hasHttps) {
      console.info(chalk.cyan(`  - TCP ${HTTPSPort} for HTTPS access`));
    }
    process.send?.("ready");
  } catch (err) {
    process.send?.("error");
    console.error(err);
    app.log.error(err);
  }
}
