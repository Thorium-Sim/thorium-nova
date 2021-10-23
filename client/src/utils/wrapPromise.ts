// Suspense integrations like Relay implement
// a contract like this to integrate with React.
// Real implementations can be significantly more complex.
// Don't copy-paste this into your project!

import {stableValueHash} from "./stableValueHash";

// Feeling YOLO, might delete later
export function wrapPromise<T>(functionCaller: (...args: any[]) => Promise<T>) {
  let status = "pending";
  let result: T;
  let promiseCache = new Map();
  return {
    read(...args: any[]) {
      const cacheKey = stableValueHash(args);
      let suspender = promiseCache.get(cacheKey);
      if (!suspender) {
        let promise = functionCaller(...args);
        suspender = promise.then(
          r => {
            status = "success";
            result = r;
          },
          e => {
            status = "error";
            result = e;
          }
        );
        promiseCache.set(cacheKey, suspender);
      }
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    },
  };
}
