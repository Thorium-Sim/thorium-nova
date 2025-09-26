import Login from "@thorium/cards/Login";
import Offline from "@thorium/cards/Offline";
import * as Cards from "@thorium/cards";
import {
	type ComponentType,
	Fragment,
	Suspense,
	useCallback,
	useMemo,
	useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { CardProps } from "../../cards/CardProps";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import CardProvider from "@thorium/context/CardContext";
import { q, clientId } from "@thorium/context/AppContext";
import { Transition } from "@thorium/ui/Transition";
import Button from "@thorium/ui/Button";

const CardError = () => {
	return (
		<div className={"card-error"}>
			<p className="offline-title">Station Error</p>
			<p className="offline-message">
				Your station has experienced an error. A diagnostic must be performed to
				restore this station to functionality. Please contact a computer
				specialist.
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
				className="w-full h-full absolute card-transition"
			>
				<Login />
			</Transition>
			<Transition
				isOpen={Boolean(client.offlineState)}
				className="w-full h-full absolute card-transition"
			>
				<Offline />
			</Transition>
			{CardComponents.map(({ CardComponent, component, name }) => (
				<CardRenderer
					CardComponent={CardComponent}
					id={component}
					currentCardId={card.component}
					key={name}
				/>
			))}
		</div>
	);
};

const CardRenderer = ({
	CardComponent,
	id,
	currentCardId,
}: {
	CardComponent: ComponentType<CardProps>;
	id: string;
	currentCardId: string;
}) => {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [station] = q.station.get.useNetRequest({ clientId });
	const allowCard =
		(station.name === "Viewscreen" || Boolean(client.loginName)) &&
		!client.offlineState;
	const show = allowCard && currentCardId === id;
	const [cardLoaded, setCardLoaded] = useState(show);
	return (
		<CardProvider cardName={id} cardLoaded={cardLoaded} isWidget={false}>
			<Transition
				key={id}
				id={id}
				isOpen={show}
				afterLeave={useCallback(() => {
					setCardLoaded(false);
				}, [])}
				beforeEnter={useCallback(() => {
					setCardLoaded(true);
				}, [])}
				className="w-full h-full absolute @container card-transition"
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
