import {
  InputParams,
  InputReturns,
  RequestPublishParams,
  UnionToIntersection,
} from "../utils/types";
import * as allRequests from "./list";

export type AllRequests = UnionToIntersection<
  typeof allRequests[keyof typeof allRequests]
>;
export type AllRequestNames = keyof AllRequests;
export type AllRequestParams = InputParams<AllRequests>;
export type AllRequestPublishParams = RequestPublishParams<AllRequests>;
export type AllRequestReturns = InputReturns<AllRequests>;

const flattenedRequests: AllRequests = Object.entries(allRequests).reduce(
  (prev: any, [_, inputs]) => ({...prev, ...inputs}),
  {}
);

export default flattenedRequests;
