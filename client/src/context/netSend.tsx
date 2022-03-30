import {AllInputNames, AllInputParams, AllInputReturns} from "@thorium/inputs";
import {getTabId} from "@thorium/tab-id";

type UnPromise<T> = T extends Promise<infer U> ? UnPromise<U> : T;

export async function netSend<
  InputName extends AllInputNames,
  Params extends AllInputParams[InputName],
  Return extends AllInputReturns[InputName]
>(type: InputName, params?: Params): Promise<UnPromise<Return>> {
  const clientId = await getTabId();
  const body = new FormData();
  body.append("input", type.toString());
  let count = 0;
  for (const key in params) {
    const value = params[key];
    if (value instanceof File) {
      body.append(key, value);
      params[key] = {} as any;
    } else if (value instanceof Blob) {
      body.append(key, value, `blob-${count++}`);
      params[key] = {} as any;
    } else if (value instanceof FileList) {
      for (let i = 0; i < value.length; i++) {
        body.append(`${key}[]`, value[i]);
      }
      params[key] = [] as any;
    }
  }
  body.append("params", JSON.stringify(params));
  const response = await fetch(`/netSend`, {
    method: "POST",
    headers: {authorization: `Bearer ${clientId}`},
    body,
  });
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}
