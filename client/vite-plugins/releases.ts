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
      const html = markdown().render(releaseNotes);
      if (id.endsWith("release-notes.json")) {
        return {
          code: `export default {data:\`${html}\`}`,
          map: null,
        };
      }
    },
  };
}
