import {useClientData} from "client/src/context/useCardData";
import {useCallback, useRef, useState} from "react";

export function useManageCard() {
  const {station} = useClientData();
  const [currentCard, setCurrentCard] = useState(
    station.cards[0]?.component || ""
  );
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
