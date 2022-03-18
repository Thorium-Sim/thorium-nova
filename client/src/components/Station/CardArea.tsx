import Login from "client/src/cards/Login";
import Offline from "client/src/cards/Offline";
import * as Cards from "client/src/cards";
import {ComponentType, Fragment, Suspense, useState} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {Transition} from "@headlessui/react";
import {CardProps} from "./CardProps";
import {useClientData} from "client/src/context/useCardData";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import CardProvider from "client/src/context/CardContext";

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

const transitionProps = {
  className: "w-full h-full absolute",
  enter: "card-transition-enter",
  enterFrom: "card-transition-enter-from",
  enterTo: "card-transition-enter-to",
  leave: "card-transition-leave pointer-events-none",
  leaveFrom: "card-transition-leave-from",
  leaveTo: "card-transition-leave-to",
};

export const CardArea: React.FC<{
  card: ReturnType<typeof useClientData>["station"]["cards"][0];
}> = ({card}) => {
  const {client, station} = useClientData();
  const CardComponents = station.cards.map(card => ({
    ...card,
    CardComponent: Cards[card.component as keyof typeof Cards],
  }));
  return (
    <Fragment>
      <Transition show={!client.loginName} {...transitionProps}>
        <Login />
      </Transition>
      <Transition show={Boolean(client.offlineState)} {...transitionProps}>
        <Offline />
      </Transition>
      {CardComponents.map(({CardComponent, component, name}) => (
        <CardRenderer
          key={name}
          CardComponent={CardComponent}
          id={component}
          currentCardId={card.component}
        />
      ))}
    </Fragment>
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
  const {client} = useClientData();
  const allowCard = Boolean(client.loginName) && !client.offlineState;
  const [cardLoaded, setCardLoaded] = useState(false);
  const show = allowCard && currentCardId === id;
  return (
    <CardProvider cardName={id}>
      <Transition
        key={id}
        show={show}
        {...transitionProps}
        beforeEnter={() => {
          setCardLoaded(false);
        }}
        afterEnter={() => {
          setCardLoaded(true);
        }}
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
