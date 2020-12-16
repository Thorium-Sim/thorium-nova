import {
  useShipAlertLevelSubscription,
  useThemeQuery,
  useLogoutMutation,
} from "client/generated/graphql";
import {
  ComponentPropsWithoutRef,
  ComponentType,
  FC,
  useCallback,
  useRef,
  useState,
} from "react";
import {useClientData} from "../clientLobby/ClientContext";
import Viewscreen from "../viewscreen";
import {CardSwitcher} from "./CardSwitcher";
import {Effects} from "./Effects";
import {CardArea} from "./CardArea";
import {css} from "@emotion/core";
import {SVGImageLoader} from "./SvgImageLoader";
import {RiLogoutCircleRLine, RiPictureInPictureLine} from "react-icons/ri";
import {usePip} from "client/helpers/hooks/usePip";
import {animated} from "react-spring";
import {FaTimes} from "react-icons/fa";
const StationViewer: FC<{alertLevel?: string}> = ({alertLevel}) => {
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
        <StationLayout alertLevel={alertLevel} />
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

const StationLayout: React.FC<{alertLevel?: string}> = ({
  alertLevel: alertLevelProp = "5",
}) => {
  const {ship, client, station} = useClientData();
  const [card, changeCard] = useManageCard();
  const {data: alertLevelData} = useShipAlertLevelSubscription();
  const {data: themeData} = useThemeQuery({
    variables: {themeId: ship.theme.value},
  });
  const [logout] = useLogoutMutation();
  const alertLevel =
    alertLevelData?.shipAlertLevel?.alertLevel.alertLevel || alertLevelProp;
  const cardIcon = `/assets/cardIcons/${card.component}.svg`;
  const stationLogo = `/assets/stationLogos/${station.name}.svg`;

  if (!themeData?.theme.processedCSS) return null;
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
      <style
        dangerouslySetInnerHTML={{__html: themeData?.theme.processedCSS || ""}}
      />
      <CardSwitcher cardId={card.id} changeCard={changeCard} />
      <div className="card-frame">
        <div className="card-frame-ship-name select-none">
          {ship.identity.name}
        </div>
        {ship.shipAssets?.logo && (
          <div className="card-frame-ship-logo">
            <SVGImageLoader
              className="card-frame-ship-logo-image"
              url={ship.shipAssets?.logo}
            />
          </div>
        )}
        <div className="card-frame-station-name select-none">
          {station.name}
        </div>
        <div className="card-frame-station-logo">
          <SVGImageLoader
            className="card-frame-station-logo-image"
            url={station.logo || stationLogo}
          />
        </div>
        <div className="card-frame-card-name select-none">{card.name}</div>
        <div className="card-frame-card-icon">
          <SVGImageLoader
            className="card-frame-card-icon-image"
            url={card.icon || cardIcon}
          />
        </div>
        <div className="card-frame-login-name select-none">
          {client.loginName}
        </div>
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
        <div
          className="card-area relative"
          css={css`
            & > div {
              height: 100%;
              width: 100%;
            }
          `}
        >
          <CardArea card={card} />
        </div>
      </div>
      <div
        className="widgets flex space-x-2"
        css={css`
          position: absolute;
          bottom: 2rem;
          right: calc(2rem + 50px);
        `}
      >
        <Widget icon={RiPictureInPictureLine} component={ViewscreenWidget} />
        <ClickWidget icon={RiLogoutCircleRLine} onClick={() => logout()} />
      </div>
    </div>
  );
};

type IconType = ComponentType<
  ComponentPropsWithoutRef<typeof RiPictureInPictureLine>
>;
const ClickWidget: FC<{icon: IconType; onClick: () => void}> = ({
  icon: Icon,
  onClick,
}) => {
  return (
    <div
      className="widget"
      css={css`
        & > svg {
          height: 1.5rem;
          width: 1.5rem;
          cursor: pointer;
        }
      `}
    >
      <Icon onClick={onClick} className="widget-icon" />
    </div>
  );
};
const Widget: FC<{
  icon: IconType;
  component: ComponentType<{close: () => void}>;
}> = ({icon: Icon, component: Component}) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="widget"
      css={css`
        & > svg {
          height: 1.5rem;
          width: 1.5rem;
          cursor: pointer;
        }
      `}
    >
      <Icon onClick={() => setOpen(true)} className="widget-icon" />
      {open && <Component close={() => setOpen(false)} />}
    </div>
  );
};

const ViewscreenWidget: FC<{close: () => void}> = ({close}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [props, styles] = usePip(ref);
  return (
    <animated.div
      className="widget-body"
      ref={ref}
      {...props()}
      style={{...styles}}
      css={css`
        z-index: 100;
        min-width: 10rem;
        min-height: 10rem;
        background-color: #333;
        pointer-events: all;
        cursor: grab;
        &:active {
          cursor: grabbing;
        }
        &:hover .close-button {
          opacity: 1;
        }
      `}
    >
      <div
        css={css`
          width: 640px;
          height: 360px;
          pointer-events: none;
        `}
        className="relative "
      >
        <Viewscreen />
      </div>
      <FaTimes
        className="close-button absolute p-1 text-2xl top-1 right-1 rounded-full bg-whiteAlpha-200 text-white hover:bg-whiteAlpha-300 cursor-pointer transition-opacity opacity-0"
        onClick={close}
      ></FaTimes>
    </animated.div>
  );
};
export default StationViewer;
