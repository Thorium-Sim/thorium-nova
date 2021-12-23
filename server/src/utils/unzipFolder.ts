import yauzl from "yauzl";
import path from "path";
import fs from "fs";
/**
 * Example:
 *
 * await unzip("./tim.zip", "./");
 *
 * Will create directories:
 *
 * ./tim.zip
 * ./tim
 *
 * @param zipPath Path to zip file.
 * @param unzipToDir Path to the folder where the zip folder will be put.
 */
export const unzip = (zipPath: string, unzipToDir: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Create folder if not exists
      fs.mkdirSync(unzipToDir, {recursive: true});

      // Same as example we open the zip.
      yauzl.open(zipPath, {lazyEntries: true}, (err, zipFile) => {
        if (!zipFile) return;
        if (err) {
          zipFile.close();
          reject(err);
          return;
        }

        // This is the key. We start by reading the first entry.
        zipFile.readEntry();

        // Now for every entry, we will write a file or dir
        // to disk. Then call zipFile.readEntry() again to
        // trigger the next cycle.
        zipFile.on("entry", entry => {
          try {
            // Directories
            if (/\/$/.test(entry.fileName)) {
              // Create the directory then read the next entry.
              fs.mkdirSync(path.join(unzipToDir, entry.fileName), {
                recursive: true,
              });
              zipFile.readEntry();
            } else {
              fs.mkdirSync(
                path.dirname(path.join(unzipToDir, entry.fileName)),
                {
                  recursive: true,
                }
              );
              // Write the file to disk.
              zipFile.openReadStream(entry, (readErr, readStream) => {
                if (readErr || !readStream) {
                  zipFile.close();
                  reject(readErr || "Readstream didn't exist");
                  return;
                }

                const file = fs.createWriteStream(
                  path.join(unzipToDir, entry.fileName)
                );
                readStream.pipe(file);
                file.on("finish", () => {
                  // Wait until the file is finished writing, then read the next entry.
                  // @ts-ignore: Typing for close() is wrong.
                  file.close(() => {
                    zipFile.readEntry();
                  });

                  file.on("error", err => {
                    zipFile.close();
                    reject(err);
                  });
                });
              });
            }
          } catch (e) {
            zipFile.close();
            reject(e);
          }
        });
        zipFile.on("end", err => {
          resolve();
        });
        zipFile.on("error", err => {
          zipFile.close();
          reject(err);
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};
