import {generateIncrementedName} from "server/src/utils/generateIncrementedName";
import {Aspect} from "./Aspect";
import type BasePlugin from "./index";
import less from "less";
import tailwindcss from "tailwindcss";
import postcss from "postcss";
// @ts-expect-error - No types
import postcssLess from "postcss-less";
import {promises as fs, readFileSync} from "fs";
import path from "path";
import {thoriumPath} from "server/src/utils/appPaths";

export default class ThemePlugin extends Aspect {
  apiVersion = "theme/v1" as const;
  kind = "themes" as const;
  name: string;
  default?: boolean;
  assets: {
    rawCSS: string;
    processedCSS: string;
    files: string[];
  };

  constructor(params: Partial<ThemePlugin>, plugin: BasePlugin) {
    const name = generateIncrementedName(
      params.name || "New Theme",
      plugin.aspects.ships.map(theme => theme.name)
    );
    super({name, ...params}, {kind: "themes"}, plugin);
    this.name = name;

    this.assets = params.assets || {
      rawCSS: "raw.css",
      processedCSS: "processed.css",
      files: [],
    };
    this.default = params.default || false;
  }

  async setCSS(rawCSS: string) {
    const config = (await import("client/tailwind.config")) as any;
    const postcssOutput = (
      await postcss([tailwindcss(config.default)]).process(
        `.theme-container {${rawCSS}}`,
        {
          syntax: postcssLess,
          from: "tailwind-default",
        }
      )
    ).css;
    const processedCSS = (await less.render(postcssOutput)).css;
    await fs.mkdir(path.join(thoriumPath, this.assetPath), {recursive: true});
    await fs.writeFile(path.join(thoriumPath, this.assets.rawCSS), rawCSS);
    await fs.writeFile(
      path.join(thoriumPath, this.assets.processedCSS),
      processedCSS
    );
    return processedCSS;
  }

  async addAsset(assetPath: string, fileName: string) {
    await fs.mkdir(path.join(thoriumPath, this.assetPath), {
      recursive: true,
    });
    await fs.rename(
      assetPath,
      path.join(thoriumPath, this.assetPath, fileName)
    );
    this.assets.files.push(path.join(this.assetPath, fileName));
  }

  async removeAsset(assetPath: string) {
    const removePath = path.join(thoriumPath, assetPath);
    try {
      await fs.unlink(removePath);
    } finally {
      this.assets.files = this.assets.files.filter(file => file !== assetPath);
    }
  }

  get rawCSS() {
    const rawCSS = readFileSync(
      path.join(thoriumPath, this.assets.rawCSS),
      "utf-8"
    );

    return rawCSS;
  }
  get processedCSS() {
    const processedCSS = readFileSync(
      path.join(thoriumPath, this.assets.processedCSS),
      "utf-8"
    );

    return processedCSS;
  }
}
