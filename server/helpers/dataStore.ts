/* istanbul ignore file */
import fsCallback from "fs";
import path from "path";
import throttle from "lodash.throttle";

const fs = fsCallback.promises;

interface IStoreOptions {
  path?: string;
  indent?: number;
  class?: any;
  initialData?: any;
  throttle?: number;
}

// A helper to make sure we don't parse any janky JSON
// It works, which is why there are so many "any"s
function json(data: any, replacer: any = null, space: number) {
  function stringify(obj: any, replacer: any, spaces: number) {
    return JSON.stringify(obj, serializer(replacer), spaces);
  }

  function serializer(replacer: any) {
    var stack: any = [],
      keys: any = [];

    const cycleReplacer = function (key: string, value: any) {
      if (stack[0] === value) return "[Circular ~]";
      return (
        "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
      );
    };

    return function (this: any, key: any, value: any) {
      if (stack.length > 0) {
        var thisPos = stack.indexOf(this);
        ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
        ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
        if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
      } else stack.push(value);

      return replacer == null ? value : replacer.call(this, key, value);
    };
  }
  return stringify(data, replacer, space);
}

function isClass(v: any) {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}

let isProxy = Symbol("isProxy");

interface StoreObject {
  writeFile: (force?: boolean) => Promise<void>;
  removeFile: () => Promise<void>;
  serialize?: Function;
}
export default function getStore<G extends object>(options?: IStoreOptions) {
  const {
    path: filePath,
    class: classConstructor,
    indent = 2,
    throttle: throttleDuration = 1000 * 30,
    initialData,
  } = options || {};

  // Load the data
  let _data;
  try {
    _data =
      process.env.NODE_ENV !== "test" && filePath
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
  if (_data.length) {
    if (isClass(classConstructor)) {
      dataObject = _data.map((d: any) => new classConstructor(d));
    } else {
      dataObject = _data;
    }
    dataObject.writeFile = writeFile;
    dataObject.removeFile = removeFile;
  } else {
    if (isClass(classConstructor)) {
      dataObject = new classConstructor(_data);
      dataObject.writeFile = writeFile;
      dataObject.removeFile = removeFile;
    } else {
      dataObject = {..._data, writeFile, removeFile};
    }
  }

  async function writeFile(force = false) {
    if (process.env.NODE_ENV !== "production" && force === false) return;
    if (!filePath) {
      return;
    }
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    const jsonData = json(
      dataObject.serialize ? dataObject.serialize() : dataObject,
      null,
      indent
    );
    await fs.writeFile(filePath, jsonData, {mode: 0o0600});
  }

  async function removeFile() {
    if (!filePath) return;
    const removePath = path.resolve("../", filePath);
    try {
      await fs.rmdir(removePath, {recursive: true});
    } catch (err) {
      console.error("Error removing file: ", filePath, err);
    }
  }

  const writeThrottle =
    process.env.NODE_ENV === "test"
      ? writeFile
      : throttle(writeFile, throttleDuration, {
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
