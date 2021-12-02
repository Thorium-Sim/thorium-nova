import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {netSend} from "client/src/context/netSend";
import {useThoriumAccount} from "client/src/context/ThoriumAccountContext";
import {useClientData} from "client/src/context/useCardData";
import {RiLogoutCircleRLine} from "react-icons/ri";
import {CardArea} from "./CardArea";
import {CardSwitcher} from "./CardSwitcher";
import {useManageCard} from "./useManageCard";
import {ClickWidget} from "./widgets";

const StationLayout = () => {
  const {ship, client, station, theme} = useClientData();
  const [card, changeCard] = useManageCard();

  if (!ship) throw new Promise(() => {});
  // TODO November 29, 2021: Get the proper alert level and put it here.
  const alertLevel = 5;
  const {account} = useThoriumAccount();
  console.log(JSON.stringify(theme, null, 2));
  return (
    <div id="theme-container" className="h-full w-full">
      <div
        className={`alertLevel-${alertLevel} h-full`}
        style={
          {
            ["--ship-name-width"]: `${ship.components.identity?.name.length}ch`,
            ["--station-name-width"]: `${station.name.length}ch`,
            ["--card-name-width"]: `${card.name.length}ch`,
            ["--login-name-width"]: `${client.loginName?.length || 0}ch`,
          } as any
        }
      >
        <link rel="stylesheet" href={theme?.assets.processedCSS} />
        <CardSwitcher card={card.name} changeCard={changeCard} />
        <div className="card-frame h-screen">
          <div className="card-frame-inner h-full w-full absolute">
            <div className="card-frame-ship-name select-none">
              {ship.components.identity?.name}
            </div>
            {ship.components.isShip?.assets.logo && (
              <div className="card-frame-ship-logo w-24 h-24">
                <SVGImageLoader
                  className="card-frame-ship-logo-image"
                  url={ship.components.isShip?.assets.logo}
                />
              </div>
            )}
            <div className="card-frame-station-name select-none">
              {station.name}
            </div>
            <div className="card-frame-station-logo text-white w-24 h-24">
              <SVGImageLoader
                className="card-frame-station-logo-image"
                url={station.logo}
              />
            </div>
            <div className="card-frame-card-name select-none">{card.name}</div>
            <div className="card-frame-card-icon w-24 h-24">
              <SVGImageLoader
                className="card-frame-card-icon-image"
                url={card.icon || ""}
              />
            </div>
            <div className="card-frame-login-name select-none">
              {client.loginName}
            </div>
            {/* TODO: Add this once we get Thoriumsim.com accounts */}
            <div className="card-frame-login-profile w-24 h-24">
              <img
                draggable="false"
                aria-hidden
                className="card-frame-login-profile-image"
                src={account.profilePictureUrl}
                alt={account.displayName}
              />
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
          </div>
          <div className="card-area relative h-full">
            <CardArea card={card} />
          </div>
        </div>
        <div className="widgets flex space-x-2 absolute bottom-8 right-[calc(2rem+50px)]">
          {/* <Widget icon={RiPictureInPictureLine} component={ViewscreenWidget} /> */}
          <ClickWidget
            icon={RiLogoutCircleRLine}
            onClick={() => netSend("clientLogout")}
          />
        </div>
      </div>
    </div>
  );
};

export default StationLayout;
