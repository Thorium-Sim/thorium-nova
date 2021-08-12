import fastify from "fastify";
import cookies from "fastify-cookie";
import staticServe from "fastify-static";
import cors from "fastify-cors";
import path from "path";
import {promises as fs} from "fs";

export default function buildHTTPServer({
  staticRoot = path.join(__dirname, "public"),
  isHeadless = false,
}: {
  staticRoot?: string;
  isHeadless?: boolean;
  port?: number;
} = {}) {
  // TODO: Enable HTTPS
  const app = fastify({});

  let cookieSecret = process.env.COOKIE_SECRET || "";
  try {
    cookieSecret = JSON.parse(process.env.COOKIE_SECRET || "");
  } catch {}
  app.register(cors, {
    origin: "*",
    methods: ["GET", "PUT", "POST", "DELETE"],
  });
  app.register(cookies, {
    secret: cookieSecret,
    prefix: "thorium",
  });

  app.register(staticServe, {root: `${staticRoot}/assets`, prefix: "/assets"});

  app.get("/*", async (_req, reply) => {
    // Return a slightly different index.html for headless servers.
    // SPAs in normal mode should render the client assignment screen.
    // index.html in headless mode assigns `window.isHeadless`, and the
    // SPA uses that to know to render a screen to start a new flight or
    // load an existing flight.
    let indexFile = await fs.readFile(
      path.join(staticRoot, "index.html"),
      "utf-8"
    );
    indexFile = indexFile.replace(
      "<body>",
      `<body>
  <script>window.isHeadless = ${isHeadless};</script>\n`
    );
    return reply.code(200).header("content-type", "text/html").send(indexFile);
  });

  return app;
}
