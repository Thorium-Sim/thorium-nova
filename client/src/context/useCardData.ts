import {getTabIdSync} from "@thorium/tab-id";
import React, {useContext} from "react";
import {useQuery} from "react-query";
import {
  GetSubscriptionReturns,
  DataCardNames,
  CardDataFunctions,
} from "../utils/cardData";
import {useCardContext} from "./CardContext";

export const MockCardDataContext = React.createContext<any>(null!);
export default function useCardData<CardName extends DataCardNames>() {
  const {cardName} = useCardContext() as {cardName: CardName};
  const clientId = getTabIdSync();
  const cardQuery = useQuery(
    [clientId, "cardData", cardName],
    () => {
      return fetch(`/cardRequest/${cardName}`, {
        headers: {
          authorization: `Bearer ${clientId}`,
        },
      }).then(res => res.json());
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  );

  const mockData = useContext(MockCardDataContext);
  if (mockData)
    return mockData as GetSubscriptionReturns<
      CardDataFunctions[CardName]["subscriptions"]
    >;

  return cardQuery.data as GetSubscriptionReturns<
    CardDataFunctions[CardName]["subscriptions"]
  >;
}

export const MockClientDataContext = React.createContext<
  GetSubscriptionReturns<CardDataFunctions["allData"]["subscriptions"]>
>(null!);

export function useClientData() {
  const clientId = getTabIdSync();
  const clientQuery = useQuery(
    [clientId, "cardData", "allData"],
    async () => {
      return fetch("/cardRequest/allData", {
        headers: {
          authorization: `Bearer ${clientId}`,
        },
      }).then(res => res.json());
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  );
  const mockData = useContext(MockClientDataContext);
  if (mockData) return mockData;

  return clientQuery.data as GetSubscriptionReturns<
    CardDataFunctions["allData"]["subscriptions"]
  >;
}
