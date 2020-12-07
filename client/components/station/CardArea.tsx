import Login from "client/cards/Login";
import Offline from "client/cards/Offline";
import {useClientData} from "../clientLobby/ClientContext";
import * as Cards from "client/cards";
import {ComponentType, Fragment, LazyExoticComponent, Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useTranslation} from "react-i18next";
import {Transition} from "@headlessui/react";

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

export const CardArea: React.FC<{
  card: ReturnType<typeof useClientData>["station"]["cards"][0];
}> = ({card}) => {
  const {client, station} = useClientData();

  const allCards = Cards as Record<string, LazyExoticComponent<ComponentType>>;

  const CardComponents = station.cards.map(card => ({
    ...card,
    CardComponent: allCards[card.component],
  }));

  const transitionProps = {
    className: "w-full h-full absolute",
    enter: "card-transition-enter",
    enterFrom: "card-transition-enter-from",
    enterTo: "card-transition-enter-to",
    leave: "card-transition-leave pointer-events-none",
    leaveFrom: "card-transition-leave-from",
    leaveTo: "card-transition-leave-to",
  };
  const allowCard = Boolean(client.loginName) && !client.offlineState;
  return (
    <Fragment>
      <Transition show={!client.loginName} {...transitionProps}>
        <Login />
      </Transition>
      <Transition show={Boolean(client.offlineState)} {...transitionProps}>
        <Offline />
      </Transition>
      {CardComponents.map(({CardComponent, id}) => (
        <Transition key={id} show={allowCard && card.id === id}>
          <Suspense fallback={null}>
            <ErrorBoundary fallback={<CardError />}>
              <CardComponent />
            </ErrorBoundary>
          </Suspense>
        </Transition>
      ))}
    </Fragment>
  );
};
