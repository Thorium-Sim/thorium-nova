import {load} from "js-yaml";
import {promises as fs} from "fs";
import {thoriumPath} from "./appPaths";
import FastGlob from "fast-glob";

export async function loadFolderYaml<T>(objectGlob: string) {
  const aspectPaths = await FastGlob(objectGlob);
  let files: T[] = [];
  for (const aspectPath of aspectPaths) {
    try {
      const manifest = load(await fs.readFile(aspectPath, "utf8")) as T;
      files.push(manifest);
    } catch (err: any) {
      if (err) {
        console.error(
          `Error parsing ${aspectPath
            .replace(`${thoriumPath}/plugins/`, "")
            .replace("/manifest.yml", "")}: ${err.message}`
        );
      }
    }
  }
  return files;
}
