import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./triSwitch.css";
import { useId } from "react";

export function TriSwitch({ value, update }: ElementProps) {
	const id = useId();
	return (
		<div className="tri-switch">
			<input
				type="checkbox"
				name="lever"
				className="lever"
				id={id}
				role="switch"
				aria-label="lever"
				checked={value === 1}
				onChange={(e) => update(e.currentTarget.checked ? 1 : 0)}
			/>
			<label htmlFor={id}>
				<span>On</span>
			</label>
			<label htmlFor={id}>
				<span>Off</span>
			</label>
		</div>
	);
}
