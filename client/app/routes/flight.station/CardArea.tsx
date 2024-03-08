import Login from "@client/cards/Login";
import Offline from "@client/cards/Offline";
import * as Cards from "@client/cards";
import {ComponentType, Fragment, Suspense, useState} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {Transition} from "@headlessui/react";
import {CardProps} from "./CardProps";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import CardProvider from "@client/context/CardContext";
import {q} from "@client/context/AppContext";

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
  card: {component: string};
}> = ({card}) => {
  const [client] = q.client.get.useNetRequest();
  const [station] = q.station.get.useNetRequest();
  const CardComponents = station.cards.map(card => ({
    ...card,
    CardComponent: Cards[card.component as keyof typeof Cards],
  }));
  return (
    <Fragment>
      <Transition
        show={!client.loginName && station.name !== "Viewscreen"}
        {...transitionProps}
      >
        <Login />
      </Transition>
      <Transition show={Boolean(client.offlineState)} {...transitionProps}>
        <Offline />
      </Transition>
      {CardComponents.map(({CardComponent, component, name}) => (
        <CardRenderer
          CardComponent={CardComponent}
          id={component}
          currentCardId={card.component}
          key={name}
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
  const [client] = q.client.get.useNetRequest();
  const [station] = q.station.get.useNetRequest();
  const allowCard =
    (station.name === "Viewscreen" || Boolean(client.loginName)) &&
    !client.offlineState;
  const show = allowCard && currentCardId === id;
  const [cardLoaded, setCardLoaded] = useState(show);
  return (
    <CardProvider cardName={id}>
      <Transition
        key={id}
        show={show}
        {...transitionProps}
        unmount={false}
        afterLeave={() => {
          setCardLoaded(false);
        }}
        beforeEnter={() => {
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
