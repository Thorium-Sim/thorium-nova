import bonjour from "bonjour";
import os from "os";

export default async function setupBonjour(
  port: number = 4444,
  httpOnly?: boolean
) {
  const bj = bonjour();
  const service = bj.publish({
    name: `Thorium-${os.hostname()}`,
    type: "thorium-http",
    port: port,
    txt: {https: String(process.env.NODE_ENV === "production" && !httpOnly)},
  });
  return {bonjour: bj, service};
}
