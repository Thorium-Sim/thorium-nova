import fastify from "fastify";
import cookies from "@fastify/cookie";
import staticServe from "@fastify/static";
import cors from "@fastify/cors";
import path from "path";
import {thoriumPath, rootPath} from "../utils/appPaths";
import {promises as fs, createWriteStream} from "fs";
import {pipeline} from "stream/promises";
import uniqid from "@thorium/uniqid";
import os from "os";
import multipart, {MultipartFile} from "@fastify/multipart";

const isHeadless = !process.env.FORK;
export default async function buildHTTPServer({
  staticRoot = path.join(rootPath, "public"),
}: {
  staticRoot?: string;
  port?: number;
} = {}) {
  const app = fastify();

  async function onFile(part: MultipartFile) {
    const tmpdir = os.tmpdir();
    const filepath = path.join(
      tmpdir,
      uniqid("file-") + path.extname(part.filename)
    );
    // We need to differentiate between single and multiple file uploads
    if (part.fieldname.endsWith("[]")) {
      part.fields["filepath"] =
        part.fields["filepath"] ||
        ({
          ...part,
          fieldname: part.fieldname.replace("[]", ""),
          value: [],
        } as any);
      // @ts-expect-error We need to put this value on.
      part.fields[`filepath-${part.fieldname}`].value.push(filepath);
    } else {
      part.fields[`filepath-${part.fieldname}`] = {
        ...part,
        value: filepath,
      } as any;
    }
    await pipeline(part.file, createWriteStream(filepath));
  }

  await app.register(multipart, {attachFieldsToBody: true, onFile});

  let cookieSecret = process.env.COOKIE_SECRET || "";
  try {
    cookieSecret = JSON.parse(process.env.COOKIE_SECRET || "");
  } catch {}
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "PUT", "POST", "DELETE"],
  });
  await app.register(cookies, {
    secret: cookieSecret,
    prefix: "thorium",
  });

  await app.register(staticServe, {
    root: `${staticRoot}/assets`,
    prefix: "/assets",
    maxAge: "60s",
  });
  await app.register(staticServe, {
    root: `${thoriumPath}/plugins`,
    prefix: "/plugins",
    decorateReply: false,
    maxAge: "60s",
  });

  app.get("/healthcheck", async (req, reply) => {
    reply.code(200).send("OK");
  });

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
