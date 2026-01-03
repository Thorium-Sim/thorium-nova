import { q, clientId } from "@thorium/context/AppContext";
import { useCallback, useRef } from "react";

export function useManageCard() {
	const [station] = q.station.get.useNetRequest({ clientId });
	const [client] = q.client.get.useNetRequest({ clientId });
	const currentCard = client.currentCard || station.cards[0].component;

	const cardChanged = useRef(false);

	const changeCard = useCallback(
		async (component: string) => {
			const card = station.cards.find((c) => c.component === component);
			if (cardChanged.current || !card || currentCard === component) return;
			cardChanged.current = true;
			setTimeout(() => {
				cardChanged.current = false;
			}, 500);
			// TODO: Add handler for card change sound effect
			q.client.setCard.netSend({ clientId, card: component });
		},
		[currentCard, station?.cards],
	);
	const card =
		station?.cards.find((c) => c.component === currentCard) ||
		station?.cards[0];

	return [card, changeCard] as const;
}
