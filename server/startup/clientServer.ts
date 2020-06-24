import path from "path";
import express, {Application} from "express";

const staticPath = path.resolve(path.dirname(process.argv[1]), "..");

export default async function setupClientServer(server: Application) {
  server.use(express.static(staticPath));

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
