import {parse} from "yaml";
import {promises as fs} from "fs";
import {thoriumPath} from "./appPaths";
import FastGlob from "fast-glob";

export async function loadFolderYaml<T>(objectGlob: string) {
  const aspectPaths = await FastGlob(objectGlob);
  let files: T[] = [];
  for (const aspectPath of aspectPaths) {
    try {
      const manifest = parse(await fs.readFile(aspectPath, "utf8"));
      files.push(manifest);
    } catch (err: any) {
      if (err) {
        console.error(
          `Error parsing ${aspectPath
            .replace(`${thoriumPath}/plugins/`, "")
            .replace("/manifast.yml", "")} on line ${
            err.source?.rangeAsLinePos?.start.line
          }: ${err.message}`
        );
      }
    }
  }
  return files;
}
