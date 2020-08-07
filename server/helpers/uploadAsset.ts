import {GraphQLUpload, FileUpload} from "graphql-upload";
import fs from "fs";

export default function uploadAsset(
  file: FileUpload,
  pathPrefix: string,
  name?: string
) {
  return new Promise((resolve, reject) => {
    const assetPath = `${pathPrefix}/${name || file.filename}`;
    const readStream = file.createReadStream();
    /* istanbul ignore else */
    if (!readStream && process.env.NODE_ENV === "test") {
      resolve();
    } else if (!readStream) {
      reject("Error creating read stream");
    }
    /* istanbul ignore next */
    return readStream
      .pipe(fs.createWriteStream(assetPath))
      .on("finish", () => {
        resolve();
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
}
