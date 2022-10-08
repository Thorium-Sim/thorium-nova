import {
  InputParams,
  InputReturns,
  RequestPublishParams,
  UnionToIntersection,
} from "../utils/types";
import * as allRequests from "./list";
import {
  cardSubscriptions,
  CardRequestFunctions,
} from "client/src/utils/cardData";

type RequestsUnion = typeof allRequests[keyof typeof allRequests];
export type AllRequests = UnionToIntersection<RequestsUnion> &
  CardRequestFunctions;

export type AllRequestNames = keyof AllRequests;
export type AllRequestParams = InputParams<AllRequests>;
export type AllRequestPublishParams = RequestPublishParams<AllRequests>;
export type AllRequestReturns = InputReturns<AllRequests>;

const requestList = Object.entries(allRequests).concat(
  Object.entries(cardSubscriptions)
);
const requestListKeys = requestList.flatMap(([, value]) =>
  value ? Object.keys(value) : null
);
const duplicateKeys = requestListKeys.reduce(
  (prev: string[], string, i, arr) => {
    if (string && arr.indexOf(string) !== i) prev.push(string);
    return prev;
  },
  []
);
if (duplicateKeys.length > 0) {
  throw new Error(`Duplicate requests: ${duplicateKeys.join(", ")}`);
}
const flattenedRequests: AllRequests = requestList.reduce(
  (prev: any, [requestName, inputs]) =>
    requestName === "default" ? prev : {...prev, ...inputs},
  {}
);

export default flattenedRequests;
