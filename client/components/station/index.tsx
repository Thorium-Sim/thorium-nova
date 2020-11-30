import {useShipAlertLevelSubscription} from "client/generated/graphql";
import {FC, useCallback, useEffect, useRef, useState} from "react";
import {useClientData} from "../clientLobby/ClientContext";
import Viewscreen from "../viewscreen";
import {CardSwitcher} from "./CardSwitcher";
import {Effects} from "./Effects";
import {CardArea} from "./CardArea";
import {css} from "@emotion/core";
import {SVGImageLoader} from "./SvgImageLoader";
const StationViewer: FC = () => {
  const {client, station} = useClientData();
  // TODO: Include sound player here
  // TODO: Include some kind of alert toast notification thing here
  return (
    <div className="bg-black absolute z-1 h-full w-full top-0">
      <Effects />
      {client.offlineState !== "Blackout" && station.name === "Viewscreen" && (
        <Viewscreen />
      )}
      {client.offlineState !== "Blackout" && station.name !== "Viewscreen" && (
        <StationLayout />
      )}
    </div>
  );
};

function useManageCard() {
  const {station} = useClientData();
  const [currentCard, setCurrentCard] = useState(station.cards[0]?.id || "");
  const cardChanged = useRef(false);

  const changeCard = useCallback(
    (id: string) => {
      const card = station.cards.find(c => c.id === id);
      if (cardChanged.current || !card || currentCard === id) return;
      cardChanged.current = true;
      setTimeout(() => (cardChanged.current = false), 500);
      // TODO: Add handler for card change sound effect
      setCurrentCard(id);
    },
    [currentCard, station.cards]
  );
  const card =
    station.cards.find(c => c.id === currentCard) || station.cards[0];

  // TODO: Add something to manage remotely changing cards from core, if we ever add that ability.
  return [card, changeCard] as const;
}

const StationLayout = () => {
  const {ship, client, station} = useClientData();
  const [card, changeCard] = useManageCard();
  const {data: alertLevelData} = useShipAlertLevelSubscription();
  const alertLevel =
    alertLevelData?.shipAlertLevel?.alertLevel.alertLevel || "5";
  const cardIcon = `/assets/cardIcons/${card.component}.svg`;
  const stationLogo = `/assets/stationLogos/${station.name}.svg`;
  return (
    <div
      id="theme-container"
      className={`alertLevel-${alertLevel} h-full`}
      css={css`
        --ship-name-width: ${ship.identity.name.length}ch;
        --station-name-width: ${station.name.length}ch;
        --card-name-width: ${card.name.length}ch;
        --login-name-width: ${client.loginName?.length || 0}ch;
      `}
    >
      <CardSwitcher cardId={card.id} changeCard={changeCard} />
      <div className="card-frame">
        <div className="card-frame-ship-name">{ship.identity.name}</div>
        {ship.shipAssets?.logo && (
          <div className="card-frame-ship-logo">
            <SVGImageLoader
              className="card-frame-ship-logo-image"
              url={ship.shipAssets?.logo}
            />
          </div>
        )}
        <div className="card-frame-station-name">{station.name}</div>
        <div className="card-frame-station-logo">
          <SVGImageLoader
            className="card-frame-station-logo-image"
            url={station.logo || stationLogo}
          />
        </div>
        <div className="card-frame-card-name">{card.name}</div>
        <div className="card-frame-card-icon">
          <SVGImageLoader
            className="card-frame-card-icon-image"
            url={card.icon || cardIcon}
          />
        </div>
        <div className="card-frame-login-name">{client.loginName}</div>
        {/* TODO: Add this once we get Thoriumsim.com accounts */}
        <div className="card-frame-login-profile">
          {/* <img
            draggable="false"
            aria-hidden
            className="card-frame-login-profile-image"
            src={card.icon || cardIcon}
          /> */}
        </div>
        <div className="doodad-1 absolute"></div>
        <div className="doodad-2 absolute"></div>
        <div className="doodad-3 absolute"></div>
        <div className="doodad-4 absolute"></div>
        <div className="doodad-5 absolute"></div>
        <div className="doodad-6 absolute"></div>
        <div className="doodad-7 absolute"></div>
        <div className="doodad-8 absolute"></div>
        <div className="doodad-9 absolute"></div>
        <div className="doodad-10 absolute"></div>
        <div className="card-area relative">
          <CardArea card={card} />
        </div>
      </div>
      {/* TODO: Figure out what you are going to do with widgets. WOOF. */}
      {/* <Widgets /> */}
    </div>
  );
};
export default StationViewer;
