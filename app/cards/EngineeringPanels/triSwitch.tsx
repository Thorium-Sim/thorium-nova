import "./triSwitch.css";
import { useId } from "react";

export function TriSwitch() {
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
				aria-checked="false"
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
