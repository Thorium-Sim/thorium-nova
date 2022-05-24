import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useNetRequest} from "client/src/context/useNetRequest";

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
      <SVGImageLoader
        className="card-switcher-button-icon w-24 h-24"
        url={iconUrl}
      />
      <span className="card-switcher-button-name">{name}</span>
      {/* TODO: Figure out some way to switch between static text and a tooltip */}
    </div>
  );
};

export const CardSwitcher: React.FC<{
  card: string;
  changeCard: (id: string) => void;
}> = ({card, changeCard}) => {
  const station = useNetRequest("station");
  return (
    <div className="card-switcher-holder absolute right-0">
      <div className="card-switcher">
        {station.cards.map(c => (
          <CardButton
            key={c.name}
            active={card === c.name}
            name={c.name}
            icon={c.icon || null}
            component={c.component}
            onClick={() => changeCard(c.component)}
          ></CardButton>
        ))}
      </div>
    </div>
  );
};
