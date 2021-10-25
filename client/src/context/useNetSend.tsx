import {AllInputNames, AllInputParams, AllInputReturns} from "@thorium/inputs";
import {getTabId} from "@thorium/tab-id";

export function useNetSend(): <
  InputName extends AllInputNames,
  Params extends AllInputParams[InputName],
  Return extends AllInputReturns[InputName]
>(
  type: InputName,
  params?: Params
) => Promise<Return> {
  return async function netSend(type, params) {
    const clientId = await getTabId();
    const body = new FormData();
    body.append("input", type.toString());
    for (const key in params) {
      const value = params[key];
      if (value instanceof File) {
        body.append(key, value);
        params[key] = {} as any;
      }
      if (value instanceof FileList) {
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
    return json;
  };
}
