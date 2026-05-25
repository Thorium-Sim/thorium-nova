import "./panelSlider.css";

export function PanelSlider({ max = 4 }: { max?: number }) {
	return (
		<div className="panel-slider">
			<div className="labels">
				{Array.from({ length: max }).map((_, i) => (
					<p key={i} className="label">
						{i + 1}
					</p>
				))}
			</div>
			<input type="range" min="1" max={max} step="1" />
		</div>
	);
}
