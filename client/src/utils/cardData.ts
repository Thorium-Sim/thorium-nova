import {UnionToIntersection} from "server/src/utils/types";
import * as allData from "../cards/dataList";

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

type FirstParam<Func extends (...args: any) => any> = Func extends (
  first: infer R,
  ...args: any
) => any
  ? R
  : never;
type AnyFunc = (...args: any) => any;
export type SubRecord = {fetch: AnyFunc; filter?: AnyFunc};
export type GetSubscriptionParams<Subs extends Record<string, SubRecord>> = {
  [Property in keyof Subs]: FirstParam<NonNullable<Subs[Property]["filter"]>>;
};
export type GetSubscriptionReturns<Subs extends Record<string, SubRecord>> = {
  [Property in keyof Subs]: ReturnType<Subs[Property]["fetch"]>;
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
