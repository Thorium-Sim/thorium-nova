import { useStation } from "@thorium/routes/station/useStation";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { cn } from "@thorium/utils/cn";
import { kebabCase } from "change-case";

const CardButton: React.FC<{
	active: boolean;
	highlight: boolean;
	name: string;
	component: string;
	icon: string | null;
	onClick: () => void;
}> = ({ active, highlight, name, component, icon, onClick }) => {
	const iconUrl = icon || `/assets/cardIcons/${component}.svg`;
	return (
		<button
			id={`card-button-${kebabCase(name)}`}
			className={cn(
				`card-switcher-button`,
				{ active, highlight },
				`card-button-${kebabCase(name)}`,
			)}
			onClick={onClick}
		>
			<SVGImageLoader className="card-switcher-button-icon h-24 w-24" url={iconUrl} />
			<span className="card-switcher-button-name">{name}</span>
			{/* TODO: Figure out some way to switch between static text and a tooltip */}
		</button>
	);
};

export const CardSwitcher: React.FC<{
	card: string;
	changeCard: (id: string) => void;
}> = ({ card, changeCard }) => {
	const { station } = useStation();
	if (station.cards.length < 2) return null;
	return (
		<div className="card-switcher-holder absolute right-0">
			<div className="card-switcher">
				{station.cards.map((c) => (
					<CardButton
						key={c.name}
						active={card === c.name}
						highlight={!!c.highlight}
						name={c.name}
						icon={c.icon || null}
						component={c.component}
						onClick={() => changeCard(c.component)}
					/>
				))}
			</div>
		</div>
	);
};
