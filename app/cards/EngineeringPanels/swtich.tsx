import "./switch.css";
export function Switch() {
	return (
		<label className="panel-switch">
			<input type="checkbox" />
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
