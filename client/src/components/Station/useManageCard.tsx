import {useNetRequest} from "client/src/context/useNetRequest";
import {useSessionStorage} from "client/src/hooks/useSessionStorage";
import {useCallback, useEffect, useRef, useState} from "react";

export function useManageCard() {
  const station = useNetRequest("station");
  const [currentCard, setCurrentCard] = useSessionStorage(
    `currentCard-${station.name}`,
    station.cards[0]?.component || ""
  );

  useEffect(() => {
    if (
      currentCard !== "" &&
      !station.cards.some(c => c.component === currentCard)
    ) {
      setCurrentCard(station.cards[0]?.component || "");
    }
  }, [currentCard, station.cards]);
  const cardChanged = useRef(false);

  const changeCard = useCallback(
    (component: string) => {
      const card = station.cards.find(c => c.component === component);
      if (cardChanged.current || !card || currentCard === component) return;
      cardChanged.current = true;
      setTimeout(() => (cardChanged.current = false), 500);
      // TODO: Add handler for card change sound effect
      setCurrentCard(component);
    },
    [currentCard, station.cards]
  );
  const card =
    station.cards.find(c => c.component === currentCard) || station.cards[0];

  // TODO: Add something to manage remotely changing cards from core, if we ever add that ability.
  return [card, changeCard] as const;
}
