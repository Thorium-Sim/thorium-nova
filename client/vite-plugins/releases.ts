export default function releasesPlugin() {
  return {
    name: "releases",
    async transform(src: unknown, id: string) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const {default: markdown} = await import("markdown-it");
      const releaseNotes = await fs.readFile(
        path.resolve("../CHANGELOG.md"),
        "utf8"
      );
      const md = markdown();
      var defaultRender =
        md.renderer.rules.link_open ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options);
        };

      md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        // If you are sure other plugins can't add `target` - drop check below
        var aIndex = tokens[idx].attrIndex("target");

        if (aIndex < 0) {
          tokens[idx].attrPush(["target", "_blank"]); // add new attribute
        } else {
          // @ts-expect-error
          tokens[idx].attrs[aIndex][1] = "_blank"; // replace value of existing attr
        }

        // pass token to default renderer.
        return defaultRender(tokens, idx, options, env, self);
      };

      const html = md.render(releaseNotes);
      if (id.endsWith("release-notes.json")) {
        return {
          code: `export default {data:\`${html}\`}`,
          map: null,
        };
      }
    },
  };
}
