import { mkdir, rm } from "node:fs/promises";

await rm("./external-deps", { force: true, recursive: true });

await mkdir("./external-deps");

await Bun.file("./external-deps/package.json").write(JSON.stringify({ name: "external-deps" }));

await Bun.$`bun i --cwd ./external-deps @msgpack/msgpack pdfkit`;
