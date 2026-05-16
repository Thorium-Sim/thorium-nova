import { mkdir } from "node:fs/promises";

await mkdir("./external-deps");

await Bun.$`bun i --cwd ./external-deps @msgpack/msgpack pdfkit`;
