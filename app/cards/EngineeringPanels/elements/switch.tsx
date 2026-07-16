import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./switch.css";
export function Switch({ color = "#00ff00", update, value }: { color?: string } & ElementProps) {
	return (
		<label
			className="panel-switch"
			style={
				// @ts-expect-error
				{ "--color": color }
			}
		>
			<input
				type="checkbox"
				checked={value === 1}
				onChange={(e) => update(e.currentTarget.checked ? 1 : 0)}
			/>
			<div className="panel-button cursor-pointer">
				<div className="panel-light"></div>
				<div className="panel-dots"></div>
				<div className="panel-characters"></div>
				<div className="panel-shine"></div>
				<div className="panel-shadow"></div>
			</div>
		</label>
	);
}
