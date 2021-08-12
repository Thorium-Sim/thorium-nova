/* istanbul ignore file */
import fsCallback from "fs";
import path from "path";
import throttle from "lodash.throttle";

const fs = fsCallback.promises;

let basePath = "./";
export function setBasePath(path: string) {
  basePath = path;
}
interface GenericClass {
  [key: string]: any;
  new (...params: any[]): object;
}
interface IStoreOptions<T> {
  path?: string;
  indent?: number;
  class?: GenericClass;
  initialData?: T;
  throttle?: number;
  safeMode?: boolean;
  serialize?: (data: T) => Object;
}

type SecondParam<F extends (...param: any[]) => any> = F extends (
  arg1: any,
  arg2: infer P,
  ...args: any[]
) => any
  ? P
  : never;
// A helper to make sure we don't parse any janky JSON
// It works, which is why there are so many "any"s
function json(
  data: any,
  replacer: SecondParam<typeof JSON.stringify> = null,
  space: number
) {
  function stringify(
    obj: any,
    replacer: SecondParam<typeof JSON.stringify>,
    spaces: number
  ) {
    return JSON.stringify(obj, serializer(replacer), spaces);
  }

  function serializer(replacer: any) {
    let stack: any = [],
      keys: any = [];

    const cycleReplacer = function (_key: string, value: any) {
      if (stack[0] === value) return "[Circular ~]";
      return (
        "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
      );
    };

    return function (this: any, key: any, value: any) {
      if (stack.length > 0) {
        let thisPos = stack.indexOf(this);
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
      } else stack.push(value);

      return replacer == null ? value : replacer.call(this, key, value);
    };
  }
  return stringify(data, replacer, space);
}

function isClass(v: any): v is GenericClass {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}

let isProxy = Symbol("isProxy");

export interface StoreObject {
  writeFile: (force?: boolean) => Promise<void>;
  removeFile: () => Promise<void>;
  serialize?: Function;
}
export default function getStore<G extends object>(options?: IStoreOptions<G>) {
  const {
    path: inputPath = "db.json",
    class: classConstructor,
    indent = 2,
    throttle: throttleDuration = 1000 * 30,
    initialData,
    safeMode,
    serialize = (d: G) => d,
  } = options || {};
  let filePath = path.join(basePath, inputPath);
  // Load the data
  let _data;
  try {
    _data = filePath
      ? JSON.parse(fsCallback.readFileSync(filePath, "utf8"))
      : initialData;
  } catch (err) {
    if (err.code === "EACCES") {
      err.message +=
        "\ndata-store does not have permission to load this file\n";
      throw err;
    }
  }

  if (!_data) {
    _data = initialData;
  }

  // Instantiate the object if it is a class
  // or just make a new object with the data inside
  let dataObject!: G & StoreObject;
  if (typeof _data?.length === "number") {
    if (isClass(classConstructor)) {
      dataObject = _data.map((d: any) => new classConstructor(d));
    } else {
      dataObject = _data;
    }
    dataObject.writeFile = writeFile;
    dataObject.removeFile = removeFile;
  } else {
    if (isClass(classConstructor)) {
      dataObject = new classConstructor(_data) as typeof dataObject;
      dataObject.writeFile = writeFile;
      dataObject.removeFile = removeFile;
    } else {
      dataObject = {..._data, writeFile, removeFile};
    }
  }

  async function writeFile(force = false) {
    try {
      if (safeMode && force === false) return;
      if (
        (!safeMode &&
          process.env.NODE_ENV !== "production" &&
          process.env.NODE_ENV !== "test" &&
          force === false) ||
        (safeMode !== false && process.env.NODE_ENV === "test")
      )
        return;
      if (!filePath) {
        return;
      }
      await fs.mkdir(path.dirname(filePath), {recursive: true});

      let jsonData = "{}";

      if (Array.isArray(dataObject)) {
        jsonData = json(
          dataObject.map(o => (o.serialize ? o.serialize() : serialize(o))),
          null,
          indent
        );
      } else {
        jsonData = json(
          dataObject.serialize ? dataObject.serialize() : serialize(dataObject),
          null,
          indent
        );
      }
      await fs.writeFile(filePath, jsonData, {mode: 0o0600});
    } catch (e) {
      e.message = "db-fs: Error writing file:\n" + e.message;
      throw e;
    }
  }

  async function removeFile() {
    if (!filePath) return;
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error removing file: ", filePath, err);
    }
  }

  const writeThrottle = throttle(writeFile, throttleDuration, {
    trailing: true,
  });

  const handler: ProxyHandler<any> = {
    get(target, key) {
      if (key === isProxy) return true;
      if (
        !target[isProxy] &&
        Object.getOwnPropertyDescriptor(target, key) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !(target[key] instanceof Date)
      ) {
        return new Proxy(target[key], handler);
      } else {
        return target[key];
      }
    },
    set(target, name, value) {
      target[name] = value;

      writeThrottle();
      return true;
    },
    deleteProperty(target, prop) {
      if (prop in target) {
        delete target[prop];
        writeThrottle();
        return true;
      }
      return false;
    },
  };
  return new Proxy(dataObject, handler) as G & StoreObject;
}
