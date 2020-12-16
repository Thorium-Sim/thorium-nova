import express, {RequestHandler} from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

export default async function setupServer() {
  const server = express();
  server.use(bodyParser.json({limit: "20mb"}));
  server.use("*", cors() as RequestHandler);

  if (process.env.NODE_ENV !== "production") {
    server.get("/", (req, res) => {
      res.redirect("/graphql");
    });
  }

  server.use(
    "/assets/",
    express.static(path.resolve("./data")) as RequestHandler
  );

  return server;
}
