import {CardInputFunctions, cardInputs} from "client/src/utils/cardData";
import {InputParams, InputReturns, UnionToIntersection} from "../utils/types";
import * as allInputs from "./list";

export type AllInputs = UnionToIntersection<
  typeof allInputs[keyof typeof allInputs]
> &
  CardInputFunctions;
export type AllInputNames = keyof AllInputs;
export type AllInputParams = InputParams<AllInputs>;
export type AllInputReturns = InputReturns<AllInputs>;

const inputList = Object.entries(allInputs).concat(Object.entries(cardInputs));

const inputListKeys = inputList.flatMap(([, value]) =>
  value ? Object.keys(value) : null
);
const duplicateKeys = inputListKeys.reduce((prev: string[], string, i, arr) => {
  if (string && arr.indexOf(string) !== i) prev.push(string);
  return prev;
}, []);
if (duplicateKeys.length > 0) {
  throw new Error(`Duplicate inputs: ${duplicateKeys.join(", ")}`);
}

const flattenedInputs: AllInputs = inputList.reduce(
  (prev: any, [inputName, inputs]) =>
    inputName === "default" ? prev : {...prev, ...inputs},
  {}
);

export default flattenedInputs;
