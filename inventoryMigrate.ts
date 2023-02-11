import glob from "fast-glob";
import {parse, stringify} from "yaml";
import fs from "fs/promises";

let doneItems: string[] = [];
(async () => {
  const data = await glob("./**/plugins/**/ships/**/manifest.yml");

  for (const filePath of data.filter((a, i, arr) => arr.indexOf(a) === i)) {
    const item = parse(await fs.readFile(filePath, "utf-8"));
    if (doneItems.includes(item.name)) continue;
    for (let deck of item.decks) {
      for (let node of deck.nodes) {
        node.volume *= 1000;
      }
    }
    doneItems.push(item.name);
    await fs.writeFile(filePath, stringify(item));
  }
})();
