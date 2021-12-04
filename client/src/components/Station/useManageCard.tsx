import {useClientData} from "client/src/context/useCardData";
import {useCallback, useRef, useState} from "react";

export function useManageCard() {
  const {station} = useClientData();
  const [currentCard, setCurrentCard] = useState(station.cards[0]?.name || "");
  const cardChanged = useRef(false);

  const changeCard = useCallback(
    (name: string) => {
      const card = station.cards.find(c => c.name === name);
      if (cardChanged.current || !card || currentCard === name) return;
      cardChanged.current = true;
      setTimeout(() => (cardChanged.current = false), 500);
      // TODO: Add handler for card change sound effect
      setCurrentCard(name);
    },
    [currentCard, station.cards]
  );
  const card =
    station.cards.find(c => c.name === currentCard) || station.cards[0];

  // TODO: Add something to manage remotely changing cards from core, if we ever add that ability.
  return [card, changeCard] as const;
}
