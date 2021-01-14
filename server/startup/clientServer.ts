/* istanbul ignore file */
// Since this file depends on built assets, we won't include it in test coverage
import path from "path";
import express, {Application, RequestHandler} from "express";

const staticPath = path.resolve(path.dirname(process.argv[1]), "../build");

export default async function setupClientServer(server: Application) {
  server.use(express.static(staticPath) as RequestHandler);
  server.get("*", function (req, res) {
    res.sendFile(`${staticPath}/index.html`, function (err) {
      if (err) {
        res
          .status(500)
          .end("Error loading client. Please refresh your browser.");
        return;
      }
      res.end();
    });
  });
}
