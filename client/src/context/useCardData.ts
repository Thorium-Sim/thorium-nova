import {useEffect} from "react";
import {InputReturns} from "server/src/utils/types";
import {proxy, useSnapshot} from "valtio";
import {
  GetSubscriptionReturns,
  DataCardNames,
  SubscriptionNames,
  SubscriptionReturn,
  CardDataFunctions,
} from "../utils/cardData";
import {useCardContext} from "./CardContext";
import {useThorium} from "./ThoriumContext";

type UnwrapPromise<T> = T extends Promise<infer R> ? UnwrapPromise<R> : T;
type CardProxy = {
  [Card in DataCardNames]: UnwrapPromise<
    GetSubscriptionReturns<CardDataFunctions[Card]["subscriptions"]>
  >;
};

const cardProxy = proxy<Partial<CardProxy>>({});

type CardData =
  | string
  | number
  | Object
  | {card: DataCardNames; data: Record<SubscriptionNames, any>};

export function useCardDataSubscribe() {
  const {socket} = useThorium();
  useEffect(() => {
    if (socket) {
      // Since Geckos doesn't let you turn off event listeners, we use channelConnected
      // to ignore channel messages any type this effect runs again.
      let channelConnected = true;
      socket.on("cardData", (data: CardData) => {
        if (!channelConnected) return;
        if (typeof data !== "object") {
          throw new Error(`cardData data must be an object. Got "${data}"`);
        }
        if (!("card" in data && "data" in data)) {
          const dataString = JSON.stringify(data, null, 2);
          throw new Error(
            `cardData data must include a card name and a data object. Got ${dataString}`
          );
        }
        if (!cardProxy[data.card]) {
          cardProxy[data.card] = {} as any;
        }
        Object.keys(data.data).forEach(key => {
          let actualKeyName = key as keyof typeof cardProxy[typeof data.card];
          cardProxy[data.card]![actualKeyName] = data.data[actualKeyName];
        });
      });
      return () => {
        channelConnected = false;
      };
    }
  }, [socket]);
}
export default function useCardData<CardName extends DataCardNames>() {
  const {cardName} = useCardContext() as {cardName: CardName};
  const data = useSnapshot(cardProxy);
  const cardData = data[cardName] as any;

  return cardData as Required<CardProxy[CardName]>;
}

export function useClientData() {
  const data = useSnapshot(cardProxy);
  const cardData = data.allData!;
  if (!cardData) throw new Promise(res => setTimeout(res, 100));
  return cardData;
}
