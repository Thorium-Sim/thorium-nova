import {GraphQLUpload, FileUpload} from "graphql-upload";
import fs from "fs";

export default function uploadAsset(
  file: FileUpload,
  pathPrefix: string,
  name?: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (process.env.NODE_ENV === "test") return resolve();

    // Ensure the asset path exists
    await fs.promises.mkdir(pathPrefix, {recursive: true});

    const assetPath = `${pathPrefix}/${name || file.filename}`;
    const readStream = file.createReadStream();
    /* istanbul ignore else */
    if (!readStream && process.env.NODE_ENV === "test") {
      return resolve();
    } else if (!readStream) {
      return reject("Error creating read stream");
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
