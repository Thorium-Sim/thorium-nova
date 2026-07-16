import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./panelSlider.css";

export function PanelSlider({ max = 4, update, value }: { max?: number } & ElementProps) {
	return (
		<div className="panel-slider w-full">
			<div className="labels">
				{Array.from({ length: max }).map((_, i) => (
					<p key={i} className="label">
						{i + 1}
					</p>
				))}
			</div>
			<input
				type="range"
				min="1"
				max={max}
				step="1"
				value={value}
				onChange={(e) => update(Number(e.currentTarget.value))}
			/>
		</div>
	);
}
