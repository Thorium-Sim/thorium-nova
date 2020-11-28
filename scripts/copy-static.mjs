import fs from "fs/promises";
import path from "path";

// eslint-disable-next-line
async function copyDir(src, dest) {
  const entries = await fs.readdir(src, {withFileTypes: true});
  try {
    await fs.mkdir(dest, {recursive: true});
  } catch {}
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

copyDir("./public", `./dist/public`);
