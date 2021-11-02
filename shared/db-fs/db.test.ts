import {readFile, access, rm} from "fs/promises";
import {FSDataStore, FSDataStoreOptions, setBasePath} from "./index";
interface TestStore {
  a: number;
  b: string;
  c: number[];
}
const wait = (time = 1000) => new Promise(resolve => setTimeout(resolve, time));
afterAll(async () => {
  await rm("./dbTest", {recursive: true, force: true});
});
describe("db", () => {
  it("should work with the class constructor", async () => {
    setBasePath("./dbTest");
    class Data extends FSDataStore {
      a: number = 10;
      b: string = "hello";
    }
    const test = new Data(
      {},
      {path: "class.yml", safeMode: false, throttle: 10}
    );
    expect(test.a).toEqual(10);
    expect(test.b).toEqual("hello");
    test.a = 20;
    test.b = "world";
    await wait(500);
    expect(await readFile("./dbTest/class.yml", "utf-8")).toEqual(`a: 20
b: world
`);
    await test.removeFile();
  });
  it("should load saved data with the class constructor", async () => {
    setBasePath("./dbTest");

    class Data extends FSDataStore {
      a!: number;
      b!: string;
    }
    const test = new Data(
      {a: 10, b: "hello"},
      {path: "classReload.yml", safeMode: false, throttle: 10}
    );
    expect(test.a).toEqual(10);
    expect(test.b).toEqual("hello");
    await wait(500);
    const test2 = new Data(
      {a: 10, b: "hello"},
      {path: "classReload.yml", safeMode: false, throttle: 10}
    );
    expect(test2.a).toEqual(10);
    expect(test2.b).toEqual("hello");

    test2.a = 20;
    test2.b = "world";
    await test2.writeFile(true);
    const test3 = new Data(
      {
        a: 30,
        b: "universe",
      },
      {path: "classReload.yml", safeMode: false, throttle: 10}
    );
    expect(test3.a).toEqual(20);
    expect(test3.b).toEqual("world");

    await test3.removeFile();
  });
});
