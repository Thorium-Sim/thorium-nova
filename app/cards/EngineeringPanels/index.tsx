import { Cables, CablesWrapper } from "@thorium/cards/EngineeringPanels/elements/cables";

import "./style.css";
import { Keypad } from "@thorium/cards/EngineeringPanels/elements/keypad";
import { PanelSlider } from "@thorium/cards/EngineeringPanels/elements/panelSlider";
import { PushButton } from "@thorium/cards/EngineeringPanels/elements/pushButton";
import { Rotor } from "@thorium/cards/EngineeringPanels/elements/rotor";
import { Switch } from "@thorium/cards/EngineeringPanels/elements/switch";
import { TriSwitch } from "@thorium/cards/EngineeringPanels/elements/triSwitch";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { engineeringPanelElementConfig } from "@thorium/ecs-components/engineeringPanelElementConfig";
import { cn } from "@thorium/utils/cn";
import { useCallback } from "react";
import type { z } from "zod";

const PanelComponents = {
	numberedRotor: Rotor,
	numberPad: Keypad,
	numberedSlider: PanelSlider,
	pressButton: PushButton,
	switch: Switch,
	triSwitch: TriSwitch,
	cableSocket: Cables,
};
export function EngineeringPanels() {
	const card = useCardContext();
	if (card.component !== "EngineeringPanels" || !("config" in card) || !card.config?.panelId) {
		console.error(card);
		throw new Error("Invalid Panel Configuration");
	}

	const [panel] = q.engineeringPanels.get.useNetRequest({ panelId: card.config.panelId });

	let remainingCells = panel.elements.reduce((prev, next) => {
		prev -= 2;
		if (next.element.type === "numberPad") prev -= 1;
		if (next.element.type === "numberedSlider") prev -= 1;
		if (next.element.type === "switch") prev += 1;
		return prev;
	}, 48);

	return (
		<CablesWrapper panelId={card.config.panelId}>
			<div className="panel-grid grid h-full w-full grid-cols-12 grid-rows-[repeat(4,1fr_2rem)] gap-2">
				{panel.elements
					// Put switches last so they fill in gaps
					.sort((a, b) => (a.element.type === "switch" ? 1 : b.element.type === "switch" ? -1 : 0))
					.map((e) => {
						const Comp = PanelComponents[e.element.type];
						if (!Comp) return null;
						let extraClass = "";
						let innerExtraClass = "";
						if (remainingCells > 0) {
							switch (e.element.type) {
								case "cableSocket":
								case "numberedRotor":
								case "pressButton":
									if (remainingCells - 2 >= 0) {
										extraClass = "col-span-3 row-span-4!";
										innerExtraClass = "row-span-3";
										remainingCells -= 2;
									}
									break;
								case "triSwitch":
									if (remainingCells - 1 >= 0) {
										extraClass = "col-span-3";
										remainingCells -= 1;
									}
							}
						}
						return (
							<div
								key={e.id}
								className={cn(
									"panel-cell col-span-2",
									{
										"row-span-4!": e.element.type === "numberPad",
										"col-span-3": e.element.type === "numberedSlider",
										"col-span-1": e.element.type === "switch",
									},
									extraClass,
								)}
							>
								<ComponentWrapper
									className={innerExtraClass}
									id={e.id}
									state={e.state}
									{...e.element}
								/>
								<p>{e.name}</p>
							</div>
						);
					})}
			</div>
		</CablesWrapper>
	);
}

function ComponentWrapper({
	id,
	type,
	className,
	state: value,
	...rest
}: { className: string; id: number; state: number } & z.infer<
	typeof engineeringPanelElementConfig
>) {
	const update = useCallback(
		async (value: number) => q.engineeringPanels.updateElement.netSend({ elementId: id, value }),
		[],
	);
	const Comp = PanelComponents[type];

	return <Comp {...rest} elementId={id} className={className} value={value} update={update} />;
}
