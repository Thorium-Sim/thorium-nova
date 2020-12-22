import Login from "client/cards/Login";
import Offline from "client/cards/Offline";
import {useClientData} from "../clientLobby/ClientContext";
import * as Cards from "client/cards";
import {
  ComponentType,
  Fragment,
  LazyExoticComponent,
  Suspense,
  useState,
} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useTranslation} from "react-i18next";
import {Transition} from "@headlessui/react";
import {CardProps} from "./CardProps";

const CardError = () => {
  const {t} = useTranslation();
  return (
    <div className={"card-error"}>
      <p className="offline-title">{t("Station Error")}</p>
      <p className="offline-message">
        {t(
          `Your station has experienced an error. A diagnostic must be performed to restore this station to functionality. Please contact a computer specialist.`
        )}
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
  const allCards = Cards as Record<
    string,
    LazyExoticComponent<ComponentType<CardProps>>
  >;

  const CardComponents = station.cards.map(card => ({
    ...card,
    CardComponent: allCards[card.component],
  }));

  return (
    <Fragment>
      <Transition show={!client.loginName} {...transitionProps}>
        <Login />
      </Transition>
      <Transition show={Boolean(client.offlineState)} {...transitionProps}>
        <Offline />
      </Transition>
      {CardComponents.map(({CardComponent, id}) => (
        <CardRenderer
          key={id}
          CardComponent={CardComponent}
          id={id}
          currentCardId={card.id}
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
      <Suspense fallback={null}>
        <ErrorBoundary fallback={<CardError />}>
          <CardComponent cardLoaded={cardLoaded} />
        </ErrorBoundary>
      </Suspense>
    </Transition>
  );
};
