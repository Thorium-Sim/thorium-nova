import {InputParams, InputReturns, UnionToIntersection} from "../utils/types";
import * as allInputs from "./list";

export type AllInputs = UnionToIntersection<
  typeof allInputs[keyof typeof allInputs]
>;
export type AllInputNames = keyof AllInputs;
export type AllInputParams = InputParams<AllInputs>;
export type AllInputReturns = InputReturns<AllInputs>;

const flattenedInputs: AllInputs = Object.entries(allInputs).reduce(
  (prev: any, [_, inputs]) => ({...prev, ...inputs}),
  {}
);

export default flattenedInputs;
