import {DataContext, UnionToIntersection} from "server/src/utils/types";
import * as allCards from "../cards/dataList";
import * as allCores from "../cores/dataList";

const allData = {...allCards, ...allCores};

// @ts-expect-error The default value duplicates everything else. No need to include it.
const {["default"]: defaultValue, ...cardData} = allData;

export const cardSubscriptions = Object.fromEntries(
  Object.entries(cardData).map(([cardName, {subscriptions}]) => {
    return [cardName, subscriptions];
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

type SecondParam<Func extends (...args: any) => any> = Func extends (
  first: any,
  second: infer R,
  ...args: any
) => any
  ? R
  : never;
export type SubRecord = (context: DataContext, params?: any) => any;
export type GetSubscriptionParams<Subs extends Record<string, SubRecord>> = {
  [Property in keyof Subs]: SecondParam<Subs[Property]>;
};
export type GetSubscriptionReturns<Subs extends Record<string, SubRecord>> = {
  [Property in keyof Subs]: ReturnType<Subs[Property]>;
};

export type CardDataFunctions = typeof allData;
export type DataCardNames = keyof CardDataFunctions;
type SubscriptionFunctions = UnionToIntersection<
  CardDataFunctions[DataCardNames]
>["subscriptions"];
export type SubscriptionNames = keyof SubscriptionFunctions;
export type SubscriptionParams = GetSubscriptionParams<SubscriptionFunctions>;
export type SubscriptionReturn = GetSubscriptionReturns<SubscriptionFunctions>;

export type AllSubscriptions = UnionToIntersection<
  typeof allData[keyof CardDataFunctions]
>;
