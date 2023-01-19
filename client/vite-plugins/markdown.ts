import Frontmatter from "front-matter";
import MarkdownIt from "markdown-it";
import {Plugin} from "vite";
import {TransformResult} from "rollup";
import anchor from "markdown-it-anchor";
import type Token from "markdown-it/lib/token";
import path from "path";
import fs from "fs";
const markdownCompiler = (id: string): MarkdownIt => {
  function mdImages(md: MarkdownIt) {
    md.core.ruler.push("images", state => {
      let imageTokens: Token[] = [];
      function getChildren(tokens: Token[]) {
        for (let token of tokens) {
          if (token.tag === "img") {
            imageTokens.push(token);
          }
          if (token.children) {
            getChildren(token.children);
          }
        }
      }
      getChildren(state.tokens);
      imageTokens.forEach(token => {
        const parsed = Object.fromEntries(token?.attrs || []);
        if (!parsed.src) return;
        const filePath = `/docs/${path
          .dirname(id)
          .split("/")
          .at(-1)}/${path.basename(id, ".md")}/${path.basename(parsed.src)}`;
        const fullPath = path.join(__dirname, "../public", filePath);
        const currentPath = path.join(path.dirname(id), parsed.src);
        fs.mkdirSync(path.dirname(fullPath), {recursive: true});
        fs.copyFileSync(currentPath, fullPath);
        parsed.src = filePath;
        token.attrs = Object.entries(parsed);
      });
    });
  }
  const md = MarkdownIt({html: true});
  md.use(anchor, {
    permalink: anchor.permalink.linkAfterHeader({
      style: "visually-hidden",
      assistiveText: title => `Permalink to “${title}”`,
      visuallyHiddenClass: "sr-only",
      wrapper: ['<div class="header-permalink">', "</div>"],
    }),
  });
  md.use(mdImages);
  return md;
};

class ExportedContent {
  #exports: string[] = [];
  #contextCode = "";

  addContext(contextCode: string): void {
    this.#contextCode += `${contextCode}\n`;
  }

  addExporting(exported: string): void {
    this.#exports.push(exported);
  }

  export(): string {
    return [this.#contextCode, `export { ${this.#exports.join(", ")} }`].join(
      "\n"
    );
  }
}

const tf = (code: string, id: string): TransformResult => {
  if (!id.endsWith(".md")) return null;

  const content = new ExportedContent();
  const fm = Frontmatter<unknown>(code);
  content.addContext(`const attributes = ${JSON.stringify(fm.attributes)}`);
  content.addExporting("attributes");

  const html = markdownCompiler(id).render(fm.body);
  content.addContext(`const html = ${JSON.stringify(html)}`);
  content.addExporting("html");

  return {
    code: content.export(),
  };
};

export const plugin = (): Plugin => {
  return {
    name: "vite-plugin-markdown",
    enforce: "pre",
    transform(code, id) {
      return tf(code, id);
    },
  };
};

export default plugin;
