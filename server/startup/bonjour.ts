import bonjour from "bonjour";
import os from "os";

export default async function setupBonjour(
  port: number = 4444,
  httpOnly?: boolean,
) {
  bonjour().publish({
    name: `Thorium-${os.hostname()}`,
    type: "thorium-http",
    port: port,
    txt: {https: String(process.env.NODE_ENV === "production" && !httpOnly)},
  });
}
