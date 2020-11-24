import bonjour from "bonjour";

export default function setupBonjour(
  port: number = 4444,
  httpOnly?: boolean,
  tryCount = 0
): {bonjour: bonjour.Bonjour; service: bonjour.Service} {
  const bj = bonjour();

  try {
    const config = {
      name: `Thorium Nova${tryCount ? ` (${tryCount})` : ""}`,
      type: "http",
      port: port,
      txt: {https: String(process.env.NODE_ENV === "production" && !httpOnly)},
    };
    const service = bj.publish(config);
    return {bonjour: bj, service};
  } catch {
    // Thorium is likely already running on the network. Do it again with a higher try count.
    if (tryCount + 1 === 10) {
      throw new Error("Tried starting Bonjour broadcast 10 times. Closing.");
    }
    return setupBonjour(port, httpOnly, tryCount + 1);
  }
}
