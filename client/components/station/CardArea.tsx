import Login from "client/cards/Login";
import Offline from "client/cards/Offline";
import {useClientData} from "../clientLobby/ClientContext";
import * as Cards from "client/cards";
import {ComponentType, Fragment, LazyExoticComponent, Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {useTranslation} from "react-i18next";
import {Transition} from "@headlessui/react";
import Viewscreen from "../viewscreen";
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

  if (!client.loginName) {
    // Return the Login card
    return <Login />;
  }
  if (client.offlineState) {
    // Return the offline card
    <Offline />;
  }
  const allCards = Cards as Record<string, LazyExoticComponent<ComponentType>>;

  const CardComponents = station.cards.map(card => ({
    ...card,
    CardComponent: allCards[card.component],
  }));
  return (
    <Fragment>
      {CardComponents.map(({CardComponent, id}) => (
        <Transition
          key={id}
          show={card.id === id}
          className="w-full h-full absolute"
          enter="card-transition-enter"
          enterFrom="card-transition-enter-from"
          enterTo="card-transition-enter-to"
          leave="card-transition-leave"
          leaveFrom="card-transition-leave-from"
          leaveTo="card-transition-leave-to"
        >
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
