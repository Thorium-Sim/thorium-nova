import {UnionToIntersection} from "server/src/utils/types";
import * as allCards from "../cards/dataList";
import * as allCores from "../cores/dataList";

const allData = {...allCards, ...allCores};

// @ts-expect-error The default value duplicates everything else. No need to include it.
const {["default"]: defaultValue, ...cardData} = allData;

export const cardSubscriptions = Object.fromEntries(
  Object.entries(cardData).map(([cardName, {requests}]) => {
    return [cardName, requests];
  })
);

export const cardDataStreams = Object.fromEntries(
  Object.entries(cardData)
    .map(([cardName, {dataStream}]) => {
      if (!dataStream) return null;
      return [cardName, dataStream];
    })
    .filter(function isEntry(entry): entry is [string, any] {
      return entry !== null;
    })
);

export const cardInputs = Object.fromEntries(
  Object.entries(cardData)
    .map(([cardName, {inputs}]) => {
      if (!inputs) return null;
      return [cardName, inputs];
    })
    .filter(function isEntry(entry): entry is [string, any] {
      return entry !== null;
    })
);

console.log(cardInputs);
type CardDataFunctions = typeof allData;
type DataCardNames = keyof CardDataFunctions;
export type CardRequestFunctions = UnionToIntersection<
  CardDataFunctions[DataCardNames]
>["requests"];
export type CardInputFunctions = UnionToIntersection<
  CardDataFunctions[DataCardNames]
>["inputs"];

type ThirdParam<T> = T extends (a: any, b: any, c: infer P) => any ? P : never;
type DS = {
  dataStream: any;
};
export type DataStreamParams = {
  [Property in DataCardNames as CardDataFunctions[Property] extends DS
    ? Property
    : never]: CardDataFunctions[Property] extends DS
    ? ThirdParam<CardDataFunctions[Property]["dataStream"]>
    : never;
};
