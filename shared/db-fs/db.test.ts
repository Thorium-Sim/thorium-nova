import {readFile, access} from "fs/promises";
import getStore, {setBasePath} from "./index";
interface TestStore {
  a: number;
  b: string;
  c: number[];
}
const wait = (time = 1000) => new Promise(resolve => setTimeout(resolve, time));
describe("db", () => {
  it("should load default values", () => {
    const data = getStore<{test: boolean; hey: number; string: string}>({
      path: "./test",
      initialData: {
        test: true,
        hey: 123,
        string: "Hello!",
      },
    });
    expect(data.hey).toEqual(123);
    expect(data.test).toEqual(true);
    expect(data.string).toEqual("Hello!");
  });
  it("creates a database file", async () => {
    const store = getStore<TestStore>({
      path: "./testDb.json",
      initialData: {a: 3, b: "hello", c: [1, 2, 3]},
      safeMode: false,
    });
    store.a = 8;
    await store.writeFile(true);
    expect(await readFile("./testDb.json", "utf-8")).toMatchInlineSnapshot(`
      "{
        \\"a\\": 8,
        \\"b\\": \\"hello\\",
        \\"c\\": [
          1,
          2,
          3
        ]
      }"
    `);
    await store.removeFile();
  });
  it("should work with a base path", async () => {
    setBasePath("./dbTest");
    const store = getStore<TestStore>({
      initialData: {a: 3, b: "hello", c: [1, 2, 3]},
      throttle: 10,
      safeMode: false,
    });
    store.a = 10;
    await wait(500);
    expect(await readFile("./dbTest/db.json", "utf-8")).toMatchInlineSnapshot(`
      "{
        \\"a\\": 10,
        \\"b\\": \\"hello\\",
        \\"c\\": [
          1,
          2,
          3
        ]
      }"
    `);

    await store.removeFile();
    expect(access).rejects.toThrow();
  });
});
