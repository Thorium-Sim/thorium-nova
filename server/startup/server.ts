import express, {RequestHandler} from "express";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import os from "os";
import path from "path";

export interface MulterFile {
  key: string; // Available using `S3`.
  path: string; // Available using `DiskStorage`.
  mimetype: string;
  originalname: string;
  size: number;
}

const tmpDir = os.tmpdir();
const folder = `${tmpDir}${path.sep}`;

export default async function setupServer() {
  const upload = multer({
    dest: folder,
  });

  const server = express();
  server.use(bodyParser.json({limit: "20mb"}));
  server.use("*", cors() as RequestHandler);

  function uploadAsset(
    files: Express.Multer.File[],
    name: string,
    folderPath: string,
  ) {}

  if (process.env.NODE_ENV !== "production") {
    server.get("/", (req, res) => {
      res.redirect("/graphql");
    });
  }

  server.post("/upload", upload.any() as RequestHandler, async (req, res) => {
    if (Array.isArray(req.files)) {
      uploadAsset(req.files, req.body.name, req.body.folderPath);
      return res.end(JSON.stringify("success!"));
    }
    return res.end(JSON.stringify("failure"));
  });

  server.use(
    "/assets/",
    express.static(path.resolve("./data")) as RequestHandler,
  );

  return server;
}
