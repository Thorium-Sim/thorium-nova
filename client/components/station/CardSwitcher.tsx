import {useClientData} from "../clientLobby/ClientContext";

const CardButton: React.FC<{
  active: boolean;
  name: string;
  icon: string | null;
  onClick: () => void;
}> = ({children, active, name, icon, onClick}) => {
  const iconUrl = icon || `/cardIcons/${name}.svg`;
  return (
    <div
      className={`card-switcher-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <img
        alt={name}
        className="card-switcher-button-icon"
        src={iconUrl}
        draggable="false"
      />
      <span className="card-switcher-button-name">{children}</span>
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
            onClick={() => changeCard(card.id)}
          ></CardButton>
        ))}
      </div>
    </div>
  );
};
