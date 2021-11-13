import {parse} from "yaml";
import {YAMLSemanticError} from "yaml/util";
import {promises as fs} from "fs";
import {thoriumPath} from "./appPaths";

export async function loadFolderYaml<T>(objectGlob: string) {
  const {globby} = await import("globby");
  const aspectPaths = await globby(objectGlob);
  let files: T[] = [];
  for (const aspectPath of aspectPaths) {
    try {
      const manifest = parse(await fs.readFile(aspectPath, "utf8"));
      files.push(manifest);
    } catch (err) {
      if (err instanceof YAMLSemanticError) {
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
