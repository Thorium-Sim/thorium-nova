import * as Cards from "@thorium/cards";
import { Login } from "@thorium/cards/Login";
import Offline from "@thorium/cards/Offline";
import { clientId, q } from "@thorium/context/AppContext";
import CardProvider, { type Card } from "@thorium/context/CardContext";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { Transition } from "@thorium/ui/Transition";
import { type ComponentType, Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import type { CardProps } from "../../cards/CardProps";

const CardError = () => {
	return (
		<div className={"card-error"}>
			<p className="offline-title">Station Error</p>
			<p className="offline-message">
				Your station has experienced an error. A diagnostic must be performed to restore this
				station to functionality. Please contact a computer specialist.
			</p>
		</div>
	);
};

export const CardArea: React.FC<{
	card: { component: string };
}> = ({ card }) => {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [station] = q.station.get.useNetRequest({ clientId });
	const CardComponents = station.cards.map((card) => ({
		...card,
		CardComponent: Cards[card.component as keyof typeof Cards],
	}));

	return (
		<div className="fade-in">
			<Transition
				isOpen={!client.loginName && station.name !== "Viewscreen"}
				className="card-transition absolute top-0 left-0 h-full w-full"
			>
				<Login />
			</Transition>
			<Transition
				isOpen={Boolean(client.offlineState)}
				className="card-transition absolute top-0 left-0 h-full w-full"
			>
				<Offline />
			</Transition>
			{CardComponents.map(({ CardComponent, ...rest }) => (
				<CardRenderer
					CardComponent={CardComponent}
					currentCardId={card.component}
					key={rest.component}
					{...rest}
				/>
			))}
		</div>
	);
};

const CardRenderer = ({
	CardComponent,
	currentCardId,
	...rest
}: {
	CardComponent: ComponentType<CardProps>;
	currentCardId: string;
} & Card) => {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [station] = q.station.get.useNetRequest({ clientId });
	const allowCard =
		(station.name === "Viewscreen" || Boolean(client.loginName)) && !client.offlineState;
	const show = allowCard && currentCardId === rest.component;
	const [cardLoaded, setCardLoaded] = useState(show);
	return (
		<CardProvider cardLoaded={cardLoaded} isWidget={false} {...rest}>
			<Transition
				key={rest.component}
				id={rest.component}
				isOpen={show}
				afterLeave={useCallback(() => {
					setCardLoaded(false);
				}, [])}
				beforeEnter={useCallback(() => {
					setCardLoaded(true);
				}, [])}
				className="card-transition @container absolute top-0 left-0 h-full w-full"
			>
				<Suspense fallback={<LoadingSpinner />}>
					<ErrorBoundary fallback={<CardError />}>
						<CardComponent cardLoaded={cardLoaded} />
					</ErrorBoundary>
				</Suspense>
			</Transition>
		</CardProvider>
	);
};
