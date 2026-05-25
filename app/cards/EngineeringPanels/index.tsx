import { Cables, CablesWrapper } from "@thorium/cards/EngineeringPanels/cables";

import "./style.css";
import { Keypad } from "@thorium/cards/EngineeringPanels/keypad";
import { PanelSlider } from "@thorium/cards/EngineeringPanels/panelSlider";
import { PushButton } from "@thorium/cards/EngineeringPanels/pushButton";
import { Rotor } from "@thorium/cards/EngineeringPanels/rotor";
import { Switch } from "@thorium/cards/EngineeringPanels/swtich";
import { TriSwitch } from "@thorium/cards/EngineeringPanels/triSwitch";

export function EngineeringPanels() {
	return (
		<CablesWrapper>
			<div className="panel-grid grid h-full w-full grid-cols-6 grid-rows-[repeat(4,1fr_2rem)] gap-2">
				<div className="panel-cell">
					<PushButton />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<Switch />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<TriSwitch />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<Rotor />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<PanelSlider />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<Cables />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell row-span-4!">
					<Keypad />
					<p>4-LOM Actuator</p>
				</div>
				<div className="panel-cell">
					<Cables />
					<p>4-LOM Actuator</p>
				</div>
			</div>
		</CablesWrapper>
	);
}
