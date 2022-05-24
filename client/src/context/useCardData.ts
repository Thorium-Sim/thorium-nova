import {getTabIdSync} from "@thorium/tab-id";
import React, {useContext} from "react";
import {useQuery} from "react-query";
import {
  GetSubscriptionReturns,
  DataCardNames,
  CardDataFunctions,
} from "../utils/cardData";
import {useCardContext} from "./CardContext";
import {useRequestSub} from "./useRequestSub";

export const MockCardDataContext = React.createContext<any>(null!);
export default function useCardData<CardName extends DataCardNames>(
  allData: boolean = false
) {
  let {cardName} = useCardContext() as {cardName: CardName};
  if (allData) cardName = "allData" as CardName;
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
      networkMode: "always",
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );
  const requestName = ["cardData", cardName] as const;
  useRequestSub({requestName});

  const mockData = useContext(MockCardDataContext);
  if (mockData)
    return mockData as GetSubscriptionReturns<
      CardDataFunctions[CardName]["subscriptions"]
    >;

  return cardQuery.data as GetSubscriptionReturns<
    CardDataFunctions[CardName]["subscriptions"]
  >;
}

export const MockClientDataContext = React.createContext<any>(null!);

export function useClientData() {
  const clientData = useCardData<"allData">(true);
  const mockData = useContext(MockClientDataContext);
  if (mockData)
    return mockData as GetSubscriptionReturns<
      CardDataFunctions["allData"]["subscriptions"]
    >;

  return clientData;
}
