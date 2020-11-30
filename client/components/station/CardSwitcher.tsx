import {useClientData} from "../clientLobby/ClientContext";
import {SVGImageLoader} from "./SvgImageLoader";

const CardButton: React.FC<{
  active: boolean;
  name: string;
  component: string;
  icon: string | null;
  onClick: () => void;
}> = ({active, name, component, icon, onClick}) => {
  const iconUrl = icon || `/assets/cardIcons/${component}.svg`;
  return (
    <div
      className={`card-switcher-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <SVGImageLoader className="card-switcher-button-icon" url={iconUrl} />
      <span className="card-switcher-button-name">{name}</span>
      {/* TODO: Figure out some way to switch between static text and a tooltip */}
    </div>
  );
};
export const CardSwitcher: React.FC<{
  cardId: string;
  changeCard: (id: string) => void;
}> = ({cardId, changeCard}) => {
  const {station} = useClientData();
  return (
    <div className="card-switcher-holder">
      <div className="card-switcher">
        {station.cards.map(card => (
          <CardButton
            key={card.id}
            active={cardId === card.id}
            name={card.name}
            icon={card.icon}
            component={card.component}
            onClick={() => changeCard(card.id)}
          ></CardButton>
        ))}
      </div>
    </div>
  );
};
